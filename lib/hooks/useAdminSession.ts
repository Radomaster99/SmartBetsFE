'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminSessionDto } from '@/lib/admin-auth';

export const ADMIN_SESSION_QUERY_KEY = ['admin-session'] as const;

function normalizeAdminSession(payload: AdminSessionDto | null): AdminSessionDto | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.isAuthenticated === false) {
    return null;
  }

  const role = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : '';
  const username = typeof payload.username === 'string' ? payload.username.trim() : '';
  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : '';

  if (payload.isAuthenticated === true || role === 'admin' || Boolean(username) || Boolean(displayName)) {
    return payload;
  }

  return null;
}

async function fetchAdminSession(): Promise<AdminSessionDto | null> {
  const res = await fetch('/api/admin/auth/me', {
    cache: 'no-store',
    credentials: 'include',
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch admin session');
  }

  const payload = (await res.json().catch(() => null)) as AdminSessionDto | null;
  return normalizeAdminSession(payload);
}

export function useAdminSession(enabled = true) {
  return useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEY,
    queryFn: fetchAdminSession,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false,
  });
}
