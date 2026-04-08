import { NextRequest, NextResponse } from 'next/server';
import { getFixtureLiveOdds, getFixtures } from '@/lib/api/fixtures';
import { deriveBestOddsFromOdds, mapLiveOddsToMainMatchOdds } from '@/lib/live-odds';
import type { FixtureFilters } from '@/lib/types/filters';
import type { FixtureDto, LiveOddsSummaryDto, PagedResultDto, StateBucket } from '@/lib/types/api';

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function hydrateLiveFixtureSummaries(data: PagedResultDto<FixtureDto>): Promise<PagedResultDto<FixtureDto>> {
  if (data.items.length === 0) {
    return data;
  }

  const liveSummaryMap = new Map<number, LiveOddsSummaryDto>();

  for (const batch of chunk(data.items, 6)) {
    const results = await Promise.allSettled(
      batch.map(async (fixture) => {
        const markets = await getFixtureLiveOdds(fixture.apiFixtureId, { latestOnly: true });
        const mappedOdds = mapLiveOddsToMainMatchOdds(markets);
        const bestOdds = deriveBestOddsFromOdds(mappedOdds);

        if (!bestOdds) {
          return null;
        }

        return [
          fixture.apiFixtureId,
          {
            apiFixtureId: fixture.apiFixtureId,
            leagueApiId: fixture.leagueApiId,
            source: 'live',
            collectedAtUtc: bestOdds.collectedAtUtc,
            bestHomeOdd: bestOdds.bestHomeOdd,
            bestHomeBookmaker: bestOdds.bestHomeBookmaker,
            bestDrawOdd: bestOdds.bestDrawOdd,
            bestDrawBookmaker: bestOdds.bestDrawBookmaker,
            bestAwayOdd: bestOdds.bestAwayOdd,
            bestAwayBookmaker: bestOdds.bestAwayBookmaker,
          } satisfies LiveOddsSummaryDto,
        ] as const;
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        liveSummaryMap.set(result.value[0], result.value[1]);
        continue;
      }

      if (result.status === 'rejected') {
        const message = String(result.reason);
        if (!message.includes('404')) {
          console.error('[fixtures-query] Failed to hydrate live summary:', message);
        }
      }
    }
  }

  if (liveSummaryMap.size === 0) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((fixture) => ({
      ...fixture,
      liveOddsSummary: liveSummaryMap.get(fixture.apiFixtureId) ?? fixture.liveOddsSummary ?? null,
    })),
  };
}

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const filters: FixtureFilters = {
    leagueId: s.get('leagueId') ? Number(s.get('leagueId')) : undefined,
    teamId: s.get('teamId') ? Number(s.get('teamId')) : undefined,
    season: s.get('season') ? Number(s.get('season')) : undefined,
    state: (s.get('state') as StateBucket) || undefined,
    includeLiveOddsSummary: s.get('includeLiveOddsSummary') === 'true',
    date: s.get('date') || undefined,
    from: s.get('from') || undefined,
    to: s.get('to') || undefined,
    page: s.get('page') ? Number(s.get('page')) : 1,
    pageSize: s.get('pageSize') ? Number(s.get('pageSize')) : 50,
    direction: (s.get('direction') as 'asc' | 'desc') || 'asc',
  };
  try {
    const data = await getFixtures(filters);
    const responseData =
      filters.state === 'Live' && filters.includeLiveOddsSummary ? await hydrateLiveFixtureSummaries(data) : data;
    return NextResponse.json(responseData);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
