import { NextRequest, NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/api/sync-status';

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const season = s.get('season') ? Number(s.get('season')) : undefined;
  const activeOnly = s.get('activeOnly') !== 'false';
  try {
    const data = await getSyncStatus(season, activeOnly);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
