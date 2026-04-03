'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
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
    pageSize: 100,
    date: usesUpcomingRange ? undefined : date,
    from: usesUpcomingRange ? today : undefined,
  };

  const { data, isLoading, isError, refetch } = useFixtures(filters);

  return (
    <div className="flex flex-col h-full">
      <SyncFreshnessBanner />

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
                      color: active ? '#000' : 'var(--t-text-4)',
                      background: active ? 'var(--t-accent)' : 'transparent',
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
        <FixtureTable fixtures={data?.items ?? []} isLoading={isLoading} />
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
