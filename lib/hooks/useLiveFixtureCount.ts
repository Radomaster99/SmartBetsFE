'use client';
import { useFixtures } from './useFixtures';

/**
 * Returns the total number of currently live fixtures across all leagues.
 * Polls at the standard stale time via React Query.
 */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function useLiveFixtureCount(): number {
  const { data } = useFixtures({ state: 'Live', pageSize: 1, date: todayISO() });
  return data?.totalItems ?? 0;
}
