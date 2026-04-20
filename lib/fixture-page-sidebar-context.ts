export interface FixturePageSidebarContext {
  fixtureId: number;
  leagueId: number;
  season: number;
  leagueName: string;
}

export const FIXTURE_PAGE_SIDEBAR_CONTEXT_STORAGE_KEY = 'oddsdetector:fixture-sidebar-context';
export const FIXTURE_PAGE_SIDEBAR_CONTEXT_EVENT = 'oddsdetector:fixture-sidebar-context-updated';

function isValidContext(value: unknown): value is FixturePageSidebarContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FixturePageSidebarContext>;
  return (
    Number.isFinite(candidate.fixtureId) &&
    Number.isFinite(candidate.leagueId) &&
    Number.isFinite(candidate.season) &&
    typeof candidate.leagueName === 'string' &&
    candidate.leagueName.trim().length > 0
  );
}

export function readFixturePageSidebarContext(): FixturePageSidebarContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(FIXTURE_PAGE_SIDEBAR_CONTEXT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidContext(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeFixturePageSidebarContext(context: FixturePageSidebarContext) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(FIXTURE_PAGE_SIDEBAR_CONTEXT_STORAGE_KEY, JSON.stringify(context));
  window.dispatchEvent(new CustomEvent(FIXTURE_PAGE_SIDEBAR_CONTEXT_EVENT, { detail: context }));
}
