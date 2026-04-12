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

export async function fetchFixtureDetail(fixtureId: string): Promise<FixtureDetailDto> {
  let res: Response;
  try {
    res = await fetch(`/api/fixtures/${fixtureId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new FixtureDetailError(408, 'The server is warming up. Click Retry — it should connect on the next attempt.');
    }
    throw err;
  }

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
    retry: (failureCount, error) => {
      if (!(error instanceof FixtureDetailError)) {
        return failureCount < 1;
      }

      if (error.status === 404) {
        return false;
      }

      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1_500 * (attemptIndex + 1), 4_000),
    enabled: !!fixtureId,
  });
}
