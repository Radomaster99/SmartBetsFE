type TeamHrefParamValue = string | number | boolean | null | undefined;

export function teamNameToSlug(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

  return normalized
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildTeamPath(apiTeamId: number, teamName: string): string {
  return `/football/teams/${apiTeamId}/${teamNameToSlug(teamName)}`;
}

export function buildTeamHref(
  apiTeamId: number,
  teamName: string,
  params?: Record<string, TeamHrefParamValue>,
): string {
  const pathname = buildTeamPath(apiTeamId, teamName);

  if (!params) {
    return pathname;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function appendSearchParams(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
