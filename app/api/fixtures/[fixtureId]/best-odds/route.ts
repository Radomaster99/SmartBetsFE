import { NextRequest, NextResponse } from 'next/server';
import { getFixtureBestOdds } from '@/lib/api/fixtures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  const marketName = req.nextUrl.searchParams.get('marketName') || undefined;
  try {
    const data = await getFixtureBestOdds(Number(fixtureId), marketName);
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
