'use client';

import { useQuery } from '@tanstack/react-query';
import type { FixtureCornersDto } from '@/lib/types/api';

async function fetchFixtureCorners(fixtureId: string): Promise<FixtureCornersDto | null> {
  const res = await fetch(`/api/fixtures/${fixtureId}/corners`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export function useFixtureCorners(
  fixtureId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: ['fixture-corners', fixtureId],
    queryFn: () => fetchFixtureCorners(fixtureId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!fixtureId,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false,
  });
}
