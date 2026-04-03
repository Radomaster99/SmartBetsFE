import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';

export async function POST() {
  try {
    const data = await apiFetch('/api/odds/live-bets/sync', { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[live-bets-sync] POST /api/odds/live-bets/sync failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
