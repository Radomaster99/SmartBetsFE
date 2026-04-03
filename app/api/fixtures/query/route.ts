import { NextRequest, NextResponse } from 'next/server';
import { getFixtures } from '@/lib/api/fixtures';
import type { FixtureFilters } from '@/lib/types/filters';
import type { StateBucket } from '@/lib/types/api';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const filters: FixtureFilters = {
    leagueId: s.get('leagueId') ? Number(s.get('leagueId')) : undefined,
    teamId: s.get('teamId') ? Number(s.get('teamId')) : undefined,
    season: s.get('season') ? Number(s.get('season')) : undefined,
    state: (s.get('state') as StateBucket) || undefined,
    date: s.get('date') || undefined,
    from: s.get('from') || undefined,
    to: s.get('to') || undefined,
    page: s.get('page') ? Number(s.get('page')) : 1,
    pageSize: s.get('pageSize') ? Number(s.get('pageSize')) : 50,
    direction: (s.get('direction') as 'asc' | 'desc') || 'asc',
  };
  try {
    const data = await getFixtures(filters);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
