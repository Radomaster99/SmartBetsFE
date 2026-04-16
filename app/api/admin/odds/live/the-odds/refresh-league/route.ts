import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const unauthorizedResponse = await requireAdminRequest(req);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const search = req.nextUrl.searchParams;
  const leagueId = search.get('leagueId');
  const season = search.get('season');
  const force = search.get('force');

  if (!leagueId || !season) {
    return NextResponse.json({ error: 'leagueId and season required' }, { status: 400 });
  }

  const query = buildQuery({ leagueId, season, force });

  try {
    const data = await apiFetch(`/api/admin/odds/live/the-odds/refresh-league${query}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[admin-the-odds-refresh-league] POST failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
