'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import type {
  FixtureDto,
  LiveOddsMarketDto,
  LiveOddsSummaryDto,
  LiveOddsSummaryUpdatedDto,
  LiveOddsUpdatedDto,
  PagedResultDto,
} from '@/lib/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://smartbets-fqzk.onrender.com';

export type LiveOddsRealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type LiveOddsMovementDirection = 'up' | 'down';
export type LiveOddsMovementByFixture = Record<
  number,
  Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>
>;

interface JwtTokenResponseDto {
  accessToken: string | null;
  expiresAtUtc: string;
}

async function fetchJwtToken(): Promise<JwtTokenResponseDto> {
  const res = await fetch('/api/auth/token', {
    method: 'POST',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch JWT token');
  }

  return res.json();
}

async function fetchLiveOdds(fixtureId: string): Promise<LiveOddsMarketDto[]> {
  const res = await fetch(`/api/fixtures/${fixtureId}/odds/live`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch live odds');
  }

  return res.json();
}

function mapSummaryPayload(payload: LiveOddsSummaryUpdatedDto): LiveOddsSummaryDto {
  return {
    source: payload.source,
    collectedAtUtc: payload.collectedAtUtc,
    bestHomeOdd: payload.bestHomeOdd,
    bestHomeBookmaker: payload.bestHomeBookmaker,
    bestDrawOdd: payload.bestDrawOdd,
    bestDrawBookmaker: payload.bestDrawBookmaker,
    bestAwayOdd: payload.bestAwayOdd,
    bestAwayBookmaker: payload.bestAwayBookmaker,
  };
}

function getMovementDirection(previousValue: number | null, nextValue: number | null): LiveOddsMovementDirection | null {
  if (previousValue == null || nextValue == null || previousValue === nextValue) {
    return null;
  }

  return nextValue > previousValue ? 'up' : 'down';
}

function getSummaryMovements(
  previousSummary: LiveOddsSummaryDto | null,
  nextSummary: LiveOddsSummaryDto,
): Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> {
  const movement: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> = {};

  const homeMovement = getMovementDirection(previousSummary?.bestHomeOdd ?? null, nextSummary.bestHomeOdd);
  const drawMovement = getMovementDirection(previousSummary?.bestDrawOdd ?? null, nextSummary.bestDrawOdd);
  const awayMovement = getMovementDirection(previousSummary?.bestAwayOdd ?? null, nextSummary.bestAwayOdd);

  if (homeMovement) movement.home = homeMovement;
  if (drawMovement) movement.draw = drawMovement;
  if (awayMovement) movement.away = awayMovement;

  return movement;
}

function findFixtureSummaryInCache(
  fixtureId: number,
  cachedQueries: Array<[unknown, PagedResultDto<FixtureDto> | undefined]>,
): LiveOddsSummaryDto | null {
  for (const [, cachedResult] of cachedQueries) {
    const fixture = cachedResult?.items.find((item) => item.apiFixtureId === fixtureId);
    if (fixture) {
      return fixture.liveOddsSummary ?? null;
    }
  }

  return null;
}

export function useLiveOdds(fixtureId: string, enabled = true) {
  return useQuery({
    queryKey: ['live-odds', fixtureId],
    queryFn: () => fetchLiveOdds(fixtureId),
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    enabled: enabled && !!fixtureId,
  });
}

export function useLiveOddsSignalR(fixtureId: string, enabled = true) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [status, setStatus] = useState<LiveOddsRealtimeStatus>(enabled ? 'connecting' : 'idle');

  useEffect(() => {
    if (!enabled || !fixtureId) {
      setStatus('idle');
      return;
    }

    let disposed = false;
    setStatus('connecting');

    const startConnection = async () => {
      try {
        const token = await fetchJwtToken();
        if (!token.accessToken || disposed) {
          return;
        }

        tokenRef.current = token.accessToken;

        const connection = new HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/live-odds`, {
            accessTokenFactory: async () => tokenRef.current ?? '',
            transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
            withCredentials: false,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.None)
          .build();

        connection.onreconnecting(() => {
          setStatus('reconnecting');
        });

        connection.onreconnected(async () => {
          setStatus('connected');
          await connection.invoke('JoinFixture', Number(fixtureId));
        });

        connection.onclose(() => {
          setStatus(disposed ? 'idle' : 'error');
        });

        connection.on('LiveOddsUpdated', (payload: LiveOddsUpdatedDto) => {
          if (Number(payload.apiFixtureId) !== Number(fixtureId)) {
            return;
          }

          queryClient.setQueryData<LiveOddsMarketDto[]>(['live-odds', fixtureId], payload.markets ?? []);
        });

        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }

        connectionRef.current = connection;

        if (connection.state === HubConnectionState.Connected) {
          await connection.invoke('JoinFixture', Number(fixtureId));
          setStatus('connected');
        }
      } catch {
        setStatus('error');
        // Silent fallback: REST polling remains active even if SignalR is unavailable.
      }
    };

    startConnection();

    return () => {
      disposed = true;
      const connection = connectionRef.current;
      connectionRef.current = null;

      if (connection) {
        void connection.invoke('LeaveFixture', Number(fixtureId)).catch(() => undefined);
        void connection.stop().catch(() => undefined);
      }

      setStatus('idle');
    };
  }, [enabled, fixtureId, queryClient]);

  return status;
}

export function useLiveOddsListSignalR(fixtureIds: number[], enabled = true) {
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const tokenRef = useRef<string | null>(null);
  const movementTimeoutsRef = useRef(new Map<string, number>());
  const [status, setStatus] = useState<LiveOddsRealtimeStatus>(enabled ? 'connecting' : 'idle');
  const [movements, setMovements] = useState<LiveOddsMovementByFixture>({});
  const stableFixtureIds = Array.from(new Set(fixtureIds.filter((fixtureId) => Number.isFinite(fixtureId) && fixtureId > 0))).sort(
    (left, right) => left - right,
  );
  const fixtureIdsKey = stableFixtureIds.join(',');

  useEffect(() => {
    if (!enabled || stableFixtureIds.length === 0) {
      setStatus('idle');
      setMovements({});
      return;
    }

    let disposed = false;
    setStatus('connecting');

    const startConnection = async () => {
      try {
        const token = await fetchJwtToken();
        if (!token.accessToken || disposed) {
          return;
        }

        tokenRef.current = token.accessToken;

        const connection = new HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/live-odds`, {
            accessTokenFactory: async () => tokenRef.current ?? '',
            transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
            withCredentials: false,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.None)
          .build();

        connection.onreconnecting(() => {
          setStatus('reconnecting');
        });

        connection.onreconnected(async () => {
          setStatus('connected');
          await connection.invoke('JoinFixtures', stableFixtureIds);
        });

        connection.onclose(() => {
          setStatus(disposed ? 'idle' : 'error');
        });

        connection.on('LiveOddsSummaryUpdated', (payload: LiveOddsSummaryUpdatedDto) => {
          if (!stableFixtureIds.includes(Number(payload.apiFixtureId))) {
            return;
          }

          const cachedQueries = queryClient.getQueriesData<PagedResultDto<FixtureDto>>({ queryKey: ['fixtures'] });
          const previousSummary = findFixtureSummaryInCache(Number(payload.apiFixtureId), cachedQueries);
          const nextSummary = mapSummaryPayload(payload);
          const movement = getSummaryMovements(previousSummary, nextSummary);

          queryClient.setQueriesData<PagedResultDto<FixtureDto>>({ queryKey: ['fixtures'] }, (current) => {
            if (!current) {
              return current;
            }

            let changed = false;

            const items = current.items.map((fixture) => {
              if (fixture.apiFixtureId !== payload.apiFixtureId) {
                return fixture;
              }

              changed = true;
              return {
                ...fixture,
                liveOddsSummary: nextSummary,
              };
            });

            return changed ? { ...current, items } : current;
          });

          if (Object.keys(movement).length === 0) {
            return;
          }

          setMovements((current) => ({
            ...current,
            [payload.apiFixtureId]: {
              ...(current[payload.apiFixtureId] ?? {}),
              ...movement,
            },
          }));

          (Object.entries(movement) as Array<['home' | 'draw' | 'away', LiveOddsMovementDirection]>).forEach(([outcome]) => {
            const timeoutKey = `${payload.apiFixtureId}:${outcome}`;
            const existingTimeout = movementTimeoutsRef.current.get(timeoutKey);

            if (existingTimeout) {
              window.clearTimeout(existingTimeout);
            }

            const timeout = window.setTimeout(() => {
              setMovements((current) => {
                const fixtureMovement = current[payload.apiFixtureId];
                if (!fixtureMovement?.[outcome]) {
                  return current;
                }

                const nextFixtureMovement = { ...fixtureMovement };
                delete nextFixtureMovement[outcome];

                if (Object.keys(nextFixtureMovement).length === 0) {
                  const nextState = { ...current };
                  delete nextState[payload.apiFixtureId];
                  return nextState;
                }

                return {
                  ...current,
                  [payload.apiFixtureId]: nextFixtureMovement,
                };
              });

              movementTimeoutsRef.current.delete(timeoutKey);
            }, 1800);

            movementTimeoutsRef.current.set(timeoutKey, timeout);
          });
        });

        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }

        connectionRef.current = connection;

        if (connection.state === HubConnectionState.Connected) {
          await connection.invoke('JoinFixtures', stableFixtureIds);
          setStatus('connected');
        }
      } catch {
        setStatus('error');
      }
    };

    startConnection();

    return () => {
      disposed = true;
      const connection = connectionRef.current;
      connectionRef.current = null;

      for (const timeout of movementTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      movementTimeoutsRef.current.clear();

      if (connection) {
        void connection.invoke('LeaveFixtures', stableFixtureIds).catch(() => undefined);
        void connection.stop().catch(() => undefined);
      }

      setStatus('idle');
      setMovements({});
    };
  }, [enabled, fixtureIdsKey, queryClient]);

  return { status, movements };
}
