import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api/client';
import type { LiveOddsViewersHeartbeatDto } from '@/lib/types/api';

interface LiveViewersHeartbeatRequestBody {
  fixtureIds?: number[];
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeHeartbeatResponse(payload: unknown): LiveOddsViewersHeartbeatDto {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  return {
    receivedFixtureIds: Array.isArray(record.receivedFixtureIds ?? record.ReceivedFixtureIds)
      ? ((record.receivedFixtureIds ?? record.ReceivedFixtureIds) as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    acceptedFixtureIds: Array.isArray(record.acceptedFixtureIds ?? record.AcceptedFixtureIds)
      ? ((record.acceptedFixtureIds ?? record.AcceptedFixtureIds) as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    activeFixtureIds: Array.isArray(record.activeFixtureIds ?? record.ActiveFixtureIds)
      ? ((record.activeFixtureIds ?? record.ActiveFixtureIds) as unknown[])
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    touchedAtUtc:
      typeof (record.touchedAtUtc ?? record.TouchedAtUtc) === 'string'
        ? String(record.touchedAtUtc ?? record.TouchedAtUtc)
        : new Date().toISOString(),
    viewerHeartbeatTtlSeconds: Number(record.viewerHeartbeatTtlSeconds ?? record.ViewerHeartbeatTtlSeconds ?? 0),
    heartbeatAccepted: readBoolean(record.heartbeatAccepted ?? record.HeartbeatAccepted),
  };
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
      heartbeatAccepted: false,
    } satisfies LiveOddsViewersHeartbeatDto);
  }

  try {
    const data = await apiFetch<unknown>('/api/odds/live/viewers/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ fixtureIds }),
    });

    return NextResponse.json(normalizeHeartbeatResponse(data));
  } catch (error) {
    const message = String(error);
    console.error('[live-viewers-heartbeat] POST /api/odds/live/viewers/heartbeat failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
