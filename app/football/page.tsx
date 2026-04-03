'use client';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { useLiveOddsListSignalR } from '@/lib/hooks/useLiveOdds';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { useFixtureWatchlist } from '@/lib/hooks/useFixtureWatchlist';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { StateBucket } from '@/lib/types/api';

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

function formatUpcomingScopeLabel(scope: UpcomingScope): string {
  return scope === 'all' ? 'All upcoming fixtures' : 'Today upcoming fixtures';
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

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--t-border)', color: 'var(--t-text-3)' }}>
      <span style={{ color: 'var(--t-text-5)' }}>{label}</span>
      <span style={{ color: 'var(--t-text-1)' }}> {value}</span>
    </div>
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
  const rawState = parseState(searchParams.get('state'));
  const rawUpcomingScope = parseUpcomingScope(searchParams.get('upcomingScope'));
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const hasExplicitDate = isValidIsoDate(rawDate);
  const date = hasExplicitDate ? rawDate : today;
  const upcomingScope: UpcomingScope =
    rawState === 'Upcoming' && leagueId !== null && !hasExplicitDate ? rawUpcomingScope : 'today';
  const usesUpcomingRange = rawState === 'Upcoming' && upcomingScope === 'all' && leagueId !== null && !hasExplicitDate;

  const isToday = date === today;
  const isFutureDate = date > today;
  const state: StateBucket | 'All' =
    isFutureDate ? 'Upcoming' : !isToday && rawState === 'Live' ? 'All' : rawState;
  const { data: leagues } = useLeagues(season);
  const { fixtureIds: savedFixtureIds, fixtureIdSet, toggleFixture } = useFixtureWatchlist();
  const [savedOnly, setSavedOnly] = useState(false);
  const activeLeague = leagues?.find((league) => league.apiLeagueId === leagueId) ?? null;

  useEffect(() => {
    const canonicalHref = buildFootballHref(date, state, leagueId, season, upcomingScope);
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, canonicalHref);
    }
  }, [date, leagueId, pathname, router, searchParams, season, state, upcomingScope]);

  const handleDateChange = (nextDate: string) => {
    const nextToday = todayISO();
    const nextIsToday = nextDate === nextToday;
    const nextIsFuture = nextDate > nextToday;
    let nextState = state;

    if (nextIsFuture) {
      nextState = 'Upcoming';
    } else if (!nextIsToday && nextState === 'Live') {
      nextState = 'All';
    }

    router.replace(buildFootballHref(nextDate, nextState, leagueId, season, 'today'), { scroll: false });
  };

  const handleStateChange = (nextState: StateBucket | 'All') => {
    if (isFutureDate) {
      router.replace(buildFootballHref(date, 'Upcoming', leagueId, season, 'today'), { scroll: false });
      return;
    }

    if (!isToday && nextState === 'Live') {
      router.replace(buildFootballHref(date, 'All', leagueId, season, 'today'), { scroll: false });
      return;
    }

    const nextUpcomingScope = nextState === 'Upcoming' ? upcomingScope : 'today';
    router.replace(buildFootballHref(date, nextState, leagueId, season, nextUpcomingScope), { scroll: false });
  };

  const handleUpcomingScopeChange = (nextScope: UpcomingScope) => {
    router.replace(buildFootballHref(today, 'Upcoming', leagueId, season, nextScope), { scroll: false });
  };

  const filters = {
    leagueId: leagueId ?? undefined,
    state: state === 'All' ? undefined : state,
    season,
    includeLiveOddsSummary: state === 'Live',
    pageSize: state === 'Live' ? 80 : 60,
    date: usesUpcomingRange ? undefined : date,
    from: usesUpcomingRange ? today : undefined,
  };

  const { data, isLoading, isError, refetch } = useFixtures(filters);
  const rawFixtures = data?.items ?? [];
  const fixtures = savedOnly ? rawFixtures.filter((fixture) => fixtureIdSet.has(fixture.apiFixtureId)) : rawFixtures;
  const liveFixtureIds = state === 'Live' ? fixtures.map((fixture) => fixture.apiFixtureId) : [];
  const liveOddsListRealtime = useLiveOddsListSignalR(liveFixtureIds, state === 'Live');
  const liveProviderCount =
    state === 'Live'
      ? fixtures.filter((fixture) => fixture.liveOddsSummary?.source === 'live').length
      : 0;
  const liveFallbackCount =
    state === 'Live'
      ? fixtures.filter((fixture) => fixture.liveOddsSummary?.source !== 'live').length
      : 0;
  const fixturesWithOdds = fixtures.filter((fixture) => {
    const summary = fixture.liveOddsSummary;
    if (summary?.bestHomeOdd || summary?.bestDrawOdd || summary?.bestAwayOdd) return true;
    return fixture.stateBucket !== 'Live';
  }).length;
  const savedFixturesInView = fixtures.filter((fixture) => fixtureIdSet.has(fixture.apiFixtureId));
  const savedOutsideViewCount = Math.max(savedFixtureIds.length - savedFixturesInView.length, 0);

  const title =
    state === 'Live'
      ? 'Live market board'
      : state === 'Upcoming'
        ? 'Upcoming price board'
        : 'Football market board';
  const subtitle =
    state === 'Live'
      ? 'Track live fixtures, see where real live prices are flowing, and spot where the board is still using pre-match snapshots.'
      : 'Scan the day, compare the best available prices fast, and jump into a bookmaker in one click.';

  return (
    <div className="flex flex-col h-full">
      <div
        className="panel-shell mx-3 mt-3 rounded-2xl px-4 py-4 md:mx-4 md:px-5 md:py-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--t-text-5)' }}>
              SmartBets Football Desk
            </div>
            <h1 className="text-[22px] font-black tracking-[-0.03em] md:text-[28px]" style={{ color: 'var(--t-text-1)' }}>
              {title}
            </h1>
            <p className="mt-1 max-w-xl text-[13px] md:text-[14px]" style={{ color: 'var(--t-text-3)' }}>
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetricChip label="Date" value={date === today ? 'Today' : date} />
            <MetricChip label="Fixtures" value={String(fixtures.length)} />
            <MetricChip label="Price cards" value={String(fixturesWithOdds)} />
            <MetricChip label="Saved" value={String(savedFixtureIds.length)} />
            {state === 'Live' ? <MetricChip label="Provider feed" value={String(liveProviderCount)} /> : null}
          </div>
        </div>
      </div>

      {savedFixtureIds.length > 0 ? (
        <div className="mx-3 mt-3 rounded-2xl panel-shell px-4 py-3 md:mx-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
                Watchlist
              </div>
              <div className="text-[13px]" style={{ color: 'var(--t-text-3)' }}>
                {savedFixturesInView.length > 0
                  ? 'Saved fixtures in this board stay one tap away.'
                  : 'Your saved fixtures are outside the current filters or date range.'}
                {savedOutsideViewCount > 0 ? ` ${savedOutsideViewCount} saved fixture${savedOutsideViewCount === 1 ? '' : 's'} outside this view.` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSavedOnly((current) => !current)}
              className={savedOnly ? 'chrome-btn chrome-btn-active px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]' : 'chrome-btn px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]'}
            >
              {savedOnly ? 'Show full board' : 'Focus watchlist'}
            </button>
          </div>

          {savedFixturesInView.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {savedFixturesInView.slice(0, 8).map((fixture) => (
                <SavedFixtureLink
                  key={fixture.apiFixtureId}
                  fixtureId={fixture.apiFixtureId}
                  label={`${fixture.homeTeamName} vs ${fixture.awayTeamName}`}
                  context={fixture.stateBucket === 'Live' ? 'Live' : date === today ? 'Today' : date}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <FixtureFilters
        state={state}
        onStateChange={handleStateChange}
        date={date}
        onDateChange={handleDateChange}
        showLiveFilter={isToday}
        showFinishedFilter={!isFutureDate}
        futureOnlyUpcoming={isFutureDate}
      />

      {activeLeague ? (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
        >
          <div className="min-w-0">
            <span className="font-semibold" style={{ color: 'var(--t-text-2)' }}>
              {activeLeague.name} {season}
            </span>
            {state === 'Upcoming' && !isFutureDate ? (
              <span style={{ color: 'var(--t-text-5)' }}>
                {' '} - {formatUpcomingScopeLabel(upcomingScope)}
              </span>
            ) : null}
          </div>
          {state === 'Upcoming' && !isFutureDate ? (
            <div
              className="inline-flex items-center rounded-md p-0.5"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)' }}
            >
              {[
                { value: 'today' as const, label: 'Today' },
                { value: 'all' as const, label: 'All upcoming' },
              ].map((option) => {
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
          ) : (
            <button
              type="button"
              onClick={() => router.replace(buildFootballHref(date, state, null, season, 'today'), { scroll: false })}
              className="rounded px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: 'var(--t-surface-2)',
                border: '1px solid var(--t-border-2)',
                color: 'var(--t-text-3)',
                cursor: 'pointer',
              }}
            >
              Clear filter
            </button>
          )}
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
        <FixtureTable
          fixtures={fixtures}
          isLoading={isLoading}
          oddsMovements={liveOddsListRealtime.movements}
          savedFixtureIds={fixtureIdSet}
          onToggleSave={toggleFixture}
        />
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
