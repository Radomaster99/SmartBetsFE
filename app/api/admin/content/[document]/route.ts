import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ document: string }>;
}

const BASE_URL = process.env.SMARTBETS_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.API_KEY ?? '';
const ALLOWED_DOCUMENTS = new Set(['bonus-codes', 'hero-banners', 'side-ads', 'popular-leagues']);

function buildBackendUrl(path: string): string {
  if (!BASE_URL) {
    throw new Error('Missing SMARTBETS_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL');
  }

  return `${BASE_URL}${path}`;
}

async function proxyAdminContentRequest(
  request: NextRequest,
  document: string,
  method: 'GET' | 'PUT',
): Promise<NextResponse> {
  const response = await fetch(buildBackendUrl(`/api/admin/content/${document}`), {
    method,
    headers: {
      ...(API_KEY ? { 'X-API-KEY': API_KEY } : {}),
      ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method === 'PUT' ? await request.text() : undefined,
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
}

export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorizedResponse = await requireAdminRequest(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { document } = await context.params;
  if (!ALLOWED_DOCUMENTS.has(document)) {
    return NextResponse.json({ error: 'Unsupported content document' }, { status: 404 });
  }

  try {
    return await proxyAdminContentRequest(request, document, 'GET');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorizedResponse = await requireAdminRequest(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const { document } = await context.params;
  if (!ALLOWED_DOCUMENTS.has(document)) {
    return NextResponse.json({ error: 'Unsupported content document' }, { status: 404 });
  }

  try {
    return await proxyAdminContentRequest(request, document, 'PUT');
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
