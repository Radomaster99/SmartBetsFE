import { NextRequest, NextResponse } from 'next/server';
import { getFixtureBestOdds } from '@/lib/api/fixtures';
import type { BestOddsDto } from '@/lib/types/api';

interface BatchRequestBody {
  fixtureIds?: number[];
  marketName?: string;
}

const CONCURRENCY = 20;

export async function POST(req: NextRequest) {
  let body: BatchRequestBody;

  try {
    body = (await req.json()) as BatchRequestBody;
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
    return NextResponse.json({ items: {} satisfies Record<string, BestOddsDto | null> });
  }

  const marketName = typeof body.marketName === 'string' && body.marketName.trim() ? body.marketName.trim() : undefined;
  const items: Record<string, BestOddsDto | null> = {};

  // Process in parallel batches to stay within backend concurrency limits
  for (let i = 0; i < fixtureIds.length; i += CONCURRENCY) {
    const batch = fixtureIds.slice(i, i + CONCURRENCY);
    const entries = await Promise.all(
      batch.map(async (fixtureId) => {
        try {
          const data = await getFixtureBestOdds(fixtureId, marketName);
          return [String(fixtureId), data] as const;
        } catch {
          return [String(fixtureId), null] as const;
        }
      }),
    );
    for (const [k, v] of entries) items[k] = v;
  }

  return NextResponse.json({ items });
}
