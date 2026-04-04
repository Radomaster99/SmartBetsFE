import { NextRequest, NextResponse } from 'next/server';
import { getFixtureBestOdds } from '@/lib/api/fixtures';
import type { BestOddsDto } from '@/lib/types/api';

interface BatchRequestBody {
  fixtureIds?: number[];
  marketName?: string;
}

const CHUNK_SIZE = 8;

async function fetchBestOddsChunk(
  fixtureIds: number[],
  marketName?: string,
): Promise<Record<string, BestOddsDto | null>> {
  const entries = await Promise.all(
    fixtureIds.map(async (fixtureId) => {
      try {
        const data = await getFixtureBestOdds(fixtureId, marketName);
        return [String(fixtureId), data] as const;
      } catch (error) {
        const message = String(error);
        if (message.includes('404')) {
          return [String(fixtureId), null] as const;
        }

        return [String(fixtureId), null] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

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

  for (let index = 0; index < fixtureIds.length; index += CHUNK_SIZE) {
    const chunk = fixtureIds.slice(index, index + CHUNK_SIZE);
    const chunkResults = await fetchBestOddsChunk(chunk, marketName);
    Object.assign(items, chunkResults);
  }

  return NextResponse.json({ items });
}
