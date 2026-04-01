import { NextRequest, NextResponse } from 'next/server';
import { getFixtureDetail } from '@/lib/api/fixtures';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  try {
    const data = await getFixtureDetail(Number(fixtureId));
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
