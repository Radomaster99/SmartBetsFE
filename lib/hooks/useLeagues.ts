'use client';
import { useQuery } from '@tanstack/react-query';
import type { LeagueDto } from '../types/api';

async function fetchLeagues(season?: number): Promise<LeagueDto[]> {
  const params = new URLSearchParams();
  if (season) params.set('season', String(season));
  const res = await fetch(`/api/leagues?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leagues');
  return res.json();
}

export function useLeagues(season?: number) {
  return useQuery({
    queryKey: ['leagues', season],
    queryFn: () => fetchLeagues(season),
    staleTime: 300_000,
  });
}
