import { NextRequest, NextResponse } from 'next/server';
import { getStandings } from '@/lib/api/standings';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const leagueId = s.get('leagueId');
  const season = s.get('season');
  if (!leagueId || !season) {
    return NextResponse.json({ error: 'leagueId and season required' }, { status: 400 });
  }
  try {
    const data = await getStandings(Number(leagueId), Number(season));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
