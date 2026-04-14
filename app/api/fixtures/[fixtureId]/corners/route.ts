import { NextRequest, NextResponse } from 'next/server';
import { getFixtureCorners } from '@/lib/api/fixtures';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;

  try {
    const data = await getFixtureCorners(Number(fixtureId));
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) {
      return NextResponse.json(
        {
          apiFixtureId: Number(fixtureId),
          syncedAtUtc: null,
          hasData: false,
          totalCorners: null,
          home: null,
          away: null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
