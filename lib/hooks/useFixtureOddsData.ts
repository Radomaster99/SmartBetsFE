'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useOdds } from '@/lib/hooks/useOdds';
import { useLiveBetTypes } from '@/lib/hooks/useLiveBetTypes';
import {
  useLiveOdds,
  useLiveOddsSignalR,
  useLiveViewersHeartbeat,
  type LiveOddsMovementDirection,
  type LiveOddsRealtimeStatus,
} from '@/lib/hooks/useLiveOdds';
import {
  dedupeOddsByBookmaker,
  deriveBestOddsFromOdds,
  getOddIdentityKey,
  mapLiveOddsToMainMatchOdds,
} from '@/lib/live-odds';
import { getApiFootballThreeWayFallbackBetIds } from '@/lib/live-bets';
import type {
  BestOddsDto,
  FixtureDetailDto,
  FixtureDto,
  LiveOddsMarketDto,
  LiveOddsSummaryDto,
  OddDto,
  PagedResultDto,
} from '@/lib/types/api';

// ── helpers ────────────────────────────────────────────────────────────────

function getMovementDirection(
  previousValue: number | null | undefined,
  nextValue: number | null | undefined,
): LiveOddsMovementDirection | null {
  if (previousValue == null || nextValue == null || previousValue === nextValue) return null;
  return nextValue > previousValue ? 'up' : 'down';
}

function formatRelativeTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return mins % 60 === 0 ? `${hours}h ago` : `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? `${days}d ago` : `${days}d ${hours % 24}h ago`;
}

function summaryToBestOdds(
  summary: LiveOddsSummaryDto,
  fixture: { id: number; apiFixtureId: number },
  fallback?: BestOddsDto | null,
): BestOddsDto | null {
  const bestHomeOdd = summary.bestHomeOdd ?? fallback?.bestHomeOdd ?? null;
  const bestHomeBookmaker = summary.bestHomeBookmaker ?? fallback?.bestHomeBookmaker ?? null;
  const bestDrawOdd = summary.bestDrawOdd ?? fallback?.bestDrawOdd ?? null;
  const bestDrawBookmaker = summary.bestDrawBookmaker ?? fallback?.bestDrawBookmaker ?? null;
  const bestAwayOdd = summary.bestAwayOdd ?? fallback?.bestAwayOdd ?? null;
  const bestAwayBookmaker = summary.bestAwayBookmaker ?? fallback?.bestAwayBookmaker ?? null;

  if (
    bestHomeOdd == null &&
    bestDrawOdd == null &&
    bestAwayOdd == null &&
    !bestHomeBookmaker &&
    !bestDrawBookmaker &&
    !bestAwayBookmaker
  ) {
    return null;
  }

  return {
    fixtureId: fixture.id,
    apiFixtureId: fixture.apiFixtureId,
    marketName: 'Match Winner',
    collectedAtUtc: summary.collectedAtUtc ?? fallback?.collectedAtUtc ?? new Date().toISOString(),
    bestHomeOdd,
    bestHomeBookmaker,
    bestDrawOdd,
    bestDrawBookmaker,
    bestAwayOdd,
    bestAwayBookmaker,
  };
}

function bestOddsToLiveSummary(bestOdds: BestOddsDto): LiveOddsSummaryDto {
  return {
    apiFixtureId: bestOdds.apiFixtureId,
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

function areLiveSummariesEqual(
  left: LiveOddsSummaryDto | null | undefined,
  right: LiveOddsSummaryDto | null | undefined,
): boolean {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.source === right.source &&
    left.collectedAtUtc === right.collectedAtUtc &&
    left.bestHomeOdd === right.bestHomeOdd &&
    left.bestHomeBookmaker === right.bestHomeBookmaker &&
    left.bestDrawOdd === right.bestDrawOdd &&
    left.bestDrawBookmaker === right.bestDrawBookmaker &&
    left.bestAwayOdd === right.bestAwayOdd &&
    left.bestAwayBookmaker === right.bestAwayBookmaker
  );
}

async function fetchFixtureLiveOddsForBetId(fixtureId: string, betId: number): Promise<LiveOddsMarketDto[]> {
  const res = await fetch(`/api/fixtures/${fixtureId}/odds/live?betId=${betId}&latestOnly=true`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch API-Football live odds for bet ${betId}`);
  }

  return res.json();
}

// ── public interface ───────────────────────────────────────────────────────

