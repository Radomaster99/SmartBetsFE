export interface TeamPageNavigationContext {
  teamId: number;
  leagueId?: number | null;
  season?: number | null;
  fromFixtureId?: number | null;
}

const TEAM_PAGE_NAVIGATION_CONTEXT_KEY = 'oddsdetector:team-page-context';

export function writeTeamPageNavigationContext(context: TeamPageNavigationContext): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(TEAM_PAGE_NAVIGATION_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // Ignore storage failures and continue with URL-only navigation.
  }
}

export function readTeamPageNavigationContext(teamId: number): TeamPageNavigationContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(TEAM_PAGE_NAVIGATION_CONTEXT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TeamPageNavigationContext> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (Number(parsed.teamId) !== teamId) {
      return null;
    }

    return {
      teamId,
      leagueId: typeof parsed.leagueId === 'number' ? parsed.leagueId : null,
      season: typeof parsed.season === 'number' ? parsed.season : null,
      fromFixtureId: typeof parsed.fromFixtureId === 'number' ? parsed.fromFixtureId : null,
    };
  } catch {
    return null;
  }
}
