'use client';
import { useQuery } from '@tanstack/react-query';
import type { SyncStatusDto } from '../types/api';

async function fetchSyncStatus(season?: number): Promise<SyncStatusDto> {
  const params = new URLSearchParams({ activeOnly: 'true' });
  if (season) params.set('season', String(season));
  const res = await fetch(`/api/sync-status?${params}`);
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}

export function useSyncStatus(season?: number) {
  return useQuery({
    queryKey: ['sync-status', season],
    queryFn: () => fetchSyncStatus(season),
    staleTime: 60_000,
  });
}
