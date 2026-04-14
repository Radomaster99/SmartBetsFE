import { NextRequest, NextResponse } from 'next/server';
import { getFixtureStatistics } from '@/lib/api/fixtures';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;

  try {
    const data = await getFixtureStatistics(Number(fixtureId));
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
