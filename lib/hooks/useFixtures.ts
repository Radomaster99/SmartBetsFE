'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PagedResultDto, FixtureDto } from '../types/api';
import type { FixtureFilters } from '../types/filters';

const FIXTURES_STALE_TIME = 5 * 60_000; // 5 minutes

function buildFixtureParams(filters: FixtureFilters, pageOverride?: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.leagueId) params.set('leagueId', String(filters.leagueId));
  if (filters.teamId) params.set('teamId', String(filters.teamId));
  if (filters.season) params.set('season', String(filters.season));
  if (filters.state) params.set('state', filters.state);
  if (filters.includeLiveOddsSummary) params.set('includeLiveOddsSummary', 'true');
  if (filters.date) params.set('date', filters.date);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (pageOverride != null) {
    params.set('page', String(pageOverride));
  } else if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.direction) params.set('direction', filters.direction);
  return params;
}

async function fetchFixturesPage(
  filters: FixtureFilters,
  pageOverride?: number,
): Promise<PagedResultDto<FixtureDto>> {
  const params = buildFixtureParams(filters, pageOverride);
  const res = await fetch(`/api/fixtures/query?${params}`);
  if (!res.ok) throw new Error('Failed to fetch fixtures');
  return res.json();
}

export function useFixtures(filters: FixtureFilters) {
  const isLive = filters.state === 'Live';
  return useInfiniteQuery({
    queryKey: ['fixtures', filters],
    queryFn: ({ pageParam }) => fetchFixturesPage(filters, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: PagedResultDto<FixtureDto>) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: FIXTURES_STALE_TIME,
    refetchInterval: isLive ? 30_000 : false,
    refetchOnWindowFocus: false,
  });
}

/** Flatten all loaded pages into a single array. */
export function flattenFixturePages(
  data: ReturnType<typeof useFixtures>['data'],
): FixtureDto[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}
