'use client';
import { useQuery } from '@tanstack/react-query';
import type { TeamDto } from '../types/api';

async function fetchTeam(apiTeamId: number): Promise<TeamDto> {
  const response = await fetch(`/api/teams/${apiTeamId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch team');
  }

  return response.json();
}

export function useTeam(apiTeamId: number | null) {
  return useQuery({
    queryKey: ['team', apiTeamId],
    queryFn: () => fetchTeam(apiTeamId!),
    staleTime: 300_000,
    enabled: Boolean(apiTeamId),
  });
}
