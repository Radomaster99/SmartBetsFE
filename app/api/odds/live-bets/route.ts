import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import type { LiveBetTypeDto } from '@/lib/types/api';

export async function GET() {
  try {
    const data = await apiFetch<LiveBetTypeDto[]>('/api/odds/live-bets');
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[live-bets] GET /api/odds/live-bets failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
