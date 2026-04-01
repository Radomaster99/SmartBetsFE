import { apiFetch, buildQuery } from './client';
import type { LeagueDto } from '../types/api';

export async function getLeagues(season?: number): Promise<LeagueDto[]> {
  const q = buildQuery({ season });
  return apiFetch<LeagueDto[]>(`/api/leagues${q}`);
}
