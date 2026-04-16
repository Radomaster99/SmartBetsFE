import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.SMARTBETS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const LEGACY_ADMIN_AUTH_COOKIE_NAME = 'smartbets_admin';
export const ADMIN_AUTH_COOKIE_NAME =
  process.env.ADMIN_AUTH_COOKIE_NAME ?? process.env.ADMIN_AUTH__CookieName ?? 'oddsdetector_admin';

export interface AdminSessionDto {
  username?: string | null;
  displayName?: string | null;
  role?: string | null;
  isAuthenticated?: boolean | null;
  [key: string]: unknown;
}

function buildBackendUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('Missing SMARTBETS_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL');
  }

  return `${BASE_URL}${path}`;
}

function buildCookieHeaderFromEntries(entries: Array<{ name: string; value: string }>): string | null {
  if (entries.length === 0) {
    return null;
  }

  return entries.map((entry) => `${entry.name}=${entry.value}`).join('; ');
}

export function hasAdminSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ??
      (ADMIN_AUTH_COOKIE_NAME === LEGACY_ADMIN_AUTH_COOKIE_NAME
        ? null
        : request.cookies.get(LEGACY_ADMIN_AUTH_COOKIE_NAME)?.value),
  );
}

export async function getAdminSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
): Promise<{ session: AdminSessionDto | null; status: number }> {
  const response = await fetch(buildBackendUrl('/api/admin/auth/me'), {
    method: 'GET',
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return { session: null, status: response.status };
  }

  if (!response.ok) {
    return { session: null, status: response.status };
  }

  const payload = (await response.json().catch(() => null)) as AdminSessionDto | null;
  return { session: payload, status: response.status };
}

export async function getAdminSessionFromRequest(request: NextRequest): Promise<AdminSessionDto | null> {
  const { session } = await getAdminSessionFromCookieHeader(request.headers.get('cookie'));
  return session;
}

export async function getAdminSessionFromServerCookies(): Promise<AdminSessionDto | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeaderFromEntries(
    cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
  );
  const { session } = await getAdminSessionFromCookieHeader(cookieHeader);
  return session;
}

export async function requireAdminRequest(request: NextRequest): Promise<NextResponse | null> {
  const { session, status } = await getAdminSessionFromCookieHeader(request.headers.get('cookie'));
  if (session) {
    return null;
  }

  if (status === 403) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
