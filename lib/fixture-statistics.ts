import type {
  FixtureCornersDto,
  FixtureDto,
  FixtureTeamStatisticsDto,
} from '@/lib/types/api';

interface CornersSummary {
  homeCorners: number | null;
  awayCorners: number | null;
  totalCorners: number | null;
}

export interface FixtureStatPairSummary {
  home: number | null;
  away: number | null;
}

export interface FixtureQuickStatsSummary {
  yellowCards: FixtureStatPairSummary | null;
  redCards: FixtureStatPairSummary | null;
  corners: FixtureStatPairSummary | null;
  shotsOnTarget: FixtureStatPairSummary | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/-?\d+(\.\d+)?/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : null;
}

function isCornerStatisticType(type: unknown): boolean {
  const normalized = normalizeText(type);
  return Boolean(normalized && normalized.includes('corner'));
}

function isYellowCardStatisticType(type: unknown): boolean {
  const normalized = normalizeText(type);
  return Boolean(
    normalized &&
      (normalized === 'yellow cards' ||
        normalized === 'yellow card' ||
        normalized.includes('yellow card')),
  );
}

function isRedCardStatisticType(type: unknown): boolean {
  const normalized = normalizeText(type);
  return Boolean(
    normalized &&
      (normalized === 'red cards' ||
        normalized === 'red card' ||
        normalized.includes('red card')),
  );
}

function isShotsOnTargetStatisticType(type: unknown): boolean {
  const normalized = normalizeText(type);
  return Boolean(
    normalized &&
      (normalized === 'shots on goal' ||
        normalized === 'shots on target' ||
        normalized.includes('shots on goal') ||
        normalized.includes('shots on target')),
  );
}

function getTeamApiId(entry: FixtureTeamStatisticsDto | Record<string, unknown>): number | null {
  const directApiTeamId = parseNumericValue((entry as FixtureTeamStatisticsDto).apiTeamId);
  if (directApiTeamId != null) {
    return directApiTeamId;
  }

  const directTeamId = parseNumericValue((entry as FixtureTeamStatisticsDto).teamId);
  if (directTeamId != null) {
    return directTeamId;
  }

  const nestedTeam = asRecord((entry as Record<string, unknown>).team);
  if (!nestedTeam) {
    return null;
  }

  return (
    parseNumericValue(nestedTeam.apiTeamId) ??
    parseNumericValue(nestedTeam.teamId) ??
    parseNumericValue(nestedTeam.id)
  );
}

function getTeamName(entry: FixtureTeamStatisticsDto | Record<string, unknown>): string | null {
  const directTeamName = normalizeText((entry as FixtureTeamStatisticsDto).teamName);
  if (directTeamName) {
    return directTeamName;
  }

  const nestedTeam = asRecord((entry as Record<string, unknown>).team);
  return nestedTeam ? normalizeText(nestedTeam.name) : null;
}

function getStatisticsArray(entry: FixtureTeamStatisticsDto | Record<string, unknown>): unknown[] {
  if (Array.isArray((entry as FixtureTeamStatisticsDto).statistics)) {
    return (entry as FixtureTeamStatisticsDto).statistics as unknown[];
  }

  const record = entry as Record<string, unknown>;
  if (Array.isArray(record.stats)) {
    return record.stats as unknown[];
  }

  if (Array.isArray(record.items)) {
    return record.items as unknown[];
  }

  return [];
}

function getCornersValue(entry: FixtureTeamStatisticsDto | Record<string, unknown>): number | null {
  return getStatisticValue(entry, isCornerStatisticType);
}

function getStatisticValue(
  entry: FixtureTeamStatisticsDto | Record<string, unknown>,
  matchesType: (type: unknown) => boolean,
): number | null {
  for (const stat of getStatisticsArray(entry)) {
    const record = asRecord(stat);
    if (!record || !matchesType(record.type)) {
      continue;
    }

    const parsed = parseNumericValue(record.value);
    if (parsed != null) {
      return parsed;
    }
  }

  return null;
}