export interface FixtureOddsData {
  detail: ReturnType<typeof useFixtureDetail>['data'];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isLive: boolean;
  displayOdds: OddDto[];
  resolvedBestOdds: BestOddsDto | null;
  hasAnyOdds: boolean;
  usingPreMatchFallback: boolean;
  hasLiveOdds: boolean;
  hasPerMarketLiveOdds: boolean;
  shouldUseLiveBookmakerView: boolean;
  isLiveBookmakerRowsPending: boolean;
  isLiveOddsPending: boolean;
  liveOddsRealtimeStatus: LiveOddsRealtimeStatus;
  bestOddsMovements: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
  oddsTableMovements: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>;
  headerOddsLabel: string | null;
}

/**
 * Single shared hook for fixture odds data.
 * Used by both the desktop side panel (FixtureDetailPanel) and the mobile full page.
 *
 * @param fixtureId - string fixture id (API fixture id)
 * @param isOddsTabActive - pass false when the odds tab is not visible to pause movement tracking
 */
export function useFixtureOddsData(fixtureId: string, isOddsTabActive = true): FixtureOddsData {
  const queryClient = useQueryClient();
  const [bestOddsMovements, setBestOddsMovements] = useState<
    Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>
  >({});
  const [oddsTableMovements, setOddsTableMovements] = useState<
    Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>
  >({});
  const timeoutsRef = useRef(new Map<string, number>());
  const previousDisplayOddsRef = useRef<OddDto[] | null>(null);
  const previousBestOddsRef = useRef<BestOddsDto | null>(null);

  const { data: detail, isLoading, isError, error } = useFixtureDetail(fixtureId);
  const { data: odds } = useOdds(fixtureId);

  const isLive = detail?.fixture.stateBucket === 'Live';
  const liveOddsEnabled = Boolean(isLive);
  const liveFixtureId = Number(fixtureId);
  const heartbeatFixtureIds =
    liveOddsEnabled && Number.isFinite(liveFixtureId) && liveFixtureId > 0 ? [liveFixtureId] : [];
  const liveOddsQuery = useLiveOdds(fixtureId, liveOddsEnabled);
  const liveOddsRealtimeStatus = useLiveOddsSignalR(fixtureId, liveOddsEnabled);
  useLiveViewersHeartbeat(heartbeatFixtureIds, liveOddsEnabled);
  const hasTheOddsProviderRows = Boolean(
    isLive && (liveOddsQuery.data ?? []).some((market) => market.sourceProvider === 'the-odds-api'),
  );
  const liveBetTypesQuery = useLiveBetTypes(isLive && isOddsTabActive && hasTheOddsProviderRows);
  const apiFootballFallbackBetIds = useMemo(
    () => getApiFootballThreeWayFallbackBetIds(liveBetTypesQuery.data ?? [], detail?.fixture.elapsed ?? null),
    [detail?.fixture.elapsed, liveBetTypesQuery.data],
  );
  const apiFootballFallbackQuery = useQuery({
    queryKey: ['fixture-live-odds-api-football-fallback', fixtureId, apiFootballFallbackBetIds.join(',')],
    enabled: Boolean(
      isLive &&
        isOddsTabActive &&
        hasTheOddsProviderRows &&
        apiFootballFallbackBetIds.length > 0 &&
        detail?.fixture.homeTeamName &&
        detail?.fixture.awayTeamName,
    ),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      for (const betId of apiFootballFallbackBetIds) {
        try {
          const markets = await fetchFixtureLiveOddsForBetId(fixtureId, betId);
          const mappedOdds = mapLiveOddsToMainMatchOdds(markets, {
            homeTeamName: detail?.fixture.homeTeamName,
            awayTeamName: detail?.fixture.awayTeamName,
            homeGoals: detail?.fixture.homeGoals ?? null,
            awayGoals: detail?.fixture.awayGoals ?? null,
            elapsed: detail?.fixture.elapsed ?? null,
          }).filter((odd) => odd.sourceProvider === 'api-football' && /bet365/i.test(odd.bookmaker));

          if (mappedOdds.length > 0) {
            return markets;
          }
        } catch (error) {
          console.warn(
            `[useFixtureOddsData] Failed API-Football Bet365 fallback fetch for fixture ${fixtureId} and bet ${betId}:`,
            error,
          );
        }
      }

      return [] as LiveOddsMarketDto[];
    },
  });

  const mappedPreferredLiveOdds = useMemo(
    () =>
      isLive
        ? mapLiveOddsToMainMatchOdds(liveOddsQuery.data ?? [], {
            homeTeamName: detail?.fixture.homeTeamName,
            awayTeamName: detail?.fixture.awayTeamName,
            homeGoals: detail?.fixture.homeGoals ?? null,
            awayGoals: detail?.fixture.awayGoals ?? null,
            elapsed: detail?.fixture.elapsed ?? null,
          })
        : [],
    [detail?.fixture.awayTeamName, detail?.fixture.homeTeamName, isLive, liveOddsQuery.data],
  );
  const mappedApiFootballFallbackOdds = useMemo(
    () =>
      isLive
        ? mapLiveOddsToMainMatchOdds(apiFootballFallbackQuery.data ?? [], {
            homeTeamName: detail?.fixture.homeTeamName,
            awayTeamName: detail?.fixture.awayTeamName,
            homeGoals: detail?.fixture.homeGoals ?? null,
            awayGoals: detail?.fixture.awayGoals ?? null,
            elapsed: detail?.fixture.elapsed ?? null,
          }).filter((odd) => odd.sourceProvider === 'api-football' && /bet365/i.test(odd.bookmaker))
        : [],
    [
      apiFootballFallbackQuery.data,
      detail?.fixture.awayTeamName,
      detail?.fixture.homeTeamName,
      isLive,
    ],
  );
  const mappedLiveOdds = useMemo(() => {
    if (!isLive) {
      return [];
    }

    if (mappedApiFootballFallbackOdds.length === 0) {
      return mappedPreferredLiveOdds;
    }

    return dedupeOddsByBookmaker([...mappedPreferredLiveOdds, ...mappedApiFootballFallbackOdds]);
  }, [isLive, mappedApiFootballFallbackOdds, mappedPreferredLiveOdds]);
  const derivedLiveBestOdds = useMemo(
    () => (isLive ? deriveBestOddsFromOdds(mappedLiveOdds) : null),
    [isLive, mappedLiveOdds],
  );
  const summaryLiveBestOdds = useMemo(() => {
    const s = detail?.liveOddsSummary;
    if (!isLive || !s || s.source !== 'live') return null;
    return summaryToBestOdds(
      s,
      { id: detail.fixture.id, apiFixtureId: detail.fixture.apiFixtureId },
      detail?.bestOdds ?? null,
    );
  }, [detail, isLive]);
  const derivedLiveSummary = useMemo(() => {
    if (!isLive) {
      return null;
    }

    if (derivedLiveBestOdds) {
      return bestOddsToLiveSummary(derivedLiveBestOdds);
    }

    if (summaryLiveBestOdds) {
      return bestOddsToLiveSummary(summaryLiveBestOdds);
    }

    return detail?.liveOddsSummary?.source === 'live' ? detail.liveOddsSummary : null;
  }, [derivedLiveBestOdds, detail?.liveOddsSummary, isLive, summaryLiveBestOdds]);

  const liveSummarySource = isLive ? (detail?.liveOddsSummary?.source ?? null) : null;
  const hasLiveOdds = mappedLiveOdds.length > 0 || liveSummarySource === 'live' || Boolean(summaryLiveBestOdds);
  const hasPerMarketLiveOdds = mappedLiveOdds.length > 0;
  const hasPreMatchFallback = Boolean((odds?.length ?? 0) > 0 || detail?.bestOdds || liveSummarySource === 'prematch');
  const shouldUseLiveBookmakerView = Boolean(isLive && hasPerMarketLiveOdds);
  const isLiveBookmakerRowsPending = Boolean(isLive && liveSummarySource === 'live' && !hasPerMarketLiveOdds);
  // Hold off showing pre-match fallback while the live odds request is in-flight,
  // whether or not we have a cached summary — prevents the flash of pre-match odds.
  const shouldHoldForLiveRows = Boolean(
    isLive &&
      !hasPerMarketLiveOdds &&
      (liveOddsQuery.isLoading || liveOddsQuery.isFetching),
  );
  const shouldUsePreMatchFallbackView = Boolean(
    isLive && !shouldUseLiveBookmakerView && hasPreMatchFallback && !shouldHoldForLiveRows,
  );
  const usingPreMatchFallback = shouldUsePreMatchFallbackView;

  const displayOdds = useMemo(() => {
    if (!isLive) {
      return odds ?? [];
    }

    if (shouldUseLiveBookmakerView) {
      return mappedLiveOdds;
    }

    if (!shouldUsePreMatchFallbackView) {
      return [];
    }

    return odds ?? [];
  }, [isLive, mappedLiveOdds, odds, shouldUseLiveBookmakerView, shouldUsePreMatchFallbackView]);

  const resolvedBestOdds = isLive
    ? shouldUseLiveBookmakerView
      ? derivedLiveBestOdds ?? summaryLiveBestOdds ?? detail?.bestOdds ?? null
      : summaryLiveBestOdds ?? (shouldUsePreMatchFallbackView ? detail?.bestOdds ?? null : null)
    : detail?.bestOdds ?? null;

  const hasAnyOdds = Boolean(resolvedBestOdds) || Boolean(displayOdds.length);

  useEffect(() => {
    if (!detail || !derivedLiveSummary) {
      return;
    }

    queryClient.setQueriesData<{ pages?: { items?: FixtureDto[] }[]; pageParams?: unknown[] }>({ queryKey: ['fixtures'] }, (current) => {
      if (!current || !Array.isArray(current.pages)) {
        return current;
      }

      let changed = false;
      const pages = current.pages.map((page) => {
        if (!Array.isArray(page.items)) return page;
        const items = page.items.map((fixture) => {
          if (fixture.apiFixtureId !== detail.fixture.apiFixtureId) return fixture;
          if (areLiveSummariesEqual(fixture.liveOddsSummary, derivedLiveSummary)) return fixture;
          changed = true;
          return { ...fixture, liveOddsSummary: derivedLiveSummary };
        });
        return changed ? { ...page, items } : page;
      });

      return changed ? { ...current, pages } : current;
    });

    queryClient.setQueryData<FixtureDetailDto | undefined>(['fixture', fixtureId], (current) => {
      if (!current) {
        return current;
      }

      if (
        areLiveSummariesEqual(current.liveOddsSummary, derivedLiveSummary) &&
        areLiveSummariesEqual(current.fixture.liveOddsSummary, derivedLiveSummary)
      ) {
        return current;
      }

      return {
        ...current,
        liveOddsSummary: derivedLiveSummary,
        fixture: {
          ...current.fixture,
          liveOddsSummary: derivedLiveSummary,
        },
      };
    });
  }, [derivedLiveSummary, detail?.fixture.apiFixtureId, fixtureId, queryClient]);

  // ── freshness label ───────────────────────────────────────────────────────

  const oddsFreshnessIso = isLive
    ? resolvedBestOdds?.collectedAtUtc ?? detail?.latestOddsCollectedAtUtc ?? detail?.oddsLastSyncedAtUtc ?? null
    : detail?.oddsLastSyncedAtUtc ?? null;

  const liveOddsSyncedAtIso =
    isLive && hasLiveOdds
      ? (liveOddsQuery.data ?? []).reduce<string | null>((latest, market) => {
          const ts = market.lastSyncedAtUtc ?? market.collectedAtUtc ?? null;
          if (!ts) return latest;
          if (!latest || new Date(ts).getTime() > new Date(latest).getTime()) return ts;
          return latest;
        }, null)
      : null;

  const liveOddsLastChangedAtIso =
    isLive && hasLiveOdds
      ? (liveOddsQuery.data ?? []).reduce<string | null>((latest, market) => {
          const ts = market.lastSnapshotCollectedAtUtc ?? market.collectedAtUtc ?? null;
          if (!ts) return latest;
          if (!latest || new Date(ts).getTime() > new Date(latest).getTime()) return ts;
          return latest;
        }, null)
      : null;

  const liveOddsLastSyncedLabel = formatRelativeTimestamp(liveOddsSyncedAtIso);
  const liveOddsLastChangedLabel = formatRelativeTimestamp(liveOddsLastChangedAtIso);

  const headerOddsLabel = isLive
    ? usingPreMatchFallback && oddsFreshnessIso
      ? `Pre-match odds updated ${formatRelativeTimestamp(oddsFreshnessIso) ?? 'recently'}`
      : liveOddsLastSyncedLabel
        ? `Live odds synced ${liveOddsLastSyncedLabel}${
            liveOddsLastChangedLabel && liveOddsLastChangedLabel !== liveOddsLastSyncedLabel
              ? ` · Last change ${liveOddsLastChangedLabel}`
              : ''
          }`
        : null
    : oddsFreshnessIso
      ? (() => {
          const label = formatRelativeTimestamp(oddsFreshnessIso);
          return label ? `Odds updated ${label}` : null;
        })()
      : null;

  // ── movement tracking ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!isLive || !isOddsTabActive) {
      previousDisplayOddsRef.current = null;
      previousBestOddsRef.current = null;
      setBestOddsMovements((c) => (Object.keys(c).length === 0 ? c : {}));
      setOddsTableMovements((c) => (Object.keys(c).length === 0 ? c : {}));
      if (timeoutsRef.current.size > 0) {
        for (const timeout of timeoutsRef.current.values()) window.clearTimeout(timeout);
        timeoutsRef.current.clear();
      }
      return;
    }

    const scheduleBestClear = (outcome: 'home' | 'draw' | 'away') => {
      const key = `best:${outcome}`;
      const existing = timeoutsRef.current.get(key);
      if (existing) window.clearTimeout(existing);
      const timeout = window.setTimeout(() => {
        setBestOddsMovements((c) => {
          if (!c[outcome]) return c;
          const next = { ...c };
          delete next[outcome];
          return next;
        });
        timeoutsRef.current.delete(key);
      }, 1800);
      timeoutsRef.current.set(key, timeout);
    };

    const scheduleTableClear = (bookmaker: string, outcome: 'home' | 'draw' | 'away') => {
      const key = `table:${bookmaker}:${outcome}`;
      const existing = timeoutsRef.current.get(key);
      if (existing) window.clearTimeout(existing);
      const timeout = window.setTimeout(() => {
        setOddsTableMovements((c) => {
          const m = c[bookmaker];
          if (!m?.[outcome]) return c;
          const nextBookmaker = { ...m };
          delete nextBookmaker[outcome];
          if (Object.keys(nextBookmaker).length === 0) {
            const next = { ...c };
            delete next[bookmaker];
            return next;
          }
          return { ...c, [bookmaker]: nextBookmaker };
        });
        timeoutsRef.current.delete(key);
      }, 1800);
      timeoutsRef.current.set(key, timeout);
    };

    const previousBestOdds = previousBestOddsRef.current;
    const previousDisplayOdds = previousDisplayOddsRef.current;

    if (previousBestOdds && resolvedBestOdds) {
      const nextBestMovements: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> = {};
      const hm = getMovementDirection(previousBestOdds.bestHomeOdd, resolvedBestOdds.bestHomeOdd);
      const dm = getMovementDirection(previousBestOdds.bestDrawOdd, resolvedBestOdds.bestDrawOdd);
      const am = getMovementDirection(previousBestOdds.bestAwayOdd, resolvedBestOdds.bestAwayOdd);
      if (hm) nextBestMovements.home = hm;
      if (dm) nextBestMovements.draw = dm;
      if (am) nextBestMovements.away = am;
      if (Object.keys(nextBestMovements).length > 0) {
        setBestOddsMovements((c) => ({ ...c, ...nextBestMovements }));
        (Object.keys(nextBestMovements) as Array<'home' | 'draw' | 'away'>).forEach(scheduleBestClear);
      }
    }

    if (previousDisplayOdds) {
      const previousByBookmaker = new Map(previousDisplayOdds.map((o) => [getOddIdentityKey(o), o]));
      const nextTableMovements: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>> =
        {};
      for (const odd of displayOdds) {
        const oddIdentityKey = getOddIdentityKey(odd);
        const prev = previousByBookmaker.get(oddIdentityKey);
        if (!prev) continue;
        const hm = getMovementDirection(prev.homeOdd, odd.homeOdd);
        const dm = getMovementDirection(prev.drawOdd, odd.drawOdd);
        const am = getMovementDirection(prev.awayOdd, odd.awayOdd);
        const bm: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> = {};
        if (hm) bm.home = hm;
        if (dm) bm.draw = dm;
        if (am) bm.away = am;
        if (Object.keys(bm).length > 0) nextTableMovements[oddIdentityKey] = bm;
      }
      if (Object.keys(nextTableMovements).length > 0) {
        setOddsTableMovements((c) => {
          const next = { ...c };
          for (const [bk, movements] of Object.entries(nextTableMovements)) {
            next[bk] = { ...(c[bk] ?? {}), ...movements };
          }
          return next;
        });
        for (const [bk, movements] of Object.entries(nextTableMovements)) {
          (Object.keys(movements) as Array<'home' | 'draw' | 'away'>).forEach((outcome) =>
            scheduleTableClear(bk, outcome),
          );
        }
      }
    }

    previousDisplayOddsRef.current = displayOdds;
    previousBestOddsRef.current = resolvedBestOdds;
  }, [displayOdds, isLive, isOddsTabActive, resolvedBestOdds]);

  return {
    detail,
    isLoading,
    isError,
    error,
    isLive,
    displayOdds,
    resolvedBestOdds,
    hasAnyOdds,
    usingPreMatchFallback,
    hasLiveOdds,
    hasPerMarketLiveOdds,
    shouldUseLiveBookmakerView,
    isLiveBookmakerRowsPending,
    isLiveOddsPending: shouldHoldForLiveRows,
    liveOddsRealtimeStatus,
    bestOddsMovements,
    oddsTableMovements,
    headerOddsLabel,
  };
}
