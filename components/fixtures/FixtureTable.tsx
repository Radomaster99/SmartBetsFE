'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FixtureDto, OddDto } from '@/lib/types/api';
import type { LiveOddsMovementByFixture } from '@/lib/hooks/useLiveOdds';
import { fetchBestOddsBatch } from '@/lib/hooks/useOdds';
import { buildBookmakerHref } from '@/lib/bookmakers';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { FixtureRow } from './FixtureRow';
import { TableSkeleton } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { BestOddsDto } from '@/lib/types/api';
import {
  ADMIN_POPULAR_LEAGUES_STORAGE_KEY,
  DEFAULT_POPULAR_LEAGUES_PRESET,
  POPULAR_LEAGUES_UPDATED_EVENT,
  USER_POPULAR_LEAGUES_STORAGE_KEY,
  USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY,
  mergePopularLeaguePresets,
  readPopularLeaguePresets,
  readPopularLeagueKeys,
} from '@/lib/popular-leagues';

function buildOrderMap(presets: typeof DEFAULT_POPULAR_LEAGUES_PRESET): Map<number, number> {
  return new Map(presets.map((p, i) => [Number(p.leagueId), i]));
}

function readOrderMapFromStorage(): Map<number, number> {
  const admin = readPopularLeaguePresets(ADMIN_POPULAR_LEAGUES_STORAGE_KEY, DEFAULT_POPULAR_LEAGUES_PRESET);
  const user = readPopularLeaguePresets(USER_POPULAR_LEAGUES_STORAGE_KEY, []);
  const hidden = readPopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, []);
  return buildOrderMap(mergePopularLeaguePresets(admin, user, hidden));
}

function usePopularLeagueOrder(): Map<number, number> {
  // Read from localStorage immediately in the initializer so the very first render
  // already has the correct user-customised order (avoids a visible re-sort flash).
  // On SSR window is undefined → falls back to defaults, which is fine because no
  // fixture rows are rendered server-side (isLoading = true shows skeleton instead).
  const [orderMap, setOrderMap] = useState<Map<number, number>>(() =>
    typeof window !== 'undefined' ? readOrderMapFromStorage() : buildOrderMap(DEFAULT_POPULAR_LEAGUES_PRESET),
  );

  useEffect(() => {
    // Same-tab updates: fired by writePopularLeaguePresets / writePopularLeagueKeys.
    const onUpdated = () => setOrderMap(readOrderMapFromStorage());
    // Cross-tab updates: the native storage event only fires in other tabs.
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === ADMIN_POPULAR_LEAGUES_STORAGE_KEY ||
        e.key === USER_POPULAR_LEAGUES_STORAGE_KEY ||
        e.key === USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY
      ) {
        setOrderMap(readOrderMapFromStorage());
      }
    };
    window.addEventListener(POPULAR_LEAGUES_UPDATED_EVENT, onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(POPULAR_LEAGUES_UPDATED_EVENT, onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return orderMap;
}

interface Props {
  fixtures: FixtureDto[];
  isLoading?: boolean;
  isFetching?: boolean;
  oddsMovements?: LiveOddsMovementByFixture;
  liveOddsByFixture?: Record<number, OddDto[]>;
  pendingLiveOddsFixtureIds?: ReadonlySet<number>;
  savedFixtureIds?: Set<number>;
  onToggleSave?: (fixture: FixtureDto) => void;
  selectedFixtureId?: number;
  onRowClick?: (fixture: FixtureDto) => void;
  onVisibleLiveFixtureIdsChange?: (fixtureIds: number[]) => void;
}

function needsBestOddsFallback(fixture: FixtureDto): boolean {
  const liveSummary = fixture.liveOddsSummary ?? null;

  const hasCompleteSummary =
    liveSummary?.bestHomeOdd != null &&
    liveSummary?.bestDrawOdd != null &&
    liveSummary?.bestAwayOdd != null;

  // Live rows can still need fallback when the provider returns only part of the 1X2 set.
  if (fixture.stateBucket === 'Live') {
    return !hasCompleteSummary;
  }

  // If the backend already returned a complete summary (live or prematch), no batch call needed.
  if (liveSummary?.source === 'live' || liveSummary?.source === 'prematch') {
    return !hasCompleteSummary;
  }

  return fixture.stateBucket === 'Upcoming' || fixture.stateBucket === 'Unknown';
}

function buildFixtureHref(apiFixtureId: number, tab?: 'odds') {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  const query = params.toString();
  return `/football/fixtures/${apiFixtureId}${query ? `?${query}` : ''}`;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function truncateBookmaker(name: string, max = 14): string {
  return name.length > max ? `${name.slice(0, max - 3)}...` : name;
}

function resolveBookmakerForDisplay(name: string | null | undefined): string | null {
  return name?.trim() || null;
}

function MobileOddsLoadingSnake({ fill, radius }: { fill: string; radius: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: -1,
          borderRadius: radius + 1,
          background:
            'conic-gradient(from 0deg, rgba(0,230,118,0) 0deg, rgba(0,230,118,0) 250deg, rgba(0,230,118,0.14) 288deg, rgba(0,230,118,0.98) 324deg, rgba(0,230,118,0) 360deg)',
          animation: 'odds-loading-spin 1.05s linear infinite',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: Math.max(radius - 1, 0),
          background: fill,
        }}
      />
    </span>
  );
}

function MobileOddsCell({
  fixtureId,
  label,
  odd,
  bookmaker,
  isLoading = false,
}: {
  fixtureId: number;
  label: string;
  odd: number | null;
  bookmaker: string | null;
  isLoading?: boolean;
}) {
  if (isLoading && odd == null) {
    return (
      <div
        className="odds-btn odds-btn-grid min-h-[48px]"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderColor: 'rgba(0,230,118,0.2)',
          background: 'rgba(0,230,118,0.06)',
        }}
      >
        <MobileOddsLoadingSnake fill="rgba(0,230,118,0.06)" radius={12} />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            width: '100%',
            height: '100%',
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(0,230,118,0.72)' }}>
            Live
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 8,
              borderRadius: 999,
              background: 'rgba(148,163,184,0.26)',
              animation: 'skeleton-pulse 1.2s ease-in-out infinite',
            }}
          />
        </span>
      </div>
    );
  }

  if (!odd) {
    return (
      <div className="odds-btn odds-btn-grid min-h-[48px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          {label}
        </span>
        <span className="odds-value na">-</span>
      </div>
    );
  }

  if (!bookmaker) {
    return (
      <div className="odds-btn odds-btn-grid min-h-[48px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          {label}
        </span>
        <span className="odds-value">{odd.toFixed(2)}</span>
      </div>
    );
  }

  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId,
    outcome: label === '1' ? 'home' : label === 'X' ? 'draw' : 'away',
    source: 'fixture-list',
  });

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block" style={{ textDecoration: 'none' }}>
      <div className="odds-btn odds-btn-grid min-h-[48px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          {label}
        </span>
        <span className="odds-value">{odd.toFixed(2)}</span>
        <span className="odds-bk">
          {truncateBookmaker(bookmaker)}
        </span>
      </div>
    </a>
  );
}

