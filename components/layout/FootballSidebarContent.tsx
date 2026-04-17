'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCountries } from '@/lib/hooks/useCountries';
import { useLeagues } from '@/lib/hooks/useLeagues';
import {
  USER_POPULAR_LEAGUES_STORAGE_KEY,
  USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY,
  getPopularLeagueKey,
  mergePopularLeaguePresets,
  readPopularLeagueKeys,
  readPopularLeaguePresets,
  type PopularLeaguePreset,
  writePopularLeagueKeys,
  writePopularLeaguePresets,
} from '@/lib/popular-leagues';
import type { CountryDto, LeagueDto } from '@/lib/types/api';
import { usePopularLeaguesContent } from '@/lib/hooks/useContentDocuments';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

interface CountryGroup {
  countryName: string;
  country: CountryDto | null;
  leagues: LeagueDto[];
}

interface SearchParamsLike {
  get(name: string): string | null;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCountryName(value: string): string {
  return value.trim().toLowerCase();
}

function buildMatchesHref(currentParams: SearchParamsLike, leagueId: number | null, season: number, preserveCurrentFilters: boolean) {
  const next = new URLSearchParams();

  if (preserveCurrentFilters) {
    const date = currentParams.get('date');
    const state = currentParams.get('state');

    if (date) next.set('date', date);
    if (state) next.set('state', state);
  }

  if (leagueId) next.set('leagueId', String(leagueId));
  if (leagueId || season !== DEFAULT_SEASON) next.set('season', String(season));

  const query = next.toString();
  return query ? `/football?${query}` : '/football';
}

function buildStandingsHref(leagueId: number | null, season: number) {
  const next = new URLSearchParams();
  if (leagueId) next.set('leagueId', String(leagueId));
  if (leagueId || season !== DEFAULT_SEASON) next.set('season', String(season));
  const query = next.toString();
  return query ? `/football/standings?${query}` : '/football/standings';
}

function buildUpcomingLeagueHref(leagueId: number, season: number) {
  const next = new URLSearchParams();
  next.set('state', 'Upcoming');
  next.set('leagueId', String(leagueId));
  next.set('upcomingScope', 'all');
  next.set('season', String(season));

  return `/football?${next.toString()}`;
}

function buildCountryGroups(leagues: LeagueDto[] | undefined, countries: CountryDto[] | undefined): CountryGroup[] {
  if (!leagues?.length) return [];

  const countriesByName = new Map<string, CountryDto>();
  countries?.forEach((country) => {
    countriesByName.set(normalizeCountryName(country.name), country);
  });

  const grouped = new Map<string, CountryGroup>();

  leagues.forEach((league) => {
    const key = normalizeCountryName(league.countryName);
    const existing = grouped.get(key);

    if (existing) {
      existing.leagues.push(league);
      return;
    }

    grouped.set(key, {
      countryName: league.countryName,
      country: countriesByName.get(key) ?? null,
      leagues: [league],
    });
  });

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      leagues: [...group.leagues].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));
}

