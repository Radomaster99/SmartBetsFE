import { NextRequest, NextResponse } from 'next/server';

const LEGACY_ADMIN_AUTH_COOKIE_NAME = 'smartbets_admin';
const ADMIN_AUTH_COOKIE_NAME =
  process.env.ADMIN_AUTH_COOKIE_NAME ?? process.env.ADMIN_AUTH__CookieName ?? 'oddsdetector_admin';

function hasAdminSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ??
      (ADMIN_AUTH_COOKIE_NAME === LEGACY_ADMIN_AUTH_COOKIE_NAME
        ? null
        : request.cookies.get(LEGACY_ADMIN_AUTH_COOKIE_NAME)?.value),
  );
}

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminLoginPath(pathname: string): boolean {
  return pathname === '/admin/login';
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminCookie = hasAdminSessionCookie(request);

  if (isAdminPage(pathname) && !isAdminLoginPath(pathname) && !hasAdminCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth/') && !hasAdminCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isAdminLoginPath(pathname) && hasAdminCookie) {
    return NextResponse.redirect(new URL('/admin/sync', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
