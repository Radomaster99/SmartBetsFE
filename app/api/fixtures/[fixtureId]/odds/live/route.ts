import { NextRequest, NextResponse } from 'next/server';
import { getFixtureLiveOdds } from '@/lib/api/fixtures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  const betId = req.nextUrl.searchParams.get('betId');
  const bookmakerId = req.nextUrl.searchParams.get('bookmakerId');
  const latestOnlyParam = req.nextUrl.searchParams.get('latestOnly');

  try {
    const data = await getFixtureLiveOdds(Number(fixtureId), {
      betId: betId ? Number(betId) : undefined,
      bookmakerId: bookmakerId ? Number(bookmakerId) : undefined,
      latestOnly: latestOnlyParam ? latestOnlyParam === 'true' : true,
    });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) {
      return NextResponse.json([], { status: 200 });
    }
    if (msg.includes('401')) {
      console.error(`[live-odds] Unauthorized fetching live odds for fixture ${fixtureId} — check API_KEY and backend JWT config`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(`[live-odds] Error fetching live odds for fixture ${fixtureId}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
