import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import type { LiveOddsSummaryDto } from '@/lib/types/api';

interface LiveSummaryRequestBody {
  fixtureIds?: number[];
}

export async function POST(req: NextRequest) {
  let body: LiveSummaryRequestBody;

  try {
    body = (await req.json()) as LiveSummaryRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const fixtureIds = Array.from(
    new Set(
      (body.fixtureIds ?? [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (fixtureIds.length === 0) {
    return NextResponse.json([] satisfies LiveOddsSummaryDto[]);
  }

  try {
    const data = await apiFetch<LiveOddsSummaryDto[]>('/api/odds/live/summary', {
      method: 'POST',
      body: JSON.stringify({ fixtureIds }),
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[live-odds-summary] POST /api/odds/live/summary failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
