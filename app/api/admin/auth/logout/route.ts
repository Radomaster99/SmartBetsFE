import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.SMARTBETS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function buildBackendUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('Missing SMARTBETS_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL');
  }

  return `${BASE_URL}${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(buildBackendUrl('/api/admin/auth/logout'), {
      method: 'POST',
      headers: request.headers.get('cookie') ? { Cookie: request.headers.get('cookie') as string } : {},
      cache: 'no-store',
    });

    const payload = await response.text();
    const proxied = new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      proxied.headers.set('set-cookie', setCookie);
    }

    return proxied;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
