import type { FixtureDto, FixtureTeamStatisticsDto } from '@/lib/types/api';

interface CornersSummary {
  homeCorners: number | null;
  awayCorners: number | null;
  totalCorners: number | null;
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
  for (const stat of getStatisticsArray(entry)) {
    const record = asRecord(stat);
    if (!record || !isCornerStatisticType(record.type)) {
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
