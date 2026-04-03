'use client';
import { useQuery } from '@tanstack/react-query';
import type { OddDto, BestOddsDto } from '../types/api';

async function fetchOdds(fixtureId: string, marketName?: string): Promise<OddDto[]> {
  const params = new URLSearchParams();
  if (marketName) params.set('marketName', marketName);
  const query = params.toString();
  const res = await fetch(`/api/fixtures/${fixtureId}/odds${query ? `?${query}` : ''}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchBestOdds(fixtureId: string, marketName?: string): Promise<BestOddsDto | null> {
  const params = new URLSearchParams();
  if (marketName) params.set('marketName', marketName);
  const query = params.toString();
  const res = await fetch(`/api/fixtures/${fixtureId}/best-odds${query ? `?${query}` : ''}`);
  if (!res.ok) return null;
  return res.json();
}

export function useOdds(fixtureId: string, marketName?: string) {
  return useQuery({
    queryKey: ['odds', fixtureId, marketName],
    queryFn: () => fetchOdds(fixtureId, marketName),
    staleTime: 60_000,
    enabled: !!fixtureId,
  });
}

export function useBestOdds(
  fixtureId: string,
  marketName?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['best-odds', fixtureId, marketName],
    queryFn: () => fetchBestOdds(fixtureId, marketName),
    staleTime: 60_000,
    enabled: (options?.enabled ?? true) && !!fixtureId,
  });
}
