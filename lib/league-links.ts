const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export function leagueNameToSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildStandingsPath(
  leagueId: number | null,
  season: number,
  leagueName?: string | null,
): string {
  if (!leagueId) {
    const params = new URLSearchParams();

    if (season !== DEFAULT_SEASON) {
      params.set('season', String(season));
    }

    const query = params.toString();
    return query ? `/football/standings?${query}` : '/football/standings';
  }

  const slug = leagueNameToSlug(leagueName?.trim() || `league-${leagueId}`);
  return `/football/standings/${leagueId}/${season}/${slug}`;
}
