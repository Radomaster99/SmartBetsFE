'use client';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PromoStrip } from '@/components/ads/PromoStrip';
import { FixtureDetailPanel } from '@/components/fixtures/FixtureDetailPanel';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { useLiveOddsListSignalR } from '@/lib/hooks/useLiveOdds';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { useFixtureWatchlist } from '@/lib/hooks/useFixtureWatchlist';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { FixtureDto, LiveOddsSummaryDto, StateBucket } from '@/lib/types/api';

const LAST_MATCHES_HREF_KEY = 'smartbets:last-matches-href';
const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
type UpcomingScope = 'today' | 'all';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function isValidIsoDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseState(value: string | null): StateBucket | 'All' {
  if (
    value === 'All' ||
    value === 'Upcoming' ||
    value === 'Live' ||
    value === 'Finished' ||
    value === 'Postponed' ||
    value === 'Cancelled' ||
    value === 'Other' ||
    value === 'Unknown'
  ) {
    return value;
  }

  return 'All';
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseUpcomingScope(value: string | null): UpcomingScope {
  return value === 'all' ? 'all' : 'today';
}

function buildFootballHref(
  date: string,
  state: StateBucket | 'All',
  leagueId: number | null,
  season: number,
  upcomingScope: UpcomingScope = 'today',
): string {
  const params = new URLSearchParams();
  const today = todayISO();

  if (date !== today) {
    params.set('date', date);
  }

  if (state !== 'All') {
    params.set('state', state);
  }

  if (leagueId) {
    params.set('leagueId', String(leagueId));
  }

  if (state === 'Upcoming' && leagueId && upcomingScope === 'all' && date === today) {
    params.set('upcomingScope', 'all');
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    params.set('season', String(season));
  }

  const query = params.toString();
  return query ? `/football?${query}` : '/football';
}

function buildStandingsHref(leagueId: number, season: number): string {
  const params = new URLSearchParams();
  params.set('leagueId', String(leagueId));
  if (season !== DEFAULT_SEASON) params.set('season', String(season));
  return `/football/standings?${params.toString()}`;
}

function formatUpcomingScopeLabel(scope: UpcomingScope): string {
  return scope === 'all' ? 'All upcoming fixtures' : 'Today upcoming fixtures';
}

function isUsableLiveSummary(summary: LiveOddsSummaryDto | null | undefined): summary is LiveOddsSummaryDto {
  if (!summary || summary.source !== 'live') {
    return false;
  }

  return Boolean(summary.bestHomeOdd || summary.bestDrawOdd || summary.bestAwayOdd);
}

function LiveListStatusPill({
  status,
  count,
  providerCount,
  fallbackCount,
}: {
  status: ReturnType<typeof useLiveOddsListSignalR>['status'];
  count: number;
  providerCount: number;
  fallbackCount: number;
}) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.22)', color: 'var(--t-text-3)' }}>
        No live fixtures in view
      </span>
    );
  }

  let label = `${count} live fixtures`;
  let style = {
    background: 'rgba(148,163,184,0.12)',
    border: '1px solid rgba(148,163,184,0.22)',
    color: 'var(--t-text-3)',
  };

  if (status === 'connected') {
    label =
      providerCount > 0
        ? `Realtime connected - ${providerCount} live prices / ${fallbackCount} pre-match`
        : `Realtime connected - no live prices yet, ${fallbackCount} pre-match`;
    style = {
      background: 'rgba(0,230,118,0.12)',
      border: '1px solid rgba(0,230,118,0.28)',
      color: 'var(--t-accent)',
    };
  } else if (status === 'connecting' || status === 'reconnecting') {
    label = `Connecting live feed - ${count} live fixtures`;
    style = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.28)',
      color: '#fbbf24',
    };
  } else if (status === 'error') {
    label = `Live feed unavailable - ${count} live fixtures`;
    style = {
      background: 'rgba(239,83,80,0.12)',
      border: '1px solid rgba(239,83,80,0.24)',
      color: '#fca5a5',
    };
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={style}>
      {status === 'connected' ? <span className="live-dot" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

function FeedLegendPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'provider' | 'fallback';
}) {
  const style =
    tone === 'provider'
      ? {
          background: 'rgba(0,230,118,0.09)',
          border: '1px solid rgba(0,230,118,0.22)',
          color: 'var(--t-accent)',
        }
      : {
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.22)',
          color: '#fbbf24',
        };

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={style}>
      <span>{count}</span>
      <span>{label}</span>
    </span>
  );
}

