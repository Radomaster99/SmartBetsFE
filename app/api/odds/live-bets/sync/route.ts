import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { apiFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  const unauthorizedResponse = await requireAdminRequest(request);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const data = await apiFetch('/api/odds/live-bets/sync', { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[live-bets-sync] POST /api/odds/live-bets/sync failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
