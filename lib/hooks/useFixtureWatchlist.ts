'use client';

import { useEffect, useMemo, useState } from 'react';

const WATCHLIST_STORAGE_KEY = 'smartbets:watchlist-fixtures';

export function useFixtureWatchlist() {
  const [fixtureIds, setFixtureIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFixtureIds(parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value)));
      }
    } catch {
      window.localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(fixtureIds));
  }, [fixtureIds]);

  const fixtureIdSet = useMemo(() => new Set(fixtureIds), [fixtureIds]);

  const toggleFixture = (fixtureId: number) => {
    setFixtureIds((current) =>
      current.includes(fixtureId)
        ? current.filter((value) => value !== fixtureId)
        : [fixtureId, ...current.filter((value) => value !== fixtureId)].slice(0, 100),
    );
  };

  return {
    fixtureIds,
    fixtureIdSet,
    isSaved: (fixtureId: number) => fixtureIdSet.has(fixtureId),
    toggleFixture,
  };
}
