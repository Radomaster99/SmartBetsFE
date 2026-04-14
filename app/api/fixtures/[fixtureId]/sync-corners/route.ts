import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> },
) {
  const { fixtureId } = await params;
  const force = req.nextUrl.searchParams.get('force');

  if (!fixtureId) {
    return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
  }

  const query = buildQuery({ force });

  try {
    const data = await apiFetch(`/api/fixtures/${fixtureId}/sync-corners${query}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[fixture-sync-corners] POST failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
