import type { LiveBetTypeDto } from '@/lib/types/api';

const PRIMARY_THREE_WAY_MARKET_NAMES = ['1x2', 'match winner', 'winner'];
const MINUTE_THREE_WAY_MARKETS = [
  { threshold: 80, names: ['1x2 - 80 minutes'] },
  { threshold: 70, names: ['1x2 - 70 minutes'] },
  { threshold: 60, names: ['1x2 - 60 minutes'] },
  { threshold: 50, names: ['1x2 - 50 minutes'] },
  { threshold: 40, names: ['1x2 - 40 minutes'] },
  { threshold: 30, names: ['1x2 - 30 minutes'] },
  { threshold: 20, names: ['1x2 - 20 minutes'] },
  { threshold: 10, names: ['1x2 - 10 minutes'] },
] as const;

function normalizeBetName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getApiFootballThreeWayFallbackBetIds(
  liveBetTypes: LiveBetTypeDto[],
  elapsed: number | null | undefined,
): number[] {
  if (liveBetTypes.length === 0) {
    return [];
  }

  const betIdByName = new Map<string, number>();
  for (const betType of liveBetTypes) {
    if (!Number.isFinite(betType.apiBetId) || betType.apiBetId <= 0 || !betType.name) {
      continue;
    }

    betIdByName.set(normalizeBetName(betType.name), betType.apiBetId);
  }

  const orderedIds: number[] = [];
  const addFirstMatchingId = (names: readonly string[]) => {
    for (const name of names) {
      const id = betIdByName.get(normalizeBetName(name));
      if (id && !orderedIds.includes(id)) {
        orderedIds.push(id);
        return;
      }
    }
  };

  addFirstMatchingId(PRIMARY_THREE_WAY_MARKET_NAMES);

  const safeElapsed = typeof elapsed === 'number' && Number.isFinite(elapsed) ? elapsed : null;
  if (safeElapsed == null) {
    return orderedIds;
  }

  for (const market of MINUTE_THREE_WAY_MARKETS) {
    if (safeElapsed >= market.threshold) {
      addFirstMatchingId(market.names);
    }
  }

  return orderedIds;
}