function MobileFixtureCard({
  fixture,
  bestOddsFallback,
  liveOddsRows,
  isSaved,
  onToggleSave,
  isLiveOddsPending = false,
}: {
  fixture: FixtureDto;
  bestOddsFallback: BestOddsDto | null;
  liveOddsRows: OddDto[];
  isSaved: boolean;
  onToggleSave?: (fixture: FixtureDto) => void;
  isLiveOddsPending?: boolean;
}) {
  const router = useRouter();
  const isLive = fixture.stateBucket === 'Live';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const liveSummaryIsLive = liveSummary?.source === 'live';
  const liveSummaryIsPrematch = liveSummary?.source === 'prematch';
  const liveSource = liveSummary?.source ?? 'none';
  const liveBestOdds = liveOddsRows.length > 0 ? {
    homeOdd: Math.max(...liveOddsRows.map((odd) => odd.homeOdd)),
    drawOdd: Math.max(...liveOddsRows.map((odd) => odd.drawOdd)),
    awayOdd: Math.max(...liveOddsRows.map((odd) => odd.awayOdd)),
    homeBookmaker:
      liveOddsRows.reduce((best, odd) => (odd.homeOdd > best.homeOdd ? odd : best), liveOddsRows[0]).bookmaker,
    drawBookmaker:
      liveOddsRows.reduce((best, odd) => (odd.drawOdd > best.drawOdd ? odd : best), liveOddsRows[0]).bookmaker,
    awayBookmaker:
      liveOddsRows.reduce((best, odd) => (odd.awayOdd > best.awayOdd ? odd : best), liveOddsRows[0]).bookmaker,
  } : null;
  const scoreReady = fixture.homeGoals !== null && fixture.awayGoals !== null;
  const hideFallbackWhilePending = isLive && isLiveOddsPending && !liveBestOdds;

  const homeLiveOdd = liveBestOdds?.homeOdd ?? (liveSummaryIsLive ? liveSummary?.bestHomeOdd ?? null : null);
  const drawLiveOdd = liveBestOdds?.drawOdd ?? (liveSummaryIsLive ? liveSummary?.bestDrawOdd ?? null : null);
  const awayLiveOdd = liveBestOdds?.awayOdd ?? (liveSummaryIsLive ? liveSummary?.bestAwayOdd ?? null : null);
  const homeFallbackOdd =
    (liveSummaryIsPrematch ? liveSummary?.bestHomeOdd ?? null : null) ?? bestOddsFallback?.bestHomeOdd ?? null;
  const drawFallbackOdd =
    (liveSummaryIsPrematch ? liveSummary?.bestDrawOdd ?? null : null) ?? bestOddsFallback?.bestDrawOdd ?? null;
  const awayFallbackOdd =
    (liveSummaryIsPrematch ? liveSummary?.bestAwayOdd ?? null : null) ?? bestOddsFallback?.bestAwayOdd ?? null;
  const homeOdd = homeLiveOdd ?? (hideFallbackWhilePending ? null : homeFallbackOdd);
  const drawOdd = drawLiveOdd ?? (hideFallbackWhilePending ? null : drawFallbackOdd);
  const awayOdd = awayLiveOdd ?? (hideFallbackWhilePending ? null : awayFallbackOdd);
  const homeBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.homeBookmaker ??
      (liveSummaryIsLive ? liveSummary?.bestHomeBookmaker : null) ??
      (hideFallbackWhilePending ? null : (liveSummaryIsPrematch ? liveSummary?.bestHomeBookmaker : null)) ??
      bestOddsFallback?.bestHomeBookmaker,
  );
  const drawBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.drawBookmaker ??
      (liveSummaryIsLive ? liveSummary?.bestDrawBookmaker : null) ??
      (hideFallbackWhilePending ? null : (liveSummaryIsPrematch ? liveSummary?.bestDrawBookmaker : null)) ??
      bestOddsFallback?.bestDrawBookmaker,
  );
  const awayBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.awayBookmaker ??
      (liveSummaryIsLive ? liveSummary?.bestAwayBookmaker : null) ??
      (hideFallbackWhilePending ? null : (liveSummaryIsPrematch ? liveSummary?.bestAwayBookmaker : null)) ??
      bestOddsFallback?.bestAwayBookmaker,
  );

  const statusTone =
    liveSource === 'live'
      ? { label: 'Live prices', color: 'var(--t-accent)', bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.24)' }
      : liveSource === 'prematch'
        ? { label: 'Pre-match', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.24)' }
        : { label: 'Waiting', color: 'var(--t-text-4)', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.18)' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(buildFixtureHref(fixture.apiFixtureId))}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(buildFixtureHref(fixture.apiFixtureId));
        }
      }}
      className="panel-shell w-full rounded-xl p-3 text-left"
      style={{
        position: 'relative',
        ...(isLive ? { boxShadow: 'inset 3px 0 0 rgba(239,83,80,0.65), var(--t-shadow-soft)' } : null),
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
            {isLive ? 'Live' : formatKickoffDate(fixture.kickoffAt)}
          </span>
          <span className="text-[12px] font-semibold" style={{ color: isLive ? '#fca5a5' : 'var(--t-text-3)' }}>
            {isLive ? `${fixture.elapsed ?? ''}${fixture.elapsed != null ? "'" : ''}` : formatKickoff(fixture.kickoffAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: statusTone.color, background: statusTone.bg, borderColor: statusTone.border }}
            >
              {hideFallbackWhilePending ? 'Loading live' : statusTone.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave?.(fixture);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-black"
            style={{
              background: isSaved ? 'rgba(0,230,118,0.12)' : 'var(--t-surface-2)',
              borderColor: isSaved ? 'rgba(0,230,118,0.28)' : 'var(--t-border-2)',
              color: isSaved ? 'var(--t-accent)' : 'var(--t-text-5)',
            }}
            aria-label={isSaved ? 'Remove fixture from watchlist' : 'Save fixture to watchlist'}
            title={isSaved ? 'Saved to watchlist' : 'Save to watchlist'}
          >
            {isSaved ? '★' : '☆'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
            <span className="min-w-0 truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
              {fixture.homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={18} />
            <span className="min-w-0 truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
              {fixture.awayTeamName}
            </span>
          </div>
        </div>

        <div className="flex min-w-[54px] items-center justify-center">
          <div
            className="rounded-lg px-2 py-1 text-center odds-cell"
            style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-2)' }}
          >
            {scoreReady ? (
              <div className="text-[13px] font-bold">
                {fixture.homeGoals} - {fixture.awayGoals}
              </div>
            ) : (
              <div className="text-[12px] font-semibold" style={{ color: 'var(--t-text-5)' }}>
                vs
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2" onClick={(event) => event.stopPropagation()}>
        <MobileOddsCell
          fixtureId={fixture.apiFixtureId}
          label="1"
          odd={homeOdd}
          bookmaker={homeBookmaker}
          isLoading={hideFallbackWhilePending && homeOdd == null}
        />
        <MobileOddsCell
          fixtureId={fixture.apiFixtureId}
          label="X"
          odd={drawOdd}
          bookmaker={drawBookmaker}
          isLoading={hideFallbackWhilePending && drawOdd == null}
        />
        <MobileOddsCell
          fixtureId={fixture.apiFixtureId}
          label="2"
          odd={awayOdd}
          bookmaker={awayBookmaker}
          isLoading={hideFallbackWhilePending && awayOdd == null}
        />
      </div>
    </div>
  );
}

function FetchingBar() {
  return (
    <div className="relative h-[2px] w-full overflow-hidden" style={{ background: 'var(--t-border)' }}>
      <div
        className="absolute inset-y-0 left-0 h-full"
        style={{
          width: '40%',
          background: 'var(--t-accent)',
          animation: 'fetching-slide 1.2s ease-in-out infinite',
          opacity: 0.8,
        }}
      />
    </div>
  );
}

export function FixtureTable({
  fixtures,
  isLoading,
  isFetching,
  oddsMovements,
  liveOddsByFixture = {},
  pendingLiveOddsFixtureIds,
  savedFixtureIds,
  onToggleSave,
  selectedFixtureId,
  onRowClick,
  onVisibleLiveFixtureIdsChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<Props['onVisibleLiveFixtureIdsChange']>(onVisibleLiveFixtureIdsChange);
  const lastVisibleIdsKeyRef = useRef('');
  const popularLeagueOrder = usePopularLeagueOrder();
  const fallbackFixtureIds = useMemo(
    () => fixtures.filter(needsBestOddsFallback).map((fixture) => fixture.apiFixtureId),
    [fixtures],
  );

  const { data: bestOddsBatch = {} } = useQuery({
    queryKey: ['best-odds-batch', fallbackFixtureIds],
    queryFn: () => fetchBestOddsBatch(fallbackFixtureIds),
    staleTime: 60_000,
    enabled: fallbackFixtureIds.length > 0,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const bestOddsMap = useMemo(
    () =>
      new Map(
        fixtures.map((fixture) => [fixture.apiFixtureId, bestOddsBatch[String(fixture.apiFixtureId)] ?? null]),
      ),
    [bestOddsBatch, fixtures],
  );

  const byLeague = useMemo(
    () =>
      fixtures.reduce<Record<string, { name: string; country: string; leagueApiId: number; items: FixtureDto[] }>>((acc, fixture) => {
        const key = String(fixture.leagueApiId);
        if (!acc[key]) {
          acc[key] = { name: fixture.leagueName, country: fixture.countryName, leagueApiId: Number(fixture.leagueApiId), items: [] };
        }
        acc[key].items.push(fixture);
        return acc;
      }, {}),
    [fixtures],
  );

  const sortedLeagueEntries = useMemo(() => {
    const entries = Object.entries(byLeague);
    return entries.sort(([, a], [, b]) => {
      const aRank = popularLeagueOrder.get(Number(a.leagueApiId)) ?? Number.MAX_SAFE_INTEGER;
      const bRank = popularLeagueOrder.get(Number(b.leagueApiId)) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name);
    });
  }, [byLeague, popularLeagueOrder]);

  useEffect(() => {
    callbackRef.current = onVisibleLiveFixtureIdsChange;
  }, [onVisibleLiveFixtureIdsChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !callbackRef.current) {
      return;
    }

    const liveRows = Array.from(container.querySelectorAll<HTMLElement>('[data-live-fixture-id]'));
    if (liveRows.length === 0) {
      if (lastVisibleIdsKeyRef.current !== '') {
        lastVisibleIdsKeyRef.current = '';
        callbackRef.current([]);
      }
      return;
    }

    const visibleIds = new Set<number>();
    const emit = () => {
      const nextIds = Array.from(visibleIds).sort((left, right) => left - right);
      const nextKey = nextIds.join(',');
      if (nextKey === lastVisibleIdsKeyRef.current) {
        return;
      }

      lastVisibleIdsKeyRef.current = nextKey;
      callbackRef.current?.(nextIds);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;

        for (const entry of entries) {
          const fixtureId = Number(entry.target.getAttribute('data-live-fixture-id'));
          if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
            continue;
          }

          if (entry.isIntersecting) {
            if (!visibleIds.has(fixtureId)) {
              visibleIds.add(fixtureId);
              changed = true;
            }
          } else if (visibleIds.delete(fixtureId)) {
            changed = true;
          }
        }

        if (changed) {
          emit();
        }
      },
      {
        root: container,
        threshold: 0.35,
      },
    );

    for (const row of liveRows) {
      observer.observe(row);
    }

    return () => {
      observer.disconnect();
    };
  }, [fixtures]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <FetchingBar />
        <table className="w-full table-fixed">
          <tbody>
            <TableSkeleton rows={12} cols={5} />
          </tbody>
        </table>
      </div>
    );
  }

  if (sortedLeagueEntries.length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        {isFetching ? <FetchingBar /> : null}
        <EmptyState title="No fixtures" description="No matches found for the selected date or filters." />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      {isFetching ? <div className="sticky top-0 z-20"><FetchingBar /></div> : null}
      {sortedLeagueEntries.map(([key, { name, country, items }]) => {
        const oddsCount = items.filter((fixture) => {
          const liveSummary = fixture.liveOddsSummary ?? null;
          if (liveSummary?.bestHomeOdd || liveSummary?.bestDrawOdd || liveSummary?.bestAwayOdd) {
            return true;
          }

          const bestOdds = bestOddsMap.get(fixture.apiFixtureId);
          return Boolean(bestOdds?.bestHomeOdd || bestOdds?.bestDrawOdd || bestOdds?.bestAwayOdd);
        }).length;

        return (
          <div key={key}>
            <div
              className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2"
              style={{
                background: 'var(--t-page-bg)',
                borderBottom: '1px solid var(--t-border)',
                borderTop: '1px solid var(--t-border)',
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-sm"
                style={{ background: 'var(--t-accent)', opacity: 0.65, transform: 'rotate(45deg)' }}
              />
              <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-5)' }}>
                {country}
              </span>
              <span style={{ color: 'var(--t-border-2)', fontSize: 10 }}>/</span>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--t-text-3)' }}>
                {name}
              </span>
              {oddsCount > 0 && (
                <span className="text-[10px]" style={{ color: 'var(--t-text-6)' }}>
                  {oddsCount}/{items.length} with odds
                </span>
              )}
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)', border: '1px solid var(--t-border)' }}
              >
                {items.length}
              </span>
            </div>

            <div className="md:hidden space-y-2 px-2 py-2">
              {items.map((fixture) => (
                <MobileFixtureCard
                  key={`mobile-${fixture.apiFixtureId}`}
                  fixture={fixture}
                  bestOddsFallback={bestOddsMap.get(fixture.apiFixtureId) ?? null}
                  liveOddsRows={liveOddsByFixture[fixture.apiFixtureId] ?? []}
                  isLiveOddsPending={pendingLiveOddsFixtureIds?.has(fixture.apiFixtureId) ?? false}
                  isSaved={savedFixtureIds?.has(fixture.apiFixtureId) ?? false}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>

            <table className="fixture-table hidden w-full table-fixed md:table">
              <thead>
                <tr>
                  <th
                    style={{ width: 62, padding: '6px 6px 6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t-text-6)' }}
                  >
                    Status
                  </th>
                  <th
                    style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t-text-6)' }}
                  >
                    Match
                  </th>
                  <th style={{ width: 198, padding: '6px 6px 6px 4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, textAlign: 'center', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t-text-6)' }}>
                      <span>HOME</span>
                      <span>DRAW</span>
                      <span>AWAY</span>
                    </div>
                  </th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((fixture) => (
                  <FixtureRow
                    key={String(fixture.apiFixtureId)}
                    fixture={fixture}
                    bestOddsFallback={bestOddsMap.get(fixture.apiFixtureId) ?? null}
                    liveOddsRows={liveOddsByFixture[fixture.apiFixtureId] ?? []}
                    isLiveOddsPending={pendingLiveOddsFixtureIds?.has(fixture.apiFixtureId) ?? false}
                    oddsMovement={oddsMovements?.[fixture.apiFixtureId]}
                    isSaved={savedFixtureIds?.has(fixture.apiFixtureId) ?? false}
                    onToggleSave={onToggleSave}
                    isSelected={selectedFixtureId === fixture.apiFixtureId}
                    onRowClick={onRowClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
