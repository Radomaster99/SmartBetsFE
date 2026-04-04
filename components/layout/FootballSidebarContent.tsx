'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCountries } from '@/lib/hooks/useCountries';
import { useLeagues } from '@/lib/hooks/useLeagues';
import type { CountryDto, LeagueDto } from '@/lib/types/api';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
const PINNED_LEAGUES_STORAGE_KEY = 'smartbets:pinned-leagues';
const POPULAR_LEAGUES = [
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

function sortPinnedLeagues(leagues: LeagueDto[], pinnedLeagueIds: number[]) {
  const rank = new Map<number, number>();
  pinnedLeagueIds.forEach((leagueId, index) => rank.set(leagueId, index));

  return [...leagues].sort((a, b) => {
    const rankA = rank.get(a.apiLeagueId) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.apiLeagueId) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });
}

export function FootballSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const [popularExpanded, setPopularExpanded] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [pinnedLeagueIds, setPinnedLeagueIds] = useState<number[]>([]);

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

  const countryGroups = useMemo(() => {
    if (!normalizedSearch) return allCountryGroups;

    return allCountryGroups
      .map((group) => ({
        ...group,
        leagues: group.leagues.filter(
          (league) =>
            league.name.toLowerCase().includes(normalizedSearch) ||
            group.countryName.toLowerCase().includes(normalizedSearch),
        ),
      }))
      .filter((group) => group.leagues.length > 0 || group.countryName.toLowerCase().includes(normalizedSearch));
  }, [allCountryGroups, normalizedSearch]);

  const pinnedLeagues = useMemo(() => {
    if (!leagues?.length || !pinnedLeagueIds.length) {
      return [];
    }

    const sorted = sortPinnedLeagues(
      leagues.filter((league) => pinnedLeagueIds.includes(league.apiLeagueId)),
      pinnedLeagueIds,
    );

    if (!normalizedSearch) return sorted;

    return sorted.filter(
      (league) =>
        league.name.toLowerCase().includes(normalizedSearch) ||
        league.countryName.toLowerCase().includes(normalizedSearch),
    );
  }, [leagues, normalizedSearch, pinnedLeagueIds]);

  const popularLeagues = useMemo(
    () =>
      POPULAR_LEAGUES.map((item) => {
        const sourceLeagues = item.season === 2026 ? worldCupLeagues ?? [] : leagues ?? [];
        const league = sourceLeagues.find((entry) => entry.apiLeagueId === item.leagueId) ?? null;

        return {
          ...item,
          league,
          targetSeason: item.season ?? season,
        };
      }).filter((item) => !normalizedSearch || item.displayName.toLowerCase().includes(normalizedSearch)),
    [leagues, normalizedSearch, season, worldCupLeagues],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(PINNED_LEAGUES_STORAGE_KEY);
      if (!rawValue) return;

      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        setPinnedLeagueIds(parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value)));
      }
    } catch {
      window.localStorage.removeItem(PINNED_LEAGUES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PINNED_LEAGUES_STORAGE_KEY, JSON.stringify(pinnedLeagueIds));
  }, [pinnedLeagueIds]);

  useEffect(() => {
    if (!allCountryGroups.length) {
      return;
    }

    setExpandedCountries((current) => {
      const next = { ...current };

      allCountryGroups.forEach((group) => {
        const hasActiveLeague = group.leagues.some((league) => league.apiLeagueId === activeLeagueId);

        if (typeof next[group.countryName] === 'undefined') {
          next[group.countryName] = hasActiveLeague || Boolean(normalizedSearch);
        } else if (hasActiveLeague || normalizedSearch) {
          next[group.countryName] = true;
        }
      });

      return next;
    });
  }, [activeLeagueId, allCountryGroups, normalizedSearch]);

  const matchesHref = buildMatchesHref(searchParams, activeLeagueId, season, isMatchesPage);
  const standingsHref = buildStandingsHref(activeLeagueId, season);
  const clearLeagueHref = buildMatchesHref(searchParams, null, DEFAULT_SEASON, isMatchesPage);
  const isAllLeaguesActive = isMatchesPage && !activeLeagueId;

  const togglePinnedLeague = (leagueId: number) => {
    setPinnedLeagueIds((current) =>
      current.includes(leagueId)
        ? current.filter((value) => value !== leagueId)
        : [leagueId, ...current.filter((value) => value !== leagueId)].slice(0, 8),
    );
  };

  const getLeagueHref = (league: LeagueDto) =>
    isStandingsPage
      ? buildStandingsHref(league.apiLeagueId, league.season)
      : buildUpcomingLeagueHref(league.apiLeagueId, league.season);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mt-1 flex-shrink-0 px-2 py-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        {[
          { label: 'Matches', href: matchesHref, active: pathname === '/football' },
          { label: 'Standings', href: standingsHref, active: pathname.startsWith('/football/standings') },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onNavigate={onNavigate}
            className="sidebar-hover-item flex items-center rounded px-2 py-2 text-[12px] transition-colors"
            data-active={item.active ? 'true' : 'false'}
            style={{
              color: item.active ? 'var(--t-text-1)' : 'var(--t-text-4)',
              background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
              textDecoration: 'none',
              marginTop: item.label === 'Standings' ? '4px' : undefined,
              ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
              ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex-shrink-0 px-2 py-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <Link
          href={clearLeagueHref}
          onNavigate={onNavigate}
          className="sidebar-hover-item flex items-center justify-between rounded px-2 py-2 text-[12px] transition-colors"
          data-active={isAllLeaguesActive ? 'true' : 'false'}
          style={{
            color: isAllLeaguesActive ? 'var(--t-text-1)' : 'var(--t-text-2)',
            background: isAllLeaguesActive ? 'rgba(255,255,255,0.06)' : 'transparent',
            borderLeft: isAllLeaguesActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
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
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter leagues..."
            className="input-shell w-full px-2.5 py-2 text-[12px]"
          />
        </div>

        <div className="px-1 pt-1">
          <div
            className="panel-shell overflow-hidden rounded-lg"
            style={{
            }}
          >
            <button
              type="button"
              onClick={() => setPopularExpanded((current) => !current)}
              className="sidebar-hover-item flex w-full items-center justify-between px-2.5 py-2.5 text-left"
              data-active={popularExpanded ? 'true' : 'false'}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderBottom: popularExpanded ? '1px solid var(--t-border)' : '1px solid transparent',
                cursor: 'pointer',
                ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
                ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.08)',
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{
                    background: 'var(--t-accent)',
                    boxShadow: '0 0 10px rgba(0, 230, 118, 0.55)',
                    transform: 'rotate(45deg)',
                  }}
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-2)' }}>
                  Popular
                </span>
              </span>
              <span
                className="text-[10px]"
                style={{
                  color: 'var(--t-text-4)',
                  transform: popularExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {'>'}
              </span>
            </button>

            {popularExpanded ? (
              <div className="px-1 pb-1">
                {popularLeagues.map((item) => {
                  const href = isStandingsPage
                    ? buildStandingsHref(item.leagueId, item.targetSeason)
                    : buildUpcomingLeagueHref(item.leagueId, item.targetSeason);
                  const isActive = item.leagueId === activeLeagueId && item.targetSeason === season;

                  return (
                    <Link
                      key={`popular-${item.leagueId}-${item.targetSeason}`}
                      href={href}
                      onNavigate={onNavigate}
                      className="sidebar-hover-item mt-1 flex items-center rounded px-2 py-1.5 text-[12px] transition-colors"
                      data-active={isActive ? 'true' : 'false'}
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                        borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                        color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)',
                        textDecoration: 'none',
                        ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
                        ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <span className="truncate">{item.displayName}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {pinnedLeagues.length ? (
          <div className="px-1 pt-1">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>
              Pinned
            </div>
            {pinnedLeagues.map((league) => {
              const isActive = league.apiLeagueId === activeLeagueId;

              return (
                <div
                  key={`pinned-${league.apiLeagueId}-${league.season}`}
                  className="sidebar-hover-panel mt-1 flex items-center gap-1 rounded pr-1"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.07)' : 'var(--t-surface)',
                    borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                  }}
                >
                  <Link
                    href={getLeagueHref(league)}
                    onNavigate={onNavigate}
                    className="sidebar-hover-item min-w-0 flex-1 rounded px-2 py-1.5 text-[12px]"
                    data-active={isActive ? 'true' : 'false'}
                    style={{
                      color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)',
                      textDecoration: 'none',
                      ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.05)',
                      ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <span className="block truncate">{league.name}</span>
                    <span className="block truncate text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                      {league.countryName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => togglePinnedLeague(league.apiLeagueId)}
                    className="chrome-btn rounded px-1.5 py-1 text-[10px]"
                    style={{
                      color: 'var(--t-text-3)',
                      cursor: 'pointer',
                    }}
                    aria-label={`Unpin ${league.name}`}
                  >
                    -
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {leaguesLoading ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            Loading leagues...
          </div>
        ) : leaguesError ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: '#fca5a5' }}>
            Failed to load leagues.
          </div>
        ) : countryGroups.length === 0 ? (
          <div className="px-3 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            No leagues match this filter.
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
                    const isPinned = pinnedLeagueIds.includes(league.apiLeagueId);

                    return (
                      <div
                        key={`${league.apiLeagueId}-${league.season}`}
                        className="sidebar-hover-panel ml-2 mr-1 mt-1 flex items-center gap-1 rounded pr-1"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                          borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
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
                          onClick={() => togglePinnedLeague(league.apiLeagueId)}
                          className={`rounded px-1.5 py-1 text-[10px] ${isPinned ? 'chrome-btn chrome-btn-active' : 'chrome-btn'}`}
                          style={{
                            color: isPinned ? 'var(--t-text-1)' : 'var(--t-text-5)',
                            cursor: 'pointer',
                          }}
                          aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${league.name}`}
                        >
                          {isPinned ? '-' : '+'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
