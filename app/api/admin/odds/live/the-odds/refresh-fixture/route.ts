import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const apiFixtureId = search.get('apiFixtureId');
  const force = search.get('force');

  if (!apiFixtureId) {
    return NextResponse.json({ error: 'apiFixtureId required' }, { status: 400 });
  }

  const query = buildQuery({ apiFixtureId, force });

  try {
    const data = await apiFetch(`/api/admin/odds/live/the-odds/refresh-fixture${query}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[admin-the-odds-refresh-fixture] POST failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
