'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FixtureDto } from '@/lib/types/api';

const WATCHLIST_STORAGE_KEY = 'smartbets:watchlist-fixtures';
export const WATCHLIST_UPDATED_EVENT = 'smartbets:watchlist-fixtures-updated';

export type WatchlistFixtureEntry = {
  apiFixtureId: number;
  savedAtUtc: string;
  kickoffAt?: string;
  stateBucket?: FixtureDto['stateBucket'];
  status?: string;
  elapsed?: number | null;
  statusExtra?: number | null;
  leagueName?: string;
  countryName?: string;
  season?: number;
  homeTeamName?: string;
  homeTeamLogoUrl?: string;
  awayTeamName?: string;
  awayTeamLogoUrl?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
};

function isFiniteFixtureId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function fixtureToWatchlistEntry(fixture: FixtureDto): WatchlistFixtureEntry {
  return {
    apiFixtureId: fixture.apiFixtureId,
    savedAtUtc: new Date().toISOString(),
    kickoffAt: fixture.kickoffAt,
    stateBucket: fixture.stateBucket,
    status: fixture.status,
    elapsed: fixture.elapsed ?? null,
    statusExtra: fixture.statusExtra ?? null,
    leagueName: fixture.leagueName,
    countryName: fixture.countryName,
    season: fixture.season,
    homeTeamName: fixture.homeTeamName,
    homeTeamLogoUrl: fixture.homeTeamLogoUrl,
    awayTeamName: fixture.awayTeamName,
    awayTeamLogoUrl: fixture.awayTeamLogoUrl,
    homeGoals: fixture.homeGoals,
    awayGoals: fixture.awayGoals,
  };
}

function areWatchlistEntriesEqual(left: WatchlistFixtureEntry, right: WatchlistFixtureEntry): boolean {
  return (
    left.apiFixtureId === right.apiFixtureId &&
    left.savedAtUtc === right.savedAtUtc &&
    left.kickoffAt === right.kickoffAt &&
    left.stateBucket === right.stateBucket &&
    left.status === right.status &&
    left.elapsed === right.elapsed &&
    left.statusExtra === right.statusExtra &&
    left.leagueName === right.leagueName &&
    left.countryName === right.countryName &&
    left.season === right.season &&
    left.homeTeamName === right.homeTeamName &&
    left.homeTeamLogoUrl === right.homeTeamLogoUrl &&
    left.awayTeamName === right.awayTeamName &&
    left.awayTeamLogoUrl === right.awayTeamLogoUrl &&
    left.homeGoals === right.homeGoals &&
    left.awayGoals === right.awayGoals
  );
}

function normalizeWatchlistEntry(value: unknown): WatchlistFixtureEntry | null {
  if (isFiniteFixtureId(value)) {
    return {
      apiFixtureId: value,
      savedAtUtc: new Date(0).toISOString(),
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const apiFixtureId = Number(candidate.apiFixtureId ?? candidate.fixtureId ?? candidate.id);

  if (!isFiniteFixtureId(apiFixtureId)) {
    return null;
  }

  return {
    apiFixtureId,
    savedAtUtc:
      typeof candidate.savedAtUtc === 'string' && candidate.savedAtUtc
        ? candidate.savedAtUtc
        : new Date(0).toISOString(),
    kickoffAt: typeof candidate.kickoffAt === 'string' ? candidate.kickoffAt : undefined,
    stateBucket: typeof candidate.stateBucket === 'string' ? (candidate.stateBucket as FixtureDto['stateBucket']) : undefined,
    status: typeof candidate.status === 'string' ? candidate.status : undefined,
    elapsed: typeof candidate.elapsed === 'number' ? candidate.elapsed : null,
    statusExtra: typeof candidate.statusExtra === 'number' ? candidate.statusExtra : null,
    leagueName: typeof candidate.leagueName === 'string' ? candidate.leagueName : undefined,
    countryName: typeof candidate.countryName === 'string' ? candidate.countryName : undefined,
    season: typeof candidate.season === 'number' ? candidate.season : undefined,
    homeTeamName: typeof candidate.homeTeamName === 'string' ? candidate.homeTeamName : undefined,
    homeTeamLogoUrl: typeof candidate.homeTeamLogoUrl === 'string' ? candidate.homeTeamLogoUrl : undefined,
    awayTeamName: typeof candidate.awayTeamName === 'string' ? candidate.awayTeamName : undefined,
    awayTeamLogoUrl: typeof candidate.awayTeamLogoUrl === 'string' ? candidate.awayTeamLogoUrl : undefined,
    homeGoals: typeof candidate.homeGoals === 'number' ? candidate.homeGoals : null,
    awayGoals: typeof candidate.awayGoals === 'number' ? candidate.awayGoals : null,
  };
}

function normalizeWatchlistEntries(raw: string | null): WatchlistFixtureEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const unique = new Map<number, WatchlistFixtureEntry>();

    for (const item of parsed) {
      const entry = normalizeWatchlistEntry(item);

      if (!entry) {
        continue;
      }

      if (!unique.has(entry.apiFixtureId)) {
        unique.set(entry.apiFixtureId, entry);
      }
    }

    return Array.from(unique.values()).slice(0, 100);
  } catch {
    return [];
  }
}

