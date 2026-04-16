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
  const fixtureId = s.get('fixtureId');
  const betId = s.get('betId');

  if (!leagueId && !fixtureId) {
    return NextResponse.json({ error: 'leagueId or fixtureId required' }, { status: 400 });
  }

  const q = buildQuery({ leagueId, fixtureId, betId });
  try {
    const data = await apiFetch(`/api/odds/live/sync${q}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[live-odds-sync] POST /api/odds/live/sync failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
