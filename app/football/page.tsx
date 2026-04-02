'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { StateBucket } from '@/lib/types/api';

const LAST_MATCHES_HREF_KEY = 'smartbets:last-matches-href';

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

function buildFootballHref(date: string, state: StateBucket | 'All'): string {
  const params = new URLSearchParams();
  const today = todayISO();

  if (date !== today) {
    params.set('date', date);
  }

  if (state !== 'All') {
    params.set('state', state);
  }

  const query = params.toString();
  return query ? `/football?${query}` : '/football';
}

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function FootballPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayISO();
  const rawDate = searchParams.get('date');
  const parsedDate = isValidIsoDate(rawDate) ? rawDate : today;
  const rawState = parseState(searchParams.get('state'));
  const date = parsedDate;

  const isToday = date === today;
  const isFutureDate = date > today;
  const state: StateBucket | 'All' =
    isFutureDate ? 'Upcoming' : !isToday && rawState === 'Live' ? 'All' : rawState;

  useEffect(() => {
    const canonicalHref = buildFootballHref(date, state);
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, canonicalHref);
    }
  }, [date, state, pathname, router, searchParams]);

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

    router.replace(buildFootballHref(nextDate, nextState), { scroll: false });
  };

  const handleStateChange = (nextState: StateBucket | 'All') => {
    if (isFutureDate) {
      router.replace(buildFootballHref(date, 'Upcoming'), { scroll: false });
      return;
    }

    if (!isToday && nextState === 'Live') {
      router.replace(buildFootballHref(date, 'All'), { scroll: false });
      return;
    }

    router.replace(buildFootballHref(date, nextState), { scroll: false });
  };

  const filters = {
    date,
    state: state === 'All' ? undefined : state,
    season: DEFAULT_SEASON,
    pageSize: 100,
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