function SavedFixtureLink({
  fixtureId,
  label,
  context,
}: {
  fixtureId: number;
  label: string;
  context: string;
}) {
  return (
    <a
      href={`/football/fixtures/${fixtureId}`}
      className="chrome-btn rounded-full px-3 py-1.5 text-[11px] font-semibold"
      style={{ textDecoration: 'none' }}
    >
      <span style={{ color: 'var(--t-text-1)' }}>{label}</span>
      <span style={{ color: 'var(--t-text-5)' }}> {' '}• {context}</span>
    </a>
  );
}

function FootballPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayISO();
  const rawDate = searchParams.get('date');
  const rawStateValue = searchParams.get('state');
  const rawUpcomingScopeValue = searchParams.get('upcomingScope');
  const rawState = parseState(rawStateValue);
  const rawUpcomingScope = parseUpcomingScope(rawUpcomingScopeValue);
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const hasExplicitDate = isValidIsoDate(rawDate);
  const date = hasExplicitDate ? rawDate : today;
  const upcomingScope: UpcomingScope =
    rawState === 'Upcoming' && leagueId !== null && !hasExplicitDate ? rawUpcomingScope : 'today';
  const usesUpcomingRange = rawState === 'Upcoming' && upcomingScope === 'all' && leagueId !== null && !hasExplicitDate;

  const isToday = date === today;
  const isFutureDate = date > today;
  const isPastDate = !isToday && !isFutureDate;
  const state: StateBucket | 'All' =
    isFutureDate ? 'Upcoming' : isPastDate ? 'Finished' : rawState;
  const currentQuery = searchParams.toString();
  const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;
  const canonicalHref = buildFootballHref(date, state, leagueId, season, upcomingScope);
  const shouldCanonicalize =
    (rawDate !== null && !hasExplicitDate) ||
    (rawStateValue !== null && parseState(rawStateValue) !== rawStateValue) ||
    (rawUpcomingScopeValue !== null && rawUpcomingScopeValue !== 'today' && rawUpcomingScopeValue !== 'all') ||
    (isFutureDate && rawStateValue !== 'Upcoming') ||
    (isPastDate && rawStateValue !== 'Finished') ||
    (!isToday && rawStateValue === 'Live');
  const { data: leagues } = useLeagues(season);
  const { fixtureIdSet, toggleFixture, upsertFixtures } = useFixtureWatchlist();
  const [stickyLiveSummaries, setStickyLiveSummaries] = useState<Record<number, LiveOddsSummaryDto>>({});
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const activeLeague = leagues?.find((league) => league.apiLeagueId === leagueId) ?? null;

  useEffect(() => {
    if (shouldCanonicalize && canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, currentHref);
    }
  }, [canonicalHref, currentHref, router, shouldCanonicalize]);

  const replaceIfNeeded = (nextHref: string) => {
    if (nextHref === currentHref) {
      return;
    }

    router.replace(nextHref, { scroll: false });
  };

  const handleDateChange = (nextDate: string) => {
    const nextToday = todayISO();
    const nextIsToday = nextDate === nextToday;
    const nextIsFuture = nextDate > nextToday;
    let nextState = state;

    if (nextIsFuture) {
      nextState = 'Upcoming';
    } else if (!nextIsToday) {
      nextState = 'Finished';
    }

    replaceIfNeeded(buildFootballHref(nextDate, nextState, leagueId, season, 'today'));
  };

  const handleStateChange = (nextState: StateBucket | 'All') => {
    if (isFutureDate) {
      replaceIfNeeded(buildFootballHref(date, 'Upcoming', leagueId, season, 'today'));
      return;
    }

    if (!isToday && nextState === 'Live') {
      replaceIfNeeded(buildFootballHref(date, 'All', leagueId, season, 'today'));
      return;
    }

    const nextUpcomingScope = nextState === 'Upcoming' ? upcomingScope : 'today';
    replaceIfNeeded(buildFootballHref(date, nextState, leagueId, season, nextUpcomingScope));
  };

  const handleUpcomingScopeChange = (nextScope: UpcomingScope) => {
    replaceIfNeeded(buildFootballHref(today, 'Upcoming', leagueId, season, nextScope));
  };

  const handleRowClick = (fixture: FixtureDto) => {
    if (window.innerWidth < 768) {
      const params = new URLSearchParams();
      params.set('tab', 'odds');
      router.push(`/football/fixtures/${fixture.apiFixtureId}?${params.toString()}`);
    } else {
      setSelectedFixtureId((prev) => (prev === fixture.apiFixtureId ? null : fixture.apiFixtureId));
    }
  };

  const filters = {
    leagueId: leagueId ?? undefined,
    state: state === 'All' ? undefined : state,
    season,
    includeLiveOddsSummary: true,
    pageSize: state === 'Live' ? 100 : 60,
    // Live: sort newest-kickoff first so today's active matches surface above old stuck fixtures.
    direction: state === 'Live' ? ('desc' as const) : undefined,
    date: usesUpcomingRange ? undefined : date,
    from: usesUpcomingRange ? today : undefined,
  };

  const { data, isLoading, isFetching, isError, refetch } = useFixtures(filters);
  const rawFixtures = data?.items ?? [];
  const visibleFixtureIds = state === 'Live' ? rawFixtures.map((fixture) => fixture.apiFixtureId) : [];

  useEffect(() => {
    if (state !== 'Live') {
      setStickyLiveSummaries((current) => (Object.keys(current).length === 0 ? current : {}));
      return;
    }

    const visibleFixtureIdSet = new Set(visibleFixtureIds);

    setStickyLiveSummaries((current) => {
      const next: Record<number, LiveOddsSummaryDto> = {};
      let changed = false;

      for (const fixture of rawFixtures) {
        const fixtureId = fixture.apiFixtureId;
        const freshSummary = fixture.liveOddsSummary ?? null;

        if (isUsableLiveSummary(freshSummary)) {
          next[fixtureId] = freshSummary;
          const previous = current[fixtureId];
          if (
            !previous ||
            previous.collectedAtUtc !== freshSummary.collectedAtUtc ||
            previous.bestHomeOdd !== freshSummary.bestHomeOdd ||
            previous.bestDrawOdd !== freshSummary.bestDrawOdd ||
            previous.bestAwayOdd !== freshSummary.bestAwayOdd ||
            previous.bestHomeBookmaker !== freshSummary.bestHomeBookmaker ||
            previous.bestDrawBookmaker !== freshSummary.bestDrawBookmaker ||
            previous.bestAwayBookmaker !== freshSummary.bestAwayBookmaker
          ) {
            changed = true;
          }
          continue;
        }

        if (current[fixtureId]) {
          next[fixtureId] = current[fixtureId];
        }
      }

      for (const fixtureId of Object.keys(current)) {
        const numericFixtureId = Number(fixtureId);
        if (!visibleFixtureIdSet.has(numericFixtureId)) {
          changed = true;
        }
      }

      if (!changed && Object.keys(current).length === Object.keys(next).length) {
        return current;
      }

      return next;
    });
  }, [rawFixtures, state, visibleFixtureIds]);

  const hydratedFixtures = rawFixtures.map((fixture): FixtureDto => {
    if (state !== 'Live') {
      return fixture;
    }

    const liveSummary = fixture.liveOddsSummary ?? null;
    const stickyLiveSummary = stickyLiveSummaries[fixture.apiFixtureId] ?? null;
    const preferredLiveSummary = liveSummary?.source === 'live' ? liveSummary : stickyLiveSummary;

    return preferredLiveSummary
      ? {
          ...fixture,
          liveOddsSummary: preferredLiveSummary,
        }
      : fixture;
  });
  const fixtures = hydratedFixtures;
  const liveFixtureIds = state === 'Live' ? fixtures.map((fixture) => fixture.apiFixtureId) : [];
  const liveOddsListRealtime = useLiveOddsListSignalR(liveFixtureIds, state === 'Live');
  const liveProviderCount =
    state === 'Live'
      ? fixtures.filter((fixture) => fixture.liveOddsSummary?.source === 'live').length
      : 0;
  const liveFallbackCount =
    state === 'Live'
      ? fixtures.filter((fixture) => fixture.liveOddsSummary?.source === 'prematch').length
      : 0;
  useEffect(() => {
    if (hydratedFixtures.length === 0) {
      return;
    }

    upsertFixtures(hydratedFixtures);
  }, [hydratedFixtures, upsertFixtures]);

  return (
    <div className="flex flex-col h-full">
      <div className="mx-3 mt-3 md:mx-4">
        <PromoStrip />
      </div>

      <FixtureFilters
        state={state}
        onStateChange={handleStateChange}
        date={date}
        onDateChange={handleDateChange}
        showLiveFilter={isToday}
        showFinishedFilter={!isFutureDate}
        futureOnlyUpcoming={isFutureDate}
        pastOnlyFinished={isPastDate}
      />

      {activeLeague ? (
        <div
          className="flex items-center gap-3 px-4 py-2 text-[12px]"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
        >
          {/* Left: league name + season */}
          <div className="min-w-0 flex-1">
            <span className="font-semibold" style={{ color: 'var(--t-text-2)' }}>
              {activeLeague.name}
            </span>
            <span style={{ color: 'var(--t-text-4)', marginLeft: 4 }}>{season}</span>
          </div>

          {/* Center: Matches / Standings toggle */}
          <div
            className="inline-flex items-center rounded-md p-0.5"
            style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', flexShrink: 0 }}
          >
            <a
              href={buildFootballHref(date, state, activeLeague.apiLeagueId, season, 'today')}
              className="px-2.5 py-1 rounded text-[11px] font-bold transition-all"
              style={{
                color: 'var(--t-text-1)',
                background: 'rgba(255,255,255,0.1)',
                textDecoration: 'none',
              }}
            >
              Matches
            </a>
            <a
              href={buildStandingsHref(activeLeague.apiLeagueId, season)}
              className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
              style={{ color: 'var(--t-text-4)', textDecoration: 'none' }}
            >
              Standings
            </a>
          </div>

          {/* All upcoming scope toggle — only when state=Upcoming */}
          {state === 'Upcoming' && !isFutureDate ? (
            <div
              className="inline-flex items-center rounded-md p-0.5"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', flexShrink: 0 }}
            >
              {([
                { value: 'today' as const, label: 'Today' },
                { value: 'all' as const, label: 'All upcoming' },
              ] as const).map((option) => {
                const active = upcomingScope === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleUpcomingScopeChange(option.value)}
                    className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                    style={{
                      color: active ? 'var(--t-text-1)' : 'var(--t-text-4)',
                      background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => replaceIfNeeded(buildFootballHref(date, state, null, DEFAULT_SEASON, 'today'))}
            className="rounded px-2.5 py-1 text-[11px] font-medium"
            style={{
              color: 'var(--t-text-3)',
              cursor: 'pointer',
              background: 'var(--t-surface-2)',
              border: '1px solid var(--t-border-2)',
              flexShrink: 0,
            }}
          >
            × clear
          </button>
        </div>
      ) : null}

      {state === 'Live' ? (
        <div className="flex items-center gap-3 px-4 py-2 text-[12px]" style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}>
          <LiveListStatusPill
            status={liveOddsListRealtime.status}
            count={liveFixtureIds.length}
            providerCount={liveProviderCount}
            fallbackCount={liveFallbackCount}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <FeedLegendPill label="live prices" count={liveProviderCount} tone="provider" />
            <FeedLegendPill label="pre-match" count={liveFallbackCount} tone="fallback" />
          </div>
          <span style={{ color: 'var(--t-text-5)' }}>
            Live-price rows can flash and move in real time. Pre-match rows stay on the latest snapshot until provider markets appear.
          </span>
        </div>
      ) : null}

      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-400 mb-3">Failed to load fixtures.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/40 rounded text-sm hover:bg-accent/30"
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <FixtureTable
              fixtures={fixtures}
              isLoading={isLoading}
              isFetching={isFetching}
              oddsMovements={liveOddsListRealtime.movements}
              savedFixtureIds={fixtureIdSet}
              onToggleSave={toggleFixture}
              selectedFixtureId={selectedFixtureId ?? undefined}
              onRowClick={handleRowClick}
            />
          </div>
          {selectedFixtureId != null ? (
            <FixtureDetailPanel
              fixtureId={selectedFixtureId}
              onClose={() => setSelectedFixtureId(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function FootballPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FootballPageClient />
    </Suspense>
  );
}
