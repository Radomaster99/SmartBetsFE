'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { useCountries } from '@/lib/hooks/useCountries';
import { useStandings } from '@/lib/hooks/useStandings';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  getPopularLeagueKey,
  USER_POPULAR_LEAGUES_STORAGE_KEY,
  USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY,
  mergePopularLeaguePresets,
  readPopularLeaguePresets,
  readPopularLeagueKeys,
  type PopularLeaguePreset,
} from '@/lib/popular-leagues';
import type { LeagueDto, CountryDto } from '@/lib/types/api';
import { usePopularLeaguesContent } from '@/lib/hooks/useContentDocuments';
import { buildTeamHref } from '@/lib/team-links';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildStandingsHref(leagueId: number | null, season: number) {
  const params = new URLSearchParams();
  if (leagueId) params.set('leagueId', String(leagueId));
  if (leagueId || season !== DEFAULT_SEASON) params.set('season', String(season));
  const query = params.toString();
  return query ? `/football/standings?${query}` : '/football/standings';
}

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase();
}

function buildFlagMap(countries: CountryDto[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  countries?.forEach((c) => {
    if (c.flagUrl) {
      map.set(normalizeCountryName(c.name), c.flagUrl);
    }
  });
  return map;
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      color: accent ? 'var(--t-accent)' : 'var(--t-text-5)',
      opacity: accent ? 0.85 : 1,
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function LeagueCard({
  league, displayName, flagUrl, pinned, onClick,
}: {
  league: LeagueDto | null;
  displayName: string;
  flagUrl?: string;
  pinned?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        border: pinned
          ? `1px solid ${hovered ? 'rgba(0,230,118,0.5)' : 'rgba(0,230,118,0.22)'}`
          : `1px solid ${hovered ? 'rgba(0,230,118,0.3)' : 'var(--t-border)'}`,
        background: pinned
          ? hovered ? 'rgba(0,230,118,0.1)' : 'rgba(0,230,118,0.05)'
          : hovered ? 'rgba(0,230,118,0.05)' : 'var(--t-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      {flagUrl ? (
        <img
          src={flagUrl}
          alt={league?.countryName ?? ''}
          width={20}
          height={14}
          style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
        />
      ) : (
        <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>⚽</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: pinned ? 'var(--t-accent)' : hovered ? 'var(--t-accent)' : 'var(--t-text-2)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {displayName}
        </div>
        {league?.countryName ? (
          <div style={{ fontSize: 10, color: 'var(--t-text-5)', marginTop: 1 }}>{league.countryName}</div>
        ) : null}
      </div>
    </button>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 8,
      marginBottom: 24,
    }}>
      {children}
    </div>
  );
}

