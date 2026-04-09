const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export interface PopularLeaguePreset {
  leagueId: number;
  displayName: string;
  season?: number;
}

export const POPULAR_LEAGUES_UPDATED_EVENT = 'smartbets:popular-leagues-updated';

export const ADMIN_POPULAR_LEAGUES_STORAGE_KEY = 'smartbets:popular-leagues:admin-defaults';
export const USER_POPULAR_LEAGUES_STORAGE_KEY = 'smartbets:popular-leagues:user-custom';
export const USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY = 'smartbets:popular-leagues:user-hidden';

// These are the admin defaults until they are changed from the admin panel.
export const DEFAULT_POPULAR_LEAGUES_PRESET: PopularLeaguePreset[] = [
  { leagueId: 39, displayName: 'Premier League' },
  { leagueId: 2, displayName: 'Champions League' },
  { leagueId: 3, displayName: 'Europa League' },
  { leagueId: 38, displayName: 'Euro U21' },
  { leagueId: 61, displayName: 'Ligue 1' },
  { leagueId: 78, displayName: 'Bundesliga' },
  { leagueId: 135, displayName: 'Serie A' },
  { leagueId: 140, displayName: 'LaLiga' },
  { leagueId: 1, displayName: 'World Cup 2026', season: 2026 },
];

export function getPopularLeagueKey(leagueId: number, season?: number) {
  return `${leagueId}:${season ?? DEFAULT_SEASON}`;
}

export function normalizePopularLeaguePreset(value: unknown): PopularLeaguePreset | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as {
    leagueId?: unknown;
    displayName?: unknown;
    season?: unknown;
  };

  const leagueId = Number(candidate.leagueId);
  if (!Number.isFinite(leagueId) || leagueId <= 0) {
    return null;
  }

  const displayName =
    typeof candidate.displayName === 'string' && candidate.displayName.trim().length
      ? candidate.displayName.trim()
      : `League ${leagueId}`;
  const season =
    typeof candidate.season === 'number' && Number.isFinite(candidate.season)
      ? candidate.season
      : undefined;

  return {
    leagueId,
    displayName,
    season,
  };
}

export function readPopularLeaguePresets(storageKey: string, fallback: PopularLeaguePreset[] = []) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return fallback;
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const normalized = parsed
      .map((value) => normalizePopularLeaguePreset(value))
      .filter((value): value is PopularLeaguePreset => value !== null);

    return normalized.length ? normalized : fallback;
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function writePopularLeaguePresets(storageKey: string, items: PopularLeaguePreset[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(POPULAR_LEAGUES_UPDATED_EVENT));
}

export function mergePopularLeaguePresets(
  adminPresets: PopularLeaguePreset[],
  userPresets: PopularLeaguePreset[],
  hiddenKeys: string[] = [],
) {
  const seen = new Set<string>();
  const hidden = new Set(hiddenKeys);
  const merged: Array<PopularLeaguePreset & { source: 'admin' | 'user' }> = [];

  adminPresets.forEach((item) => {
    const key = getPopularLeagueKey(item.leagueId, item.season);
    if (seen.has(key) || hidden.has(key)) {
      return;
    }

    seen.add(key);
    merged.push({ ...item, source: 'admin' });
  });

  userPresets.forEach((item) => {
    const key = getPopularLeagueKey(item.leagueId, item.season);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push({ ...item, source: 'user' });
  });

  return merged;
}

export function readPopularLeagueKeys(storageKey: string, fallback: string[] = []) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return fallback;
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function writePopularLeagueKeys(storageKey: string, items: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(POPULAR_LEAGUES_UPDATED_EVENT));
}
