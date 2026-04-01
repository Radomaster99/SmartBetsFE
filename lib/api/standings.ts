import { apiFetch, buildQuery } from './client';
import type { StandingDto } from '../types/api';

export async function getStandings(leagueId: number, season: number): Promise<StandingDto[]> {
  const q = buildQuery({ leagueId, season });
  return apiFetch<StandingDto[]>(`/api/standings${q}`);
}
