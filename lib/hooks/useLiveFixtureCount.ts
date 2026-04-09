'use client';
import { useFixtures } from './useFixtures';

/**
 * Returns the total number of currently live fixtures across all leagues.
 * Polls at the standard stale time via React Query.
 */
export function useLiveFixtureCount(): number {
  const { data } = useFixtures({ state: 'Live', pageSize: 1 });
  return data?.totalItems ?? 0;
}
