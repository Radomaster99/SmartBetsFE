import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ document: string }>;
}

const BASE_URL = process.env.SMARTBETS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const ALLOWED_DOCUMENTS = new Set(['bonus-codes', 'hero-banners', 'side-ads', 'popular-leagues']);

function buildBackendUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('Missing SMARTBETS_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL');
  }

  return `${BASE_URL}${path}`;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { document } = await context.params;

  if (!ALLOWED_DOCUMENTS.has(document)) {
    return NextResponse.json({ error: 'Unsupported content document' }, { status: 404 });
  }

  try {
    const response = await fetch(buildBackendUrl(`/api/content/${document}`), {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = await response.text();
    return new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
