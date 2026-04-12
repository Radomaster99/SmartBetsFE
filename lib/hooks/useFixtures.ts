'use client';
import { useQuery } from '@tanstack/react-query';
import type { PagedResultDto, FixtureDto } from '../types/api';
import type { FixtureFilters } from '../types/filters';

async function fetchFixtures(filters: FixtureFilters): Promise<PagedResultDto<FixtureDto>> {
  const params = new URLSearchParams();
  if (filters.leagueId) params.set('leagueId', String(filters.leagueId));
  if (filters.teamId) params.set('teamId', String(filters.teamId));
  if (filters.season) params.set('season', String(filters.season));
  if (filters.state) params.set('state', filters.state);
  if (filters.includeLiveOddsSummary) params.set('includeLiveOddsSummary', 'true');
  if (filters.date) params.set('date', filters.date);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.direction) params.set('direction', filters.direction);
  const res = await fetch(`/api/fixtures/query?${params}`);
  if (!res.ok) throw new Error('Failed to fetch fixtures');
  return res.json();
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
