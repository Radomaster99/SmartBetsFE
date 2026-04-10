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
  savedFixtureIds?: Set<number>;
  onToggleSave?: (fixture: FixtureDto) => void;
  selectedFixtureId?: number;
  onRowClick?: (fixture: FixtureDto) => void;
  onVisibleLiveFixtureIdsChange?: (fixtureIds: number[]) => void;
}

function needsBestOddsFallback(fixture: FixtureDto): boolean {
  // Live fixtures must only show live odds from the backend liveOddsSummary.
  // Never fall back to pre-match batch odds on live rows.
  if (fixture.stateBucket === 'Live') {
    return false;
  }
  const liveSummary = fixture.liveOddsSummary ?? null;
  // If the backend already returned odds via liveOddsSummary (live or prematch), no batch call needed.
  if (liveSummary?.source === 'live' || liveSummary?.source === 'prematch') {
    return false;
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

function MobileOddsCell({
  fixtureId,
  label,
  odd,
  bookmaker,
}: {
  fixtureId: number;
  label: string;
  odd: number | null;
  bookmaker: string | null;
}) {
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
}: {
  fixture: FixtureDto;
  bestOddsFallback: BestOddsDto | null;
  liveOddsRows: OddDto[];
  isSaved: boolean;
  onToggleSave?: (fixture: FixtureDto) => void;
}) {
  const router = useRouter();
  const isLive = fixture.stateBucket === 'Live';
  const liveSummary = fixture.liveOddsSummary ?? null;
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

  // Use liveOddsSummary for both live and upcoming (backend populates it via includeLiveOddsSummary).
  // Fall back to bestOddsFallback (batch call) when the summary is absent.
  const homeOdd = liveBestOdds?.homeOdd ?? liveSummary?.bestHomeOdd ?? bestOddsFallback?.bestHomeOdd ?? null;
  const drawOdd = liveBestOdds?.drawOdd ?? liveSummary?.bestDrawOdd ?? bestOddsFallback?.bestDrawOdd ?? null;
  const awayOdd = liveBestOdds?.awayOdd ?? liveSummary?.bestAwayOdd ?? bestOddsFallback?.bestAwayOdd ?? null;
  const homeBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.homeBookmaker ?? liveSummary?.bestHomeBookmaker ?? bestOddsFallback?.bestHomeBookmaker,
  );
  const drawBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.drawBookmaker ?? liveSummary?.bestDrawBookmaker ?? bestOddsFallback?.bestDrawBookmaker,
  );
  const awayBookmaker = resolveBookmakerForDisplay(
    liveBestOdds?.awayBookmaker ?? liveSummary?.bestAwayBookmaker ?? bestOddsFallback?.bestAwayBookmaker,
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
              {statusTone.label}
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
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="1" odd={homeOdd} bookmaker={homeBookmaker} />
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="X" odd={drawOdd} bookmaker={drawBookmaker} />
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="2" odd={awayOdd} bookmaker={awayBookmaker} />
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
      {isLoading ? <div className="sticky top-0 z-20"><FetchingBar /></div> : null}
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
