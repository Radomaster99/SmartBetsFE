import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const unauthorizedResponse = await requireAdminRequest(req);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const s = req.nextUrl.searchParams;
  const leagueId = s.get('leagueId');
  const season = s.get('season');
  const maxLeagues = s.get('maxLeagues');

  if (!season) {
    return NextResponse.json({ error: 'season required' }, { status: 400 });
  }

  const q = buildQuery({ leagueId, season, maxLeagues });
  try {
    const data = await apiFetch(`/api/fixtures/sync${q}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[fixtures-sync] POST /api/fixtures/sync failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
