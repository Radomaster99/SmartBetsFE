'use client';

import { useQuery } from '@tanstack/react-query';
import type { LiveBetTypeDto } from '@/lib/types/api';

export const LIVE_BET_TYPES_QUERY_KEY = ['live-bet-types'] as const;

async function fetchLiveBetTypes(): Promise<LiveBetTypeDto[]> {
  const res = await fetch('/api/odds/live-bets', {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch live bet types');
  }

  return res.json();
}

export function useLiveBetTypes(enabled = true) {
  return useQuery({
    queryKey: LIVE_BET_TYPES_QUERY_KEY,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        return await fetchLiveBetTypes();
      } catch (error) {
        console.warn('[useLiveBetTypes] Failed to fetch live bet types:', error);
        return [] as LiveBetTypeDto[];
      }
    },
  });
}
