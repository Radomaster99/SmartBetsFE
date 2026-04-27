function normalizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildFixtureSlug(home: string, away: string, apiFixtureId: number): string {
  const homeSlug = normalizeSlug(home) || 'home';
  const awaySlug = normalizeSlug(away) || 'away';
  return `${homeSlug}-vs-${awaySlug}-${apiFixtureId}`;
}

export function buildFixturePath(home: string, away: string, apiFixtureId: number): string {
  return `/football/fixtures/${buildFixtureSlug(home, away, apiFixtureId)}`;
}

export interface ParsedFixtureSlug {
  apiFixtureId: number;
  slug: string;
  isLegacyNumeric: boolean;
}

export function parseFixtureSlugParam(param: string): ParsedFixtureSlug | null {
  if (!param) {
    return null;
  }

  const decoded = decodeURIComponent(param);

  if (/^\d+$/.test(decoded)) {
    const id = Number(decoded);
    if (Number.isFinite(id) && id > 0) {
      return { apiFixtureId: id, slug: '', isLegacyNumeric: true };
    }
    return null;
  }

  const match = decoded.match(/^(.*)-(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[2]);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return { apiFixtureId: id, slug: match[1], isLegacyNumeric: false };
}

export function buildLeagueHubSlug(name: string): string {
  return normalizeSlug(name);
}

export function buildLeagueHubPath(name: string): string {
  return `/football/leagues/${buildLeagueHubSlug(name)}`;
}
