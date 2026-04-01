import { NextRequest, NextResponse } from 'next/server';
import { getFixtureOdds } from '@/lib/api/fixtures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  const marketName = req.nextUrl.searchParams.get('marketName') || undefined;
  try {
    const data = await getFixtureOdds(Number(fixtureId), marketName);
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) return NextResponse.json([], { status: 200 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
