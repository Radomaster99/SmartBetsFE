import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const leagueId = s.get('leagueId');
  const season = s.get('season');
  if (!leagueId || !season) {
    return NextResponse.json({ error: 'leagueId and season required' }, { status: 400 });
  }
  const q = buildQuery({ leagueId, season });
  try {
    const data = await apiFetch(`/api/fixtures/sync-upcoming${q}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