export function FootballSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [popularStorageHydrated, setPopularStorageHydrated] = useState(false);
  const [userPopularLeaguePresets, setUserPopularLeaguePresets] = useState<PopularLeaguePreset[]>([]);
  const [hiddenPopularLeagueKeys, setHiddenPopularLeagueKeys] = useState<string[]>([]);
  const popularLeaguesQuery = usePopularLeaguesContent();
  const adminPopularLeaguePresets = popularLeaguesQuery.data ?? [];

  const isMatchesPage = pathname === '/football';
  const isStandingsPage = pathname.startsWith('/football/standings');
  const activeLeagueId = parsePositiveInt(searchParams.get('leagueId'));
  const requestedSeason = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const season = activeLeagueId ? requestedSeason : DEFAULT_SEASON;

  const { data: leagues, isLoading: leaguesLoading, isError: leaguesError } = useLeagues(season);
  const { data: worldCupLeagues } = useLeagues(2026);
  const { data: countries } = useCountries();

  const allCountryGroups = useMemo(() => buildCountryGroups(leagues, countries), [countries, leagues]);
  const allLeaguesCount = useMemo(
    () => allCountryGroups.reduce((total, group) => total + group.leagues.length, 0),
    [allCountryGroups],
  );

  const countryGroups = useMemo(() => allCountryGroups, [allCountryGroups]);

  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    return allCountryGroups
      .flatMap((group) =>
        group.leagues
          .filter(
            (league) =>
              league.name.toLowerCase().includes(normalizedSearch) ||
              group.countryName.toLowerCase().includes(normalizedSearch),
          )
          .map((league) => ({ league, group })),
      )
      .slice(0, 20);
  }, [allCountryGroups, normalizedSearch]);

  const mergedPopularLeaguePresets = useMemo(
    () => mergePopularLeaguePresets(adminPopularLeaguePresets, userPopularLeaguePresets, hiddenPopularLeagueKeys),
    [adminPopularLeaguePresets, hiddenPopularLeagueKeys, userPopularLeaguePresets],
  );

  const adminPopularLeagueKeys = useMemo(
    () => new Set(adminPopularLeaguePresets.map((item) => getPopularLeagueKey(item.leagueId, item.season))),
    [adminPopularLeaguePresets],
  );

  const userPopularLeagueKeys = useMemo(
    () => new Set(userPopularLeaguePresets.map((item) => getPopularLeagueKey(item.leagueId, item.season))),
    [userPopularLeaguePresets],
  );

  const hiddenPopularLeagueKeySet = useMemo(
    () => new Set(hiddenPopularLeagueKeys),
    [hiddenPopularLeagueKeys],
  );

  const popularLeagues = useMemo(
    () =>
      mergedPopularLeaguePresets.map((item) => {
        const sourceLeagues = item.season === 2026 ? worldCupLeagues ?? [] : leagues ?? [];
        const league = sourceLeagues.find((entry) => entry.apiLeagueId === item.leagueId) ?? null;

        return {
          ...item,
          league,
          targetSeason: item.season ?? season,
        };
      }),
    [leagues, mergedPopularLeaguePresets, season, worldCupLeagues],
  );

  useEffect(() => {
    setUserPopularLeaguePresets(readPopularLeaguePresets(USER_POPULAR_LEAGUES_STORAGE_KEY, []));
    setHiddenPopularLeagueKeys(readPopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, []));
    setPopularStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!popularStorageHydrated) {
      return;
    }

    writePopularLeaguePresets(USER_POPULAR_LEAGUES_STORAGE_KEY, userPopularLeaguePresets);
  }, [popularStorageHydrated, userPopularLeaguePresets]);

  useEffect(() => {
    if (!popularStorageHydrated) {
      return;
    }

    writePopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, hiddenPopularLeagueKeys);
  }, [hiddenPopularLeagueKeys, popularStorageHydrated]);

  useEffect(() => {
    if (!allCountryGroups.length) {
      return;
    }

    setExpandedCountries((current) => {
      const next = { ...current };

      allCountryGroups.forEach((group) => {
        const hasActiveLeague = group.leagues.some((league) => league.apiLeagueId === activeLeagueId);

        if (typeof next[group.countryName] === 'undefined') {
          next[group.countryName] = hasActiveLeague;
        } else if (hasActiveLeague) {
          next[group.countryName] = true;
        }
      });

      return next;
    });
  }, [activeLeagueId, allCountryGroups]);

  const matchesHref = buildMatchesHref(searchParams, activeLeagueId, season, isMatchesPage);
  const standingsHref = buildStandingsHref(activeLeagueId, season);
  const clearLeagueHref = buildMatchesHref(searchParams, null, DEFAULT_SEASON, isMatchesPage);
  const isAllLeaguesActive = isMatchesPage && !activeLeagueId;

  const togglePopularLeague = (league: Pick<LeagueDto, 'apiLeagueId' | 'name' | 'season'>) => {
    const candidate: PopularLeaguePreset = {
      leagueId: league.apiLeagueId,
      displayName: league.name,
      season: league.season,
    };
    const candidateKey = getPopularLeagueKey(candidate.leagueId, candidate.season);
    const isAdminPopular = adminPopularLeagueKeys.has(candidateKey);
    const isUserPopular = userPopularLeagueKeys.has(candidateKey);
    const isHidden = hiddenPopularLeagueKeySet.has(candidateKey);
    const isVisible = (isAdminPopular && !isHidden) || isUserPopular;

    if (isVisible) {
      if (isAdminPopular) {
        setHiddenPopularLeagueKeys((current) =>
          current.includes(candidateKey) ? current : [...current, candidateKey],
        );
        setUserPopularLeaguePresets((current) =>
          current.filter((item) => getPopularLeagueKey(item.leagueId, item.season) !== candidateKey),
        );
        return;
      }

      if (isUserPopular) {
        setUserPopularLeaguePresets((current) =>
          current.filter((item) => getPopularLeagueKey(item.leagueId, item.season) !== candidateKey),
        );
        return;
      }
    }

    if (isAdminPopular && isHidden) {
      setHiddenPopularLeagueKeys((current) => current.filter((key) => key !== candidateKey));
      return;
    }

    setUserPopularLeaguePresets((current) =>
      current.some((item) => getPopularLeagueKey(item.leagueId, item.season) === candidateKey)
        ? current.filter((item) => getPopularLeagueKey(item.leagueId, item.season) !== candidateKey)
        : [candidate, ...current.filter((item) => getPopularLeagueKey(item.leagueId, item.season) !== candidateKey)].slice(0, 12),
    );
    setHiddenPopularLeagueKeys((current) => current.filter((key) => key !== candidateKey));
  };

  const getLeagueHref = (league: LeagueDto) =>
    isStandingsPage
      ? buildStandingsHref(league.apiLeagueId, league.season)
      : buildUpcomingLeagueHref(league.apiLeagueId, league.season);

  const pinnedSection = (
    <div style={{ flexShrink: 0, padding: '8px 4px 4px', borderBottom: '1px solid var(--t-border)' }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--t-text-5)',
          padding: '0 8px 4px',
        }}
      >
        Pinned
      </div>
      {!popularStorageHydrated ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 4px 2px' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 26,
                borderRadius: 6,
                background: 'var(--t-surface-3)',
                animation: 'skeleton-pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      ) : popularLeagues.length ? (
        popularLeagues.map((item) => {
          const href = isStandingsPage
            ? buildStandingsHref(item.leagueId, item.targetSeason)
            : buildUpcomingLeagueHref(item.leagueId, item.targetSeason);
          const isActive = item.leagueId === activeLeagueId && item.targetSeason === season;

          return (
            <div
              key={`pinned-${item.leagueId}-${item.targetSeason}`}
              className="sidebar-hover-panel mx-1 mt-0.5 flex items-center gap-1 rounded pr-1"
              style={{
                background: isActive ? 'rgba(0,230,118,0.07)' : 'transparent',
                borderLeft: isActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
              }}
            >
              <Link
                href={href}
                onNavigate={onNavigate}
                className="sidebar-hover-item min-w-0 flex-1 rounded px-2 py-1.5 text-[12px] transition-colors"
                data-active={isActive ? 'true' : 'false'}
                style={{
                  color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)',
                  textDecoration: 'none',
                  ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
                  ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
                }}
              >
                <span className="block truncate">{item.displayName}</span>
              </Link>
              {item.league ? (
                <button
                  type="button"
                  onClick={() => { if (item.league) togglePopularLeague(item.league); }}
                  className="chrome-btn rounded px-1.5 py-1 text-[10px]"
                  style={{ color: 'var(--t-text-3)', cursor: 'pointer' }}
                  aria-label={`Remove ${item.displayName} from pinned leagues`}
                >
                  −
                </button>
              ) : null}
            </div>
          );
        })
      ) : (
        <div style={{ padding: '4px 8px 4px', fontSize: 11, color: 'var(--t-text-5)' }}>
          No pinned leagues. Use + to pin any league below.
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Zone 2: Matches / Standings view toggle */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 2,
          padding: '4px 8px 6px',
          borderBottom: '1px solid var(--t-border)',
        }}
      >
        {[
          { label: 'Matches', href: matchesHref, active: !isStandingsPage },
          { label: 'Standings', href: standingsHref, active: isStandingsPage },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onNavigate={onNavigate}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px 8px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: item.active ? 700 : 500,
              textDecoration: 'none',
              background: item.active ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: item.active ? 'var(--t-text-1)' : 'var(--t-text-4)',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Zone 3: Pinned leagues */}
      {pinnedSection}

      <div className="flex-shrink-0 px-2 py-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <Link
          href={clearLeagueHref}
          onNavigate={onNavigate}
          className="sidebar-hover-item flex items-center justify-between rounded px-2 py-2 text-[12px] transition-colors"
          data-active={isAllLeaguesActive ? 'true' : 'false'}
          style={{
            color: isAllLeaguesActive ? 'var(--t-text-1)' : 'var(--t-text-2)',
            background: isAllLeaguesActive ? 'rgba(0,230,118,0.06)' : 'transparent',
            borderLeft: isAllLeaguesActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
            textDecoration: 'none',
            ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
            ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
          }}
        >
          <span>All leagues</span>
          <span style={{ color: 'var(--t-text-5)' }}>{allLeaguesCount}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="px-2 pt-2">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leagues..."
              className="input-shell w-full px-2.5 py-2 text-[12px]"
              style={{ paddingRight: search ? '2rem' : undefined }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] leading-none"
                style={{ color: 'var(--t-text-4)', cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px' }}
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {leaguesLoading ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            Loading leagues...
          </div>
        ) : leaguesError ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: '#fca5a5' }}>
            Failed to load leagues.
          </div>
        ) : null}

        {/* ── Flat search results ── */}
        {normalizedSearch ? (
          <div className="mt-1">
            {searchResults.length === 0 ? (
              <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
                No leagues match.
              </div>
            ) : (
              <>
                <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--t-text-5)' }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map(({ league, group }) => {
                  const isActive = league.apiLeagueId === activeLeagueId;
                  const leaguePopularKey = getPopularLeagueKey(league.apiLeagueId, league.season);
                  const isAdminPopular = adminPopularLeagueKeys.has(leaguePopularKey);
                  const isUserPopular = userPopularLeagueKeys.has(leaguePopularKey);
                  const isHiddenPopular = hiddenPopularLeagueKeySet.has(leaguePopularKey);
                  const isVisiblePopular = (isAdminPopular && !isHiddenPopular) || isUserPopular;

                  return (
                    <div
                      key={`${league.apiLeagueId}-${league.season}`}
                      className="sidebar-hover-panel mx-1 mt-0.5 flex items-center gap-1.5 rounded pr-1"
                      style={{
                        background: isActive ? 'rgba(0,230,118,0.07)' : 'transparent',
                        borderLeft: isActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
                      }}
                    >
                      {group.country?.flagUrl ? (
                        <img
                          src={group.country.flagUrl}
                          alt={group.countryName}
                          width={14}
                          height={10}
                          style={{ width: 14, height: 10, objectFit: 'cover', borderRadius: 1, flexShrink: 0, marginLeft: 6 }}
                        />
                      ) : (
                        <span className="ml-1.5 w-[14px] flex-shrink-0 text-center text-[9px]" style={{ color: 'var(--t-text-6)' }}>○</span>
                      )}
                      <Link
                        href={getLeagueHref(league)}
                        onNavigate={() => { setSearch(''); onNavigate?.(); }}
                        className="sidebar-hover-item min-w-0 flex-1 rounded px-1.5 py-1.5 transition-colors"
                        data-active={isActive ? 'true' : 'false'}
                        style={{
                          textDecoration: 'none',
                          ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.05)',
                          ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
                        }}
                      >
                        <div className="truncate text-[12px] font-medium" style={{ color: isActive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}>
                          {league.name}
                        </div>
                        <div className="truncate text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                          {group.countryName}
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePopularLeague(league)}
                        className={`flex-shrink-0 rounded px-1.5 py-1 text-[10px] ${isVisiblePopular ? 'chrome-btn chrome-btn-active' : 'chrome-btn'}`}
                        style={{ color: isVisiblePopular ? 'var(--t-text-1)' : 'var(--t-text-5)', cursor: 'pointer' }}
                        aria-label={`${isVisiblePopular ? 'Remove' : 'Add'} ${league.name} ${isVisiblePopular ? 'from' : 'to'} popular leagues`}
                      >
                        {isVisiblePopular ? '−' : '+'}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : (

        /* ── Country groups tree (normal mode) ── */
        <>
        {countryGroups.length === 0 && !leaguesLoading && !leaguesError ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            No leagues available.
          </div>
        ) : null}
        {countryGroups.map((group) => {
          const hasActiveLeague = group.leagues.some((league) => league.apiLeagueId === activeLeagueId);
          const isExpanded = expandedCountries[group.countryName] ?? false;

          return (
            <div key={group.countryName} className="mt-1 overflow-hidden rounded" style={{ background: 'var(--t-surface)' }}>
              <button
                type="button"
                onClick={() =>
                  setExpandedCountries((current) => ({
                    ...current,
                    [group.countryName]: !isExpanded,
                  }))
                }
                className="sidebar-hover-item flex w-full items-center gap-2 px-2 py-2 text-left"
                data-active={hasActiveLeague ? 'true' : 'false'}
                style={{
                  background: hasActiveLeague ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: isExpanded ? '1px solid var(--t-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
                  ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.08)',
                }}
              >
                {group.country?.flagUrl ? (
                  <img
                    src={group.country.flagUrl}
                    alt={group.countryName}
                    width={16}
                    height={12}
                    style={{ width: 16, height: 12, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                  />
                ) : (
                  <span className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                    O
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium" style={{ color: 'var(--t-text-2)' }}>
                  {group.countryName}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                  {group.leagues.length}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color: 'var(--t-text-5)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {'>'}
                </span>
              </button>

              {isExpanded ? (
                <div className="pb-1">
                  {group.leagues.map((league) => {
                    const isActive = league.apiLeagueId === activeLeagueId;
                    const leaguePopularKey = getPopularLeagueKey(league.apiLeagueId, league.season);
                    const isAdminPopular = adminPopularLeagueKeys.has(leaguePopularKey);
                    const isUserPopular = userPopularLeagueKeys.has(leaguePopularKey);
                    const isHiddenPopular = hiddenPopularLeagueKeySet.has(leaguePopularKey);
                    const isVisiblePopular = (isAdminPopular && !isHiddenPopular) || isUserPopular;

                    return (
                      <div
                        key={`${league.apiLeagueId}-${league.season}`}
                        className="sidebar-hover-panel ml-2 mr-1 mt-1 flex items-center gap-1 rounded pr-1"
                        style={{
                          background: isActive ? 'rgba(0,230,118,0.07)' : 'transparent',
                          borderLeft: isActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
                        }}
                      >
                        <Link
                          href={getLeagueHref(league)}
                          onNavigate={onNavigate}
                          className="sidebar-hover-item min-w-0 flex-1 rounded px-2 py-1.5 text-[12px] transition-colors"
                          data-active={isActive ? 'true' : 'false'}
                          style={{
                            color: isActive ? 'var(--t-text-1)' : 'var(--t-text-4)',
                            textDecoration: 'none',
                            ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.05)',
                            ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
                          }}
                        >
                          <span className="block truncate">{league.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePopularLeague(league)}
                          className={`rounded px-1.5 py-1 text-[10px] ${isVisiblePopular ? 'chrome-btn chrome-btn-active' : 'chrome-btn'}`}
                          style={{
                            color: isVisiblePopular ? 'var(--t-text-1)' : 'var(--t-text-5)',
                            cursor: 'pointer',
                          }}
                          aria-label={`${isVisiblePopular ? 'Remove' : 'Add'} ${league.name} ${isVisiblePopular ? 'from' : 'to'} popular leagues`}
                        >
                          {isVisiblePopular ? '-' : '+'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        </>
        )}
      </div>
    </div>
  );
}
