'use client';
import { isActivelyLiveFixture } from '@/lib/fixtures/live-status';
import { flattenFixturePages, useFixtures } from './useFixtures';

/**
 * Returns the total number of currently live fixtures across all leagues.
 * Polls at the standard stale time via React Query.
 */

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export function useLiveFixtureCount(): number {
  const { data } = useFixtures({
    state: 'Live',
    pageSize: 100,
    season: DEFAULT_SEASON,
    includeLiveOddsSummary: true,
    fetchAllPages: true,
  });
  return flattenFixturePages(data).filter(isActivelyLiveFixture).length;
}
