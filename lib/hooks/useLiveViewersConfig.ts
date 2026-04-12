'use client';

import { useQuery } from '@tanstack/react-query';
import type { LiveOddsViewersConfigDto } from '@/lib/types/api';

export const LIVE_VIEWERS_CONFIG_QUERY_KEY = ['live-viewers-config'] as const;

async function fetchLiveViewersConfig(): Promise<LiveOddsViewersConfigDto> {
  const res = await fetch('/api/odds/live/viewers/config', {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch live viewers config');
  }

  return res.json();
}

export function useLiveViewersConfig(enabled = true) {
  return useQuery({
    queryKey: LIVE_VIEWERS_CONFIG_QUERY_KEY,
    queryFn: fetchLiveViewersConfig,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