export function extractCornersSummary(
  statistics: FixtureTeamStatisticsDto[] | null | undefined,
  fixture: Pick<FixtureDto, 'homeTeamApiId' | 'awayTeamApiId' | 'homeTeamName' | 'awayTeamName'>,
): CornersSummary | null {
  if (!Array.isArray(statistics) || statistics.length === 0) {
    return null;
  }

  let homeCorners: number | null = null;
  let awayCorners: number | null = null;
  const normalizedHomeName = fixture.homeTeamName.trim().toLowerCase();
  const normalizedAwayName = fixture.awayTeamName.trim().toLowerCase();

  for (const rawEntry of statistics) {
    const entry = asRecord(rawEntry);
    if (!entry) {
      continue;
    }

    const cornersValue = getCornersValue(entry);
    if (cornersValue == null) {
      continue;
    }

    const teamApiId = getTeamApiId(entry);
    const teamName = getTeamName(entry);

    if (
      teamApiId === fixture.homeTeamApiId ||
      (teamName && teamName === normalizedHomeName)
    ) {
      homeCorners = cornersValue;
      continue;
    }

    if (
      teamApiId === fixture.awayTeamApiId ||
      (teamName && teamName === normalizedAwayName)
    ) {
      awayCorners = cornersValue;
    }
  }

  if (homeCorners == null && awayCorners == null) {
    return null;
  }

  return {
    homeCorners,
    awayCorners,
    totalCorners:
      homeCorners != null && awayCorners != null ? homeCorners + awayCorners : null,
  };
}

function extractStatPair(
  statistics: FixtureTeamStatisticsDto[] | null | undefined,
  fixture: Pick<FixtureDto, 'homeTeamApiId' | 'awayTeamApiId' | 'homeTeamName' | 'awayTeamName'>,
  matchesType: (type: unknown) => boolean,
): FixtureStatPairSummary | null {
  if (!Array.isArray(statistics) || statistics.length === 0) {
    return null;
  }

  let home: number | null = null;
  let away: number | null = null;
  const normalizedHomeName = fixture.homeTeamName.trim().toLowerCase();
  const normalizedAwayName = fixture.awayTeamName.trim().toLowerCase();

  for (const rawEntry of statistics) {
    const entry = asRecord(rawEntry);
    if (!entry) {
      continue;
    }

    const value = getStatisticValue(entry, matchesType);
    if (value == null) {
      continue;
    }

    const teamApiId = getTeamApiId(entry);
    const teamName = getTeamName(entry);

    if (
      teamApiId === fixture.homeTeamApiId ||
      (teamName && teamName === normalizedHomeName)
    ) {
      home = value;
      continue;
    }

    if (
      teamApiId === fixture.awayTeamApiId ||
      (teamName && teamName === normalizedAwayName)
    ) {
      away = value;
    }
  }

  if (home == null && away == null) {
    return null;
  }

  return { home, away };
}

function extractCornerPair(
  cornersSummary: FixtureCornersDto | null | undefined,
  statistics: FixtureTeamStatisticsDto[] | null | undefined,
  fixture: Pick<FixtureDto, 'homeTeamApiId' | 'awayTeamApiId' | 'homeTeamName' | 'awayTeamName'>,
): FixtureStatPairSummary | null {
  if (cornersSummary?.hasData) {
    const home = cornersSummary.home?.corners ?? null;
    const away = cornersSummary.away?.corners ?? null;
    if (home != null || away != null) {
      return { home, away };
    }
  }

  const derived = extractCornersSummary(statistics, fixture);
  if (!derived) {
    return null;
  }

  return {
    home: derived.homeCorners,
    away: derived.awayCorners,
  };
}

export function extractFixtureQuickStatsSummary(
  statistics: FixtureTeamStatisticsDto[] | null | undefined,
  fixture: Pick<FixtureDto, 'homeTeamApiId' | 'awayTeamApiId' | 'homeTeamName' | 'awayTeamName'>,
  cornersSummary?: FixtureCornersDto | null,
): FixtureQuickStatsSummary | null {
  const yellowCards = extractStatPair(statistics, fixture, isYellowCardStatisticType);
  const redCards = extractStatPair(statistics, fixture, isRedCardStatisticType);
  const corners = extractCornerPair(cornersSummary, statistics, fixture);
  const shotsOnTarget = extractStatPair(statistics, fixture, isShotsOnTargetStatisticType);

  if (!yellowCards && !redCards && !corners && !shotsOnTarget) {
    return null;
  }

  return {
    yellowCards,
    redCards,
    corners,
    shotsOnTarget,
  };
}
