'use client';
import { useQuery } from '@tanstack/react-query';
import type { PagedResultDto, FixtureDto } from '../types/api';
import type { FixtureFilters } from '../types/filters';

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
  if (pageOverride) {
    params.set('page', String(pageOverride));
  } else if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.direction) params.set('direction', filters.direction);
  return params;
}

async function fetchFixturesPage(filters: FixtureFilters, pageOverride?: number): Promise<PagedResultDto<FixtureDto>> {
  const params = buildFixtureParams(filters, pageOverride);
  const res = await fetch(`/api/fixtures/query?${params}`);
  if (!res.ok) throw new Error('Failed to fetch fixtures');
  return res.json();
}

async function fetchFixtures(filters: FixtureFilters): Promise<PagedResultDto<FixtureDto>> {
  const firstPage = await fetchFixturesPage(filters);
  if (!filters.fetchAllPages || firstPage.totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, index) => index + 2);
  const remainingResults = await Promise.all(
    remainingPages.map((page) => fetchFixturesPage(filters, page)),
  );

  const mergedItems = [firstPage, ...remainingResults].flatMap((page) => page.items);

  return {
    ...firstPage,
    items: mergedItems,
    page: 1,
    pageSize: mergedItems.length,
    totalItems: mergedItems.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

export function useFixtures(filters: FixtureFilters) {
  const isLive = filters.state === 'Live';
  return useQuery({
    queryKey: ['fixtures', filters],
    queryFn: () => fetchFixtures(filters),
    staleTime: 30_000,

    refetchInterval: isLive ? 30_000 : false,
    refetchOnWindowFocus: false,
  });
}
