import { apiFetch } from './client';
import type { TeamDto } from '../types/api';

function unwrapArrayPayload<T>(payload: T[] | { value?: T[] }): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.value) ? payload.value : [];
}

export async function getTeams(): Promise<TeamDto[]> {
  const payload = await apiFetch<TeamDto[] | { value?: TeamDto[] }>('/api/teams');
  return unwrapArrayPayload(payload);
}

export async function getTeam(apiTeamId: number): Promise<TeamDto | null> {
  return apiFetch<TeamDto>(`/api/teams/${apiTeamId}`);
}