function LeaguePicker({
  leagues, worldCupLeagues, countries, season, onSelect,
}: {
  leagues: LeagueDto[] | undefined;
  worldCupLeagues: LeagueDto[] | undefined;
  countries: CountryDto[] | undefined;
  season: number;
  onSelect: (leagueId: number, season: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [userPresets, setUserPresets] = useState<PopularLeaguePreset[]>([]);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const popularLeaguesQuery = usePopularLeaguesContent();
  const adminPresets = popularLeaguesQuery.data ?? [];

  useEffect(() => {
    setUserPresets(readPopularLeaguePresets(USER_POPULAR_LEAGUES_STORAGE_KEY, []));
    setHiddenKeys(readPopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  const flagMap = useMemo(() => buildFlagMap(countries), [countries]);

  const allLeagues = useMemo(
    () => [...(leagues ?? []), ...(worldCupLeagues ?? [])],
    [leagues, worldCupLeagues],
  );

  const resolveLeague = (leagueId: number, targetSeason?: number): LeagueDto | null => {
    const src = targetSeason === 2026 ? (worldCupLeagues ?? []) : (leagues ?? []);
    return src.find((l) => l.apiLeagueId === leagueId) ?? null;
  };

  const mergedPresets = useMemo(
    () => mergePopularLeaguePresets(adminPresets, userPresets, hiddenKeys),
    [adminPresets, userPresets, hiddenKeys],
  );

  const userPinnedKeys = useMemo(
    () => new Set(userPresets.map((p) => getPopularLeagueKey(p.leagueId, p.season))),
    [userPresets],
  );

  const pinnedItems = useMemo(
    () => userPresets.map((p) => ({
      preset: p,
      league: resolveLeague(p.leagueId, p.season),
      targetSeason: p.season ?? season,
      key: getPopularLeagueKey(p.leagueId, p.season),
    })),
    [userPresets, leagues, worldCupLeagues, season],
  );

  const popularItems = useMemo(
    () => mergedPresets
      .filter((p) => !userPinnedKeys.has(getPopularLeagueKey(p.leagueId, p.season)))
      .map((p) => ({
        preset: p,
        league: resolveLeague(p.leagueId, p.season),
        targetSeason: p.season ?? season,
        key: getPopularLeagueKey(p.leagueId, p.season),
      })),
    [mergedPresets, userPinnedKeys, leagues, worldCupLeagues, season],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    return allLeagues
      .filter((l) =>
        l.name.toLowerCase().includes(normalizedSearch) ||
        l.countryName.toLowerCase().includes(normalizedSearch),
      )
      .slice(0, 24);
  }, [allLeagues, normalizedSearch]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--t-surface)',
        border: '1px solid var(--t-border)',
        borderRadius: 8,
        marginBottom: 24,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: 'var(--t-text-5)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leagues by name or country..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--t-text-2)' }}
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: 'var(--t-text-5)', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
          >
            ×
          </button>
        ) : null}
      </div>

      {normalizedSearch ? (
        <>
          <SectionLabel>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</SectionLabel>
          {searchResults.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--t-text-5)', padding: '12px 0' }}>No leagues match.</div>
          ) : (
            <CardGrid>
              {searchResults.map((league) => (
                <LeagueCard
                  key={`${league.apiLeagueId}-${league.season}`}
                  league={league}
                  displayName={league.name}
                  flagUrl={flagMap.get(normalizeCountryName(league.countryName))}
                  onClick={() => onSelect(league.apiLeagueId, league.season)}
                />
              ))}
            </CardGrid>
          )}
        </>
      ) : (
        <>
          {hydrated && pinnedItems.length > 0 ? (
            <>
              <SectionLabel accent>Your pinned leagues</SectionLabel>
              <CardGrid>
                {pinnedItems.map((item) => (
                  <LeagueCard
                    key={item.key}
                    league={item.league}
                    displayName={item.preset.displayName}
                    flagUrl={item.league ? flagMap.get(normalizeCountryName(item.league.countryName)) : undefined}
                    pinned
                    onClick={() => onSelect(item.preset.leagueId, item.targetSeason)}
                  />
                ))}
              </CardGrid>
            </>
          ) : null}

          {hydrated && popularItems.length > 0 ? (
            <>
              <SectionLabel>Popular leagues</SectionLabel>
              <CardGrid>
                {popularItems.map((item) => (
                  <LeagueCard
                    key={item.key}
                    league={item.league}
                    displayName={item.preset.displayName}
                    flagUrl={item.league ? flagMap.get(normalizeCountryName(item.league.countryName)) : undefined}
                    onClick={() => onSelect(item.preset.leagueId, item.targetSeason)}
                  />
                ))}
              </CardGrid>
            </>
          ) : null}

          {!hydrated ? (
            <>
              <SectionLabel>Popular leagues</SectionLabel>
              <CardGrid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 8,
                      background: 'var(--t-surface-3)',
                      animation: 'skeleton-pulse 1.4s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </CardGrid>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function StandingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;

  const { data: leagues, isLoading: leaguesLoading } = useLeagues(season);
  const { data: worldCupLeagues } = useLeagues(2026);
  const { data: countries } = useCountries();
  const { data: standings, isLoading: standingsLoading, isError: standingsError } = useStandings(leagueId, season);
  const selectedLeague = leagues?.find((l) => l.apiLeagueId === leagueId) ?? null;

  useEffect(() => {
    const canonicalHref = buildStandingsHref(leagueId, season);
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `/football/standings?${currentQuery}` : '/football/standings';
    if (canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
    }
  }, [leagueId, router, searchParams, season]);

  const handleSelect = (selectedLeagueId: number, selectedSeason: number) => {
    router.replace(buildStandingsHref(selectedLeagueId, selectedSeason), { scroll: false });
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--t-border)', flexShrink: 0 }}
      >
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex flex-wrap items-center gap-1 text-[11px]"
            style={{ color: 'var(--t-text-5)' }}
          >
            <Link href="/football" style={{ color: 'inherit', textDecoration: 'none' }}>
              Football
            </Link>
            <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
            <Link href="/football/standings" style={{ color: 'inherit', textDecoration: 'none' }}>
              Standings
            </Link>
            {selectedLeague ? (
              <>
                <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
                <span style={{ color: 'var(--t-text-4)' }}>{selectedLeague.name}</span>
              </>
            ) : null}
          </nav>

          <h1 className="text-[17px] font-bold" style={{ color: 'var(--t-text-1)' }}>Standings</h1>
          <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            {leagueId
              ? `Track the current ${selectedLeague?.name ?? 'league'} table, club positions, and recent form for the ${season}/${season + 1} season.`
              : 'Select a league to view its table, compare club form, and jump into team pages.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {leagueId ? (
            <select
              value={String(leagueId)}
              onChange={(e) => {
                const val = parsePositiveInt(e.target.value);
                router.replace(buildStandingsHref(val, season), { scroll: false });
              }}
              disabled={leaguesLoading}
              className="min-w-[220px] rounded px-3 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            >
              <option value="">{leaguesLoading ? 'Loading...' : 'Choose a league'}</option>
              {(leagues ?? []).map((l) => (
                <option key={`${l.apiLeagueId}-${l.season}`} value={l.apiLeagueId}>
                  {l.countryName} - {l.name}
                </option>
              ))}
            </select>
          ) : null}

          <select
            value={season}
            onChange={(e) => router.replace(buildStandingsHref(leagueId, Number(e.target.value)), { scroll: false })}
            className="rounded px-3 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
          >
            {[2026, 2025, 2024, 2023].map((v) => (
              <option key={v} value={v}>{v}/{v + 1}</option>
            ))}
          </select>

          {leagueId ? (
            <button
              type="button"
              onClick={() => router.replace(buildStandingsHref(null, season), { scroll: false })}
              className="rounded px-2.5 py-1.5 text-[11px] font-medium"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-3)', cursor: 'pointer' }}
            >
              ← All leagues
            </button>
          ) : null}
        </div>
      </div>

      {selectedLeague ? (
        <div
          className="px-5 py-2 text-[12px]"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)', flexShrink: 0 }}
        >
          <span style={{ color: 'var(--t-text-5)' }}>Viewing:</span>{' '}
          <span className="font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {selectedLeague.countryName} - {selectedLeague.name}
          </span>
          <span style={{ color: 'var(--t-text-5)' }}> · {season}/{season + 1}</span>
        </div>
      ) : null}

      <div className="px-5 pt-4">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--t-surface)',
            border: '1px solid var(--t-border)',
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--t-text-6)' }}>
            {selectedLeague ? 'League table overview' : 'Standings overview'}
          </div>
          <p className="mt-2 text-[13px] leading-6" style={{ color: 'var(--t-text-4)' }}>
            {selectedLeague
              ? `${selectedLeague.name} standings for ${season}/${season + 1}. Compare rank, points, goal difference, and recent form, then open any club page for team-specific odds and fixture context.`
              : 'Browse football league tables, search competitions, and jump into the standings view for each tournament. Popular leagues stay surfaced first so you can reach the most important tables faster.'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {!leagueId ? (
          <LeaguePicker
            leagues={leagues}
            worldCupLeagues={worldCupLeagues}
            countries={countries}
            season={season}
            onSelect={handleSelect}
          />
        ) : standingsLoading ? (
          <LoadingSpinner />
        ) : standingsError ? (
          <EmptyState title="Failed to load standings" description="Try again or choose another league." />
        ) : !standings?.length ? (
          <EmptyState title="No standings available" description="There is no standings data for this league yet." />
        ) : (
          <StandingsTable
            standings={standings}
            resolveTeamHref={(standing) =>
              leagueId && standing.apiTeamId
                ? buildTeamHref(standing.apiTeamId, standing.teamName, { leagueId, season })
                : null
            }
          />
        )}
      </div>
    </div>
  );
}

export default function StandingsPageClient() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StandingsContent />
    </Suspense>
  );
}
