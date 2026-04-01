'use client';
import { useQuery } from '@tanstack/react-query';
import type { StandingDto } from '../types/api';

async function fetchStandings(leagueId: number, season: number): Promise<StandingDto[]> {
  const res = await fetch(`/api/standings?leagueId=${leagueId}&season=${season}`);
  if (!res.ok) throw new Error('Failed to fetch standings');
  return res.json();
}

export function useStandings(leagueId: number | null, season: number) {
  return useQuery({
    queryKey: ['standings', leagueId, season],
    queryFn: () => fetchStandings(leagueId!, season),
    staleTime: 60_000,
    enabled: !!leagueId,
  });
}
