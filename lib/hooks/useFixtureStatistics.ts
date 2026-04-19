'use client';

import { useQuery } from '@tanstack/react-query';
import type { FixtureTeamStatisticsDto } from '@/lib/types/api';

async function fetchFixtureStatistics(fixtureId: string): Promise<FixtureTeamStatisticsDto[]> {
  const res = await fetch(`/api/fixtures/${fixtureId}/statistics`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export function useFixtureStatistics(
  fixtureId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: ['fixture-statistics', fixtureId],
    queryFn: () => fetchFixtureStatistics(fixtureId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!fixtureId,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
