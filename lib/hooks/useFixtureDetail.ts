'use client';
import { useQuery } from '@tanstack/react-query';
import type { FixtureDetailDto } from '../types/api';

export class FixtureDetailError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'FixtureDetailError';
    this.status = status;
  }
}

async function fetchFixtureDetail(fixtureId: string): Promise<FixtureDetailDto> {
  const res = await fetch(`/api/fixtures/${fixtureId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      typeof body?.error === 'string' && body.error.trim().length > 0
        ? body.error
        : 'Failed to fetch fixture detail';

    throw new FixtureDetailError(res.status, message);
  }
  return res.json();
}

export function useFixtureDetail(fixtureId: string) {
  return useQuery({
    queryKey: ['fixture', fixtureId],
    queryFn: () => fetchFixtureDetail(fixtureId),
    staleTime: 30_000,
    enabled: !!fixtureId,
  });
}
