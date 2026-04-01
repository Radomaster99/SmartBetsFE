'use client';
import { useQuery } from '@tanstack/react-query';
import type { FixtureDetailDto } from '../types/api';

async function fetchFixtureDetail(fixtureId: string): Promise<FixtureDetailDto> {
  const res = await fetch(`/api/fixtures/${fixtureId}`);
  if (!res.ok) throw new Error('Failed to fetch fixture detail');
  return res.json();
}

export function useFixtureDetail(fixtureId: string) {
  return useQuery({
    queryKey: ['fixture', fixtureId],
    queryFn: () => fetchFixtureDetail(fixtureId),
    staleTime: 30_000,
    enabled: !!fixtureId,
  });
}
