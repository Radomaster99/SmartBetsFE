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
  LiveOddsViewersHeartbeatDto,
  LiveOddsSummaryDto,
  LiveOddsSummaryUpdatedDto,
  LiveOddsUpdatedDto,
  OddDto,
  PagedResultDto,
} from '@/lib/types/api';
import { deriveBestOddsFromOdds, mapLiveOddsToMainMatchOdds } from '@/lib/live-odds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://smartbets-fqzk.onrender.com';
const LIVE_VIEWER_HEARTBEAT_INTERVAL_MS = 25_000;

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

// Module-level cache so repeated reconnects don't spam /api/auth/token
let _cachedToken: JwtTokenResponseDto | null = null;
let _tokenPromise: Promise<JwtTokenResponseDto> | null = null;

function isCachedTokenValid(): boolean {
  if (!_cachedToken?.accessToken) return false;
  const expiresAt = new Date(_cachedToken.expiresAtUtc).getTime();
  if (!Number.isFinite(expiresAt)) return false;
  // Treat as expired 60 s before actual expiry to avoid using it right at the boundary
  return expiresAt - 60_000 > Date.now();
}

async function fetchJwtToken(): Promise<JwtTokenResponseDto> {
  if (isCachedTokenValid()) {
    return _cachedToken!;
  }

  if (!_tokenPromise) {
    _tokenPromise = fetch('/api/auth/token', {
      method: 'POST',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch JWT token: ${res.status}`);
        }
        const token = (await res.json()) as JwtTokenResponseDto;
        _cachedToken = token;
        return token;
      })
      .finally(() => {
        _tokenPromise = null;
      });
  }

  return _tokenPromise;
}

async function fetchLiveOdds(fixtureId: string): Promise<LiveOddsMarketDto[]> {
  const res = await fetch(`/api/fixtures/${fixtureId}/odds/live`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch live odds');
  }

  return res.json();
}

async function postLiveViewersHeartbeat(fixtureIds: number[]): Promise<LiveOddsViewersHeartbeatDto | null> {
  const res = await fetch('/api/odds/live/viewers/heartbeat', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fixtureIds }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error('Failed to send live viewers heartbeat');
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

export function mapMarketsToSummary(
  markets: LiveOddsMarketDto[],
  options?: { homeTeamName?: string | null; awayTeamName?: string | null },
): LiveOddsSummaryDto | null {
  const odds = mapLiveOddsToMainMatchOdds(markets, options);
  const bestOdds = deriveBestOddsFromOdds(odds);

  if (!bestOdds) {
    return null;
  }

  return {
    source: 'live',
    collectedAtUtc: bestOdds.collectedAtUtc,
    bestHomeOdd: bestOdds.bestHomeOdd,
    bestHomeBookmaker: bestOdds.bestHomeBookmaker,
    bestDrawOdd: bestOdds.bestDrawOdd,
    bestDrawBookmaker: bestOdds.bestDrawBookmaker,
    bestAwayOdd: bestOdds.bestAwayOdd,
    bestAwayBookmaker: bestOdds.bestAwayBookmaker,
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

function findFixtureInCache(
  fixtureId: number,
  cachedQueries: Array<[unknown, PagedResultDto<FixtureDto> | undefined]>,
): FixtureDto | null {
  for (const [, cachedResult] of cachedQueries) {
    const fixture = cachedResult?.items.find((item) => item.apiFixtureId === fixtureId);
    if (fixture) {
      return fixture;
    }
  }

  return null;
}

function isConnectedState(connection: HubConnection): boolean {
  return connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting;
}

async function stopConnectionQuietly(connection: HubConnection | null): Promise<void> {
  if (!connection || connection.state === HubConnectionState.Disconnected) {
    return;
  }

  try {
    await connection.stop();
  } catch {
    // The connection can already be closing during route changes/unmounts.
    // In that case we intentionally suppress the expected cancellation noise.
  }
}

interface LiveOddsQueryOptions {
  staleTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
}

export function useLiveOdds(fixtureId: string, enabled = true, options?: LiveOddsQueryOptions) {
  return useQuery({
    queryKey: ['live-odds', fixtureId],
    queryFn: () => fetchLiveOdds(fixtureId),
    staleTime: options?.staleTime ?? 15_000,
    refetchInterval: enabled ? (options?.refetchInterval ?? false) : false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: enabled && !!fixtureId,
  });
}

type VisibleLiveFixtureSeed = Pick<FixtureDto, 'apiFixtureId' | 'homeTeamName' | 'awayTeamName'>;

export function useVisibleLiveOddsByFixture(
  fixtures: VisibleLiveFixtureSeed[],
  enabled = true,
  options?: LiveOddsQueryOptions,
) {
  const stableFixtures = Array.from(
    new Map(
      fixtures
        .filter((fixture) => Number.isFinite(fixture.apiFixtureId) && fixture.apiFixtureId > 0)
        .map((fixture) => [fixture.apiFixtureId, fixture]),
    ).values(),
  ).sort((left, right) => left.apiFixtureId - right.apiFixtureId);

  const fixtureIdsKey = stableFixtures
    .map((fixture) => `${fixture.apiFixtureId}:${fixture.homeTeamName}:${fixture.awayTeamName}`)
    .join('|');

  return useQuery({
    queryKey: ['visible-live-odds', fixtureIdsKey],
    enabled: enabled && stableFixtures.length > 0,
    staleTime: options?.staleTime ?? 30_000,
    refetchInterval: enabled ? (options?.refetchInterval ?? false) : false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const results = await Promise.all(
        stableFixtures.map(async (fixture) => {
          try {
            const markets = await fetchLiveOdds(String(fixture.apiFixtureId));
            const odds = mapLiveOddsToMainMatchOdds(markets, {
              homeTeamName: fixture.homeTeamName,
              awayTeamName: fixture.awayTeamName,
            });
            return [fixture.apiFixtureId, odds] as const;
          } catch (error) {
            console.error(
              `[useVisibleLiveOddsByFixture] Failed to fetch live odds for fixture ${fixture.apiFixtureId}:`,
              error,
            );
            return [fixture.apiFixtureId, [] as OddDto[]] as const;
          }
        }),
      );

      return Object.fromEntries(results) as Record<number, OddDto[]>;
    },
  });
}

export function useLiveViewersHeartbeat(fixtureIds: number[], enabled = true) {
  const stableFixtureIds = Array.from(
    new Set(fixtureIds.filter((fixtureId) => Number.isFinite(fixtureId) && fixtureId > 0)),
  ).sort((left, right) => left - right);
  const fixtureIdsKey = stableFixtureIds.join(',');
  const [isPageVisible, setIsPageVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isPageVisible || stableFixtureIds.length === 0) {
      return;
    }

    let cancelled = false;

    const sendHeartbeat = async () => {
      try {
        await postLiveViewersHeartbeat(stableFixtureIds);
      } catch (error) {
        if (!cancelled) {
          console.error('[useLiveViewersHeartbeat] Failed to send heartbeat:', error);
        }
      }
    };

    void sendHeartbeat();
    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, LIVE_VIEWER_HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, fixtureIdsKey, isPageVisible]);
}

function applyFixtureSummaryUpdate(
  queryClient: ReturnType<typeof useQueryClient>,
  fixtureId: number,
  nextSummary: LiveOddsSummaryDto,
  setMovements: React.Dispatch<React.SetStateAction<LiveOddsMovementByFixture>>,
  movementTimeoutsRef: React.MutableRefObject<Map<string, number>>,
) {
  const cachedQueries = queryClient.getQueriesData<PagedResultDto<FixtureDto>>({ queryKey: ['fixtures'] });
  const previousSummary = findFixtureSummaryInCache(fixtureId, cachedQueries);
  const movement = getSummaryMovements(previousSummary, nextSummary);

  queryClient.setQueriesData<PagedResultDto<FixtureDto>>({ queryKey: ['fixtures'] }, (current) => {
    if (!current) {
      return current;
    }

    let changed = false;

    const items = current.items.map((fixture) => {
      if (fixture.apiFixtureId !== fixtureId) {
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
    [fixtureId]: {
      ...(current[fixtureId] ?? {}),
      ...movement,
    },
  }));

  (Object.entries(movement) as Array<['home' | 'draw' | 'away', LiveOddsMovementDirection]>).forEach(([outcome]) => {
    const timeoutKey = `${fixtureId}:${outcome}`;
    const existingTimeout = movementTimeoutsRef.current.get(timeoutKey);

    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const timeout = window.setTimeout(() => {
      setMovements((current) => {
        const fixtureMovement = current[fixtureId];
        if (!fixtureMovement?.[outcome]) {
          return current;
        }

        const nextFixtureMovement = { ...fixtureMovement };
        delete nextFixtureMovement[outcome];

        if (Object.keys(nextFixtureMovement).length === 0) {
          const nextState = { ...current };
          delete nextState[fixtureId];
          return nextState;
        }

        return {
          ...current,
          [fixtureId]: nextFixtureMovement,
        };
      });

      movementTimeoutsRef.current.delete(timeoutKey);
    }, 1800);

    movementTimeoutsRef.current.set(timeoutKey, timeout);
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

        if (disposed) {
          return;
        }

        if (!token.accessToken) {
          console.error('[useLiveOddsSignalR] JWT token missing accessToken - SignalR cannot connect');
          setStatus('error');
          return;
        }

        tokenRef.current = token.accessToken;

        const connection = new HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/live-odds`, {
            // Always call fetchJwtToken so reconnects get a valid (cached-or-refreshed) token
            accessTokenFactory: async () => {
              try {
                const t = await fetchJwtToken();
                if (t.accessToken) {
                  tokenRef.current = t.accessToken;
                }
              } catch {
                // Keep using the last known token if refresh fails
              }
              return tokenRef.current ?? '';
            },
            // WebSockets are unreliable behind the current hosting proxy in browsers,
            // and SSE intermittently returns 502 via Cloudflare. LongPolling is the
            // most stable transport for this deployment.
            transport: HttpTransportType.LongPolling,
            withCredentials: false,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Error)
          .build();

        connection.onreconnecting(() => {
          setStatus('reconnecting');
        });

        connection.onreconnected(async () => {
          if (disposed) {
            return;
          }

          setStatus('connected');
          if (!isConnectedState(connection)) {
            return;
          }

          try {
            await connection.invoke('JoinFixture', Number(fixtureId));
          } catch {
            if (!disposed) {
              setStatus('error');
            }
          }
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
          await stopConnectionQuietly(connection);
          return;
        }

        connectionRef.current = connection;

        if (connection.state === HubConnectionState.Connected && !disposed) {
          try {
            await connection.invoke('JoinFixture', Number(fixtureId));
            if (!disposed) setStatus('connected');
          } catch {
            if (!disposed) setStatus('error');
          }
        }
      } catch (err) {
        if (!disposed) {
          console.error('[useLiveOddsSignalR] Failed to connect:', err);
          setStatus('error');
        }
        // REST polling via useLiveOdds remains active as fallback.
      }
    };

    startConnection();

    return () => {
      disposed = true;
      const connection = connectionRef.current;
      connectionRef.current = null;

      if (connection) {
        void stopConnectionQuietly(connection);
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

        if (disposed) {
          return;
        }

        if (!token.accessToken) {
          console.error('[useLiveOddsListSignalR] JWT token missing accessToken - SignalR cannot connect');
          setStatus('error');
          return;
        }

        tokenRef.current = token.accessToken;

        const connection = new HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/live-odds`, {
            // Always call fetchJwtToken so reconnects get a valid (cached-or-refreshed) token
            accessTokenFactory: async () => {
              try {
                const t = await fetchJwtToken();
                if (t.accessToken) {
                  tokenRef.current = t.accessToken;
                }
              } catch {
                // Keep using the last known token if refresh fails
              }
              return tokenRef.current ?? '';
            },
            // WebSockets are unreliable behind the current hosting proxy in browsers,
            // and SSE intermittently returns 502 via Cloudflare. LongPolling is the
            // most stable transport for this deployment.
            transport: HttpTransportType.LongPolling,
            withCredentials: false,
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Error)
          .build();

        connection.onreconnecting(() => {
          setStatus('reconnecting');
        });

        connection.onreconnected(async () => {
          if (disposed) {
            return;
          }

          setStatus('connected');
          if (!isConnectedState(connection)) {
            return;
          }

          try {
            await connection.invoke('JoinFixtures', stableFixtureIds);
          } catch {
            if (!disposed) {
              setStatus('error');
            }
          }
        });

        connection.onclose(() => {
          setStatus(disposed ? 'idle' : 'error');
        });

        connection.on('LiveOddsSummaryUpdated', (payload: LiveOddsSummaryUpdatedDto) => {
          if (!stableFixtureIds.includes(Number(payload.apiFixtureId))) {
            return;
          }
          applyFixtureSummaryUpdate(
            queryClient,
            Number(payload.apiFixtureId),
            mapSummaryPayload(payload),
            setMovements,
            movementTimeoutsRef,
          );
        });

        connection.on('LiveOddsUpdated', (payload: LiveOddsUpdatedDto) => {
          if (!stableFixtureIds.includes(Number(payload.apiFixtureId))) {
            return;
          }

          const cachedQueries = queryClient.getQueriesData<PagedResultDto<FixtureDto>>({ queryKey: ['fixtures'] });
          const fixture = findFixtureInCache(Number(payload.apiFixtureId), cachedQueries);
          const nextSummary = mapMarketsToSummary(payload.markets ?? [], {
            homeTeamName: fixture?.homeTeamName,
            awayTeamName: fixture?.awayTeamName,
          });
          if (!nextSummary) {
            return;
          }

          applyFixtureSummaryUpdate(
            queryClient,
            Number(payload.apiFixtureId),
            nextSummary,
            setMovements,
            movementTimeoutsRef,
          );
        });

        await connection.start();
        if (disposed) {
          await stopConnectionQuietly(connection);
          return;
        }

        connectionRef.current = connection;

        if (connection.state === HubConnectionState.Connected && !disposed) {
          try {
            await connection.invoke('JoinFixtures', stableFixtureIds);
            if (!disposed) setStatus('connected');
          } catch {
            if (!disposed) setStatus('error');
          }
        }
      } catch (err) {
        if (!disposed) {
          console.error('[useLiveOddsListSignalR] Failed to connect:', err);
          setStatus('error');
        }
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
        void stopConnectionQuietly(connection);
      }

      setStatus('idle');
      setMovements({});
    };
  }, [enabled, fixtureIdsKey, queryClient]);

  return { status, movements };
}
