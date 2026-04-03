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
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCountryName(value: string): string {
  return value.trim().toLowerCase();
}

function buildMatchesHref(
  currentParams: SearchParamsLike,
  leagueId: number | null,
  season: number,
  preserveCurrentFilters: boolean,
) {
  const next = new URLSearchParams();

  if (preserveCurrentFilters) {
    const date = currentParams.get('date');
    const state = currentParams.get('state');

    if (date) {
      next.set('date', date);
    }

    if (state) {
      next.set('state', state);
    }
  }

  if (leagueId) {
    next.set('leagueId', String(leagueId));
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  const query = next.toString();
  return query ? `/football?${query}` : '/football';
}

function buildStandingsHref(leagueId: number | null, season: number) {
  const next = new URLSearchParams();

  if (leagueId) {
    next.set('leagueId', String(leagueId));
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  const query = next.toString();
  return query ? `/football/standings?${query}` : '/football/standings';
}

function buildUpcomingLeagueHref(leagueId: number, season: number) {
  const next = new URLSearchParams();
  next.set('state', 'Upcoming');
  next.set('leagueId', String(leagueId));
  next.set('upcomingScope', 'all');

  if (season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  return `/football?${next.toString()}`;
}

function buildCountryGroups(leagues: LeagueDto[] | undefined, countries: CountryDto[] | undefined): CountryGroup[] {
  if (!leagues?.length) {
    return [];
  }

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

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.name.localeCompare(b.name);
  });
}

export function FootballSidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const countryGroups = allCountryGroups;

  const pinnedLeagues = useMemo(() => {
    if (!leagues?.length || !pinnedLeagueIds.length) {
      return [];
    }

    return sortPinnedLeagues(
      leagues.filter((league) => pinnedLeagueIds.includes(league.apiLeagueId)),
      pinnedLeagueIds,
    );
  }, [leagues, pinnedLeagueIds]);

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
      }),
    [leagues, season, worldCupLeagues],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(PINNED_LEAGUES_STORAGE_KEY);
      if (!rawValue) {
        return;
      }

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
  const clearLeagueHref = isStandingsPage
    ? buildStandingsHref(null, DEFAULT_SEASON)
    : buildMatchesHref(searchParams, null, DEFAULT_SEASON, isMatchesPage);

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
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-2 py-2 mt-1 flex-shrink-0" style={{ borderTop: '1px solid var(--t-border)' }}>
        {[
          { label: 'Matches', href: matchesHref, active: pathname === '/football' },
          { label: 'Standings', href: standingsHref, active: pathname.startsWith('/football/standings') },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center px-2 py-2 rounded text-[12px] transition-colors"
            style={{
              color: item.active ? 'var(--t-text-1)' : 'var(--t-text-4)',
              background: item.active ? 'rgba(255,255,255,0.06)' : 'transparent',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="px-2 py-2 flex-shrink-0" style={{ borderTop: '1px solid var(--t-border)' }}>
        <Link
          href={clearLeagueHref}
          className="flex items-center justify-between rounded px-2 py-2 text-[12px] transition-colors"
          style={{
            color: activeLeagueId ? 'var(--t-text-2)' : 'var(--t-text-1)',
            background: activeLeagueId ? 'transparent' : 'rgba(255,255,255,0.06)',
            borderLeft: activeLeagueId ? '2px solid transparent' : '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <span>All leagues</span>
          <span style={{ color: 'var(--t-text-5)' }}>{allLeaguesCount}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="px-1 pt-1">
          <div
            className="overflow-hidden rounded"
            style={{
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setPopularExpanded((current) => !current)}
              className="flex w-full items-center justify-between px-2.5 py-2.5 text-left"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderBottom: popularExpanded ? '1px solid var(--t-border)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{
                    background: 'var(--t-text-5)',
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
                &gt;
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
                      className="mt-1 flex items-center rounded px-2 py-1.5 text-[12px] transition-colors"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                        borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                        color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)',
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
                  className="mt-1 flex items-center gap-1 rounded pr-1"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.07)' : 'var(--t-surface)',
                    borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                  }}
                >
                  <Link
                    href={getLeagueHref(league)}
                    className="min-w-0 flex-1 px-2 py-1.5 text-[12px]"
                    style={{ color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)' }}
                  >
                    <span className="block truncate">{league.name}</span>
                    <span className="block truncate text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                      {league.countryName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => togglePinnedLeague(league.apiLeagueId)}
                    className="rounded px-1.5 py-1 text-[10px]"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--t-border)',
                      color: 'var(--t-text-3)',
                      cursor: 'pointer',
                    }}
                    aria-label={`Unpin ${league.name}`}
                  >
                    ★
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
            No leagues found.
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
                className="flex w-full items-center gap-2 px-2 py-2 text-left"
                style={{
                  background: hasActiveLeague ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: isExpanded ? '1px solid var(--t-border)' : '1px solid transparent',
                  cursor: 'pointer',
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
                  <span className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>o</span>
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
                  &gt;
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
                        className="ml-2 mr-1 mt-1 flex items-center gap-1 rounded pr-1"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                          borderLeft: isActive ? '2px solid rgba(255,255,255,0.2)' : '2px solid transparent',
                        }}
                      >
                        <Link
                          href={getLeagueHref(league)}
                          className="min-w-0 flex-1 px-2 py-1.5 text-[12px] transition-colors"
                          style={{ color: isActive ? 'var(--t-text-1)' : 'var(--t-text-4)' }}
                        >
                          <span className="block truncate">{league.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePinnedLeague(league.apiLeagueId)}
                          className="rounded px-1.5 py-1 text-[10px]"
                          style={{
                            background: isPinned ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: '1px solid var(--t-border)',
                            color: isPinned ? 'var(--t-text-2)' : 'var(--t-text-5)',
                            cursor: 'pointer',
                          }}
                          aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${league.name}`}
                        >
                          ★
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
