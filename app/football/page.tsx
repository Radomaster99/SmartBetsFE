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

function buildFootballHref(
  date: string,
  state: StateBucket | 'All',
  leagueId: number | null,
  season: number,
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

  if (leagueId || season !== DEFAULT_SEASON) {
    params.set('season', String(season));
  }

  const query = params.toString();
  return query ? `/football?${query}` : '/football';
}

function FootballPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayISO();
  const rawDate = searchParams.get('date');
  const rawState = parseState(searchParams.get('state'));
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const hasExplicitDate = isValidIsoDate(rawDate);
  const date = hasExplicitDate ? rawDate : today;
  const usesUpcomingRange = rawState === 'Upcoming' && !hasExplicitDate && leagueId !== null;

  const isToday = date === today;
  const isFutureDate = date > today;
  const state: StateBucket | 'All' =
    isFutureDate ? 'Upcoming' : !isToday && rawState === 'Live' ? 'All' : rawState;
  const { data: leagues } = useLeagues(season);
  const activeLeague = leagues?.find((league) => league.apiLeagueId === leagueId) ?? null;

  useEffect(() => {
    const canonicalHref = buildFootballHref(date, state, leagueId, season);
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, canonicalHref);
    }
  }, [date, leagueId, pathname, router, searchParams, season, state]);

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

    router.replace(buildFootballHref(nextDate, nextState, leagueId, season), { scroll: false });
  };

  const handleStateChange = (nextState: StateBucket | 'All') => {
    if (isFutureDate) {
      router.replace(buildFootballHref(date, 'Upcoming', leagueId, season), { scroll: false });
      return;
    }

    if (!isToday && nextState === 'Live') {
      router.replace(buildFootballHref(date, 'All', leagueId, season), { scroll: false });
      return;
    }

    router.replace(buildFootballHref(date, nextState, leagueId, season), { scroll: false });
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
            <span style={{ color: 'var(--t-text-5)' }}>League filter:</span>{' '}
            <span className="font-semibold" style={{ color: 'var(--t-text-2)' }}>
              {activeLeague.countryName} - {activeLeague.name}
            </span>
            <span style={{ color: 'var(--t-text-5)' }}> - {season}</span>
            {usesUpcomingRange ? (
              <span style={{ color: 'var(--t-text-5)' }}> - all upcoming fixtures</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => router.replace(buildFootballHref(date, state, null, season), { scroll: false })}
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
