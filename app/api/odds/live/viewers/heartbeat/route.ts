import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import type { LiveOddsViewersHeartbeatDto } from '@/lib/types/api';

interface LiveViewersHeartbeatRequestBody {
  fixtureIds?: number[];
}

export async function POST(req: NextRequest) {
  let body: LiveViewersHeartbeatRequestBody;

  try {
    body = (await req.json()) as LiveViewersHeartbeatRequestBody;
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
    return NextResponse.json({
      receivedFixtureIds: [],
      acceptedFixtureIds: [],
      activeFixtureIds: [],
      touchedAtUtc: new Date().toISOString(),
      viewerHeartbeatTtlSeconds: 0,
    } satisfies LiveOddsViewersHeartbeatDto);
  }

  try {
    const data = await apiFetch<LiveOddsViewersHeartbeatDto>('/api/odds/live/viewers/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ fixtureIds }),
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = String(error);
    console.error('[live-viewers-heartbeat] POST /api/odds/live/viewers/heartbeat failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
