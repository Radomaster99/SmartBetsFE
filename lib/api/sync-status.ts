import { apiFetch, buildQuery } from './client';
import type { SyncStatusDto } from '../types/api';

export async function getSyncStatus(season?: number, activeOnly = true): Promise<SyncStatusDto> {
  const q = buildQuery({ season, activeOnly });
  return apiFetch<SyncStatusDto>(`/api/sync-status${q}`);
}
