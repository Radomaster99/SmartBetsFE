import { NextRequest, NextResponse } from 'next/server';
import { getFixtures } from '@/lib/api/fixtures';
import type { FixtureFilters } from '@/lib/types/filters';
import type { StateBucket } from '@/lib/types/api';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const page = s.get('page') ? Number(s.get('page')) : 1;
  const pageSize = s.get('pageSize') ? Number(s.get('pageSize')) : 50;
  const filters: FixtureFilters = {
    leagueId: s.get('leagueId') ? Number(s.get('leagueId')) : undefined,
    teamId: s.get('teamId') ? Number(s.get('teamId')) : undefined,
    season: s.get('season') ? Number(s.get('season')) : undefined,
    state: (s.get('state') as StateBucket) || undefined,
    includeLiveOddsSummary: s.get('includeLiveOddsSummary') === 'true',
    date: s.get('date') || undefined,
    from: s.get('from') || undefined,
    to: s.get('to') || undefined,
    page,
    pageSize,
    direction: (s.get('direction') as 'asc' | 'desc') || 'asc',
  };

  try {
    const data = await getFixtures(filters);
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);

    if (message.startsWith('Error: API 404:') || message.startsWith('API 404:')) {
      return NextResponse.json({
        items: [],
        page,
        pageSize,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }

    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
