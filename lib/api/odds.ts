import { apiFetch, buildQuery } from './client';
import type { OddDto, BestOddsDto } from '../types/api';

export async function getOdds(apiFixtureId: number, marketName?: string): Promise<OddDto[]> {
  const q = buildQuery({ apiFixtureId, marketName, latestOnly: true });
  return apiFetch<OddDto[]>(`/api/odds${q}`);
}

export async function getBestOdds(apiFixtureId: number, marketName?: string): Promise<BestOddsDto> {
  const q = buildQuery({ apiFixtureId, marketName });
  return apiFetch<BestOddsDto>(`/api/odds/best${q}`);
}
