'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminSessionDto } from '@/lib/admin-auth';

export const ADMIN_SESSION_QUERY_KEY = ['admin-session'] as const;

async function fetchAdminSession(): Promise<AdminSessionDto | null> {
  const res = await fetch('/api/admin/auth/me', {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch admin session');
  }

  return res.json();
}

export function useAdminSession(enabled = true) {
  return useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEY,
    queryFn: fetchAdminSession,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