export function useFixtureWatchlist() {
  const [entries, setEntries] = useState<WatchlistFixtureEntry[]>([]);
  const serializedRef = useRef('[]');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromStorage = () => {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      const nextSerialized = raw ?? '[]';

      if (nextSerialized === serializedRef.current) {
        return;
      }

      const nextEntries = normalizeWatchlistEntries(raw);
      serializedRef.current = JSON.stringify(nextEntries);
      setEntries(nextEntries);
    };

    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      const nextEntries = normalizeWatchlistEntries(raw);
      serializedRef.current = JSON.stringify(nextEntries);
      setEntries(nextEntries);
    } catch {
      window.localStorage.removeItem(WATCHLIST_STORAGE_KEY);
      serializedRef.current = '[]';
      setEntries([]);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === WATCHLIST_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(WATCHLIST_UPDATED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextSerialized = JSON.stringify(entries);
    serializedRef.current = nextSerialized;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, nextSerialized);
    window.dispatchEvent(new CustomEvent(WATCHLIST_UPDATED_EVENT));
  }, [entries]);

  const fixtureIds = useMemo(() => entries.map((entry) => entry.apiFixtureId), [entries]);
  const fixtureIdSet = useMemo(() => new Set(fixtureIds), [fixtureIds]);

  const toggleFixture = useCallback((fixture: FixtureDto | WatchlistFixtureEntry | number) => {
    const nextEntry =
      typeof fixture === 'number'
        ? ({
            apiFixtureId: fixture,
            savedAtUtc: new Date().toISOString(),
          } satisfies WatchlistFixtureEntry)
        : 'homeTeamName' in fixture && 'awayTeamName' in fixture && 'kickoffAt' in fixture
          ? fixtureToWatchlistEntry(fixture as FixtureDto)
          : {
              ...(fixture as WatchlistFixtureEntry),
              savedAtUtc: (fixture as WatchlistFixtureEntry).savedAtUtc || new Date().toISOString(),
            };

    setEntries((current) =>
      current.some((entry) => entry.apiFixtureId === nextEntry.apiFixtureId)
        ? current.filter((entry) => entry.apiFixtureId !== nextEntry.apiFixtureId)
        : [nextEntry, ...current.filter((entry) => entry.apiFixtureId !== nextEntry.apiFixtureId)].slice(0, 100),
    );
  }, []);

  const removeFixture = useCallback((fixtureId: number) => {
    setEntries((current) => current.filter((entry) => entry.apiFixtureId !== fixtureId));
  }, []);

  const upsertFixtures = useCallback((fixtures: FixtureDto[]) => {
    if (fixtures.length === 0) {
      return;
    }

    setEntries((current) => {
      if (current.length === 0) {
        return current;
      }

      let changed = false;
      const next = current.map((entry) => {
        const fixture = fixtures.find((item) => item.apiFixtureId === entry.apiFixtureId);

        if (!fixture) {
          return entry;
        }

        const updatedEntry = {
          ...fixtureToWatchlistEntry(fixture),
          savedAtUtc: entry.savedAtUtc,
        };

        if (!areWatchlistEntriesEqual(entry, updatedEntry)) {
          changed = true;
          return updatedEntry;
        }

        return entry;
      });

      return changed ? next : current;
    });
  }, []);

  return {
    entries,
    fixtureIds,
    fixtureIdSet,
    isSaved: (fixtureId: number) => fixtureIdSet.has(fixtureId),
    toggleFixture,
    removeFixture,
    upsertFixtures,
  };
}
