import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin-auth';
import { apiFetch, buildQuery } from '@/lib/api/client';

export async function POST(req: NextRequest) {
  const unauthorizedResponse = await requireAdminRequest(req);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const s = req.nextUrl.searchParams;
  const season            = s.get('season');
  const includeOdds       = s.get('includeOdds');
  const force             = s.get('force');
  const maxLeagues        = s.get('maxLeagues');
  const stopOnRateLimit   = s.get('stopOnRateLimit');
  const minMinutesSinceLastSync = s.get('minMinutesSinceLastSync');

  const q = buildQuery({ season, includeOdds, force, maxLeagues, stopOnRateLimit, minMinutesSinceLastSync });
  try {
    const data = await apiFetch(`/api/preload/run${q}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = String(e);
    console.error('[preload] POST /api/preload/run failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
