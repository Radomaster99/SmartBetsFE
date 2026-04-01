import { NextRequest, NextResponse } from 'next/server';
import { getLeagues } from '@/lib/api/leagues';

export async function GET(req: NextRequest) {
  const season = req.nextUrl.searchParams.get('season');
  try {
    const data = await getLeagues(season ? Number(season) : undefined);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
