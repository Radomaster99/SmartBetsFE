'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCountries } from '@/lib/hooks/useCountries';
import { useLeagues } from '@/lib/hooks/useLeagues';
import {
  USER_POPULAR_LEAGUES_STORAGE_KEY,
  USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY,
  mergePopularLeaguePresets,
  readPopularLeaguePresets,
  readPopularLeagueKeys,
} from '@/lib/popular-leagues';
import { usePopularLeaguesContent } from '@/lib/hooks/useContentDocuments';
import { buildStandingsPath } from '@/lib/league-links';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
const MOBILE_LEAGUES_SHEET_BG = '#07101a';
const MOBILE_LEAGUES_SHEET_HEADER_BG = '#090e1a';
const MOBILE_LEAGUES_CLOSE_DRAG_PX = 88;

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function LeaguesBottomSheetInner({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const touchStateRef = useRef<{
    startY: number;
    startX: number;
    dragging: boolean;
  } | null>(null);

  const isStandingsPage = pathname.startsWith('/football/standings');
  const activeLeagueId = parsePositiveInt(searchParams.get('leagueId'));
  const requestedSeason = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const season = activeLeagueId ? requestedSeason : DEFAULT_SEASON;

  const { data: leagues } = useLeagues(season);
  const { data: worldCupLeagues } = useLeagues(2026);
  const { data: countries } = useCountries();
  const popularLeaguesQuery = usePopularLeaguesContent();

  const popularLeaguePresets = useMemo(() => {
    const admin = popularLeaguesQuery.data ?? [];
    const user = readPopularLeaguePresets(USER_POPULAR_LEAGUES_STORAGE_KEY, []);
    const hidden = readPopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, []);
    return mergePopularLeaguePresets(admin, user, hidden);
  }, [popularLeaguesQuery.data]);

  const popularLeagues = useMemo(
    () =>
      popularLeaguePresets.map((item) => {
        const sourceLeagues = item.season === 2026 ? worldCupLeagues ?? [] : leagues ?? [];
        const league = sourceLeagues.find((l) => l.apiLeagueId === item.leagueId) ?? null;
        return { ...item, league, targetSeason: item.season ?? season };
      }),
    [leagues, popularLeaguePresets, season, worldCupLeagues],
  );

  const countriesByName = useMemo(() => {
    const map = new Map<string, { flagUrl?: string }>();
    countries?.forEach((c) => map.set(c.name.trim().toLowerCase(), c));
    return map;
  }, [countries]);

  const countryGroups = useMemo(() => {
    if (!leagues?.length) return [];
    const grouped = new Map<string, { countryName: string; flagUrl?: string; leagues: typeof leagues }>();
    leagues.forEach((league) => {
      const key = league.countryName.trim().toLowerCase();
      if (!grouped.has(key)) {
        const country = countriesByName.get(key);
        grouped.set(key, { countryName: league.countryName, flagUrl: country?.flagUrl, leagues: [] });
      }
      grouped.get(key)!.leagues.push(league);
    });
    return Array.from(grouped.values()).sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [leagues, countriesByName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function buildLeagueHref(leagueId: number, leagueSeason: number) {
    if (isStandingsPage) {
      const leagueName =
        (leagueSeason === 2026 ? worldCupLeagues ?? [] : leagues ?? []).find((league) => league.apiLeagueId === leagueId)?.name ??
        popularLeagues.find((item) => item.leagueId === leagueId && item.targetSeason === leagueSeason)?.displayName ??
        null;
      return buildStandingsPath(leagueId, leagueSeason, leagueName);
    }
    return `/football?state=Upcoming&leagueId=${leagueId}&upcomingScope=all&season=${leagueSeason}`;
  }

  function handleSheetTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStateRef.current = {
      startY: touch.clientY,
      startX: touch.clientX,
      dragging: false,
    };
  }

  function handleSheetTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const state = touchStateRef.current;
    if (!state) {
      return;
    }

    const touch = event.touches[0];
    const deltaY = touch.clientY - state.startY;
    const deltaX = touch.clientX - state.startX;

    if (!state.dragging) {
      if (Math.abs(deltaX) > Math.abs(deltaY) + 4) {
        touchStateRef.current = null;
        setDragOffsetY(0);
        return;
      }

      if (Math.abs(deltaY) < 6) {
        return;
      }

      state.dragging = true;
    }

    setDragOffsetY(Math.max(0, deltaY));
  }

  function handleSheetTouchEnd() {
    const offsetY = dragOffsetY;
    touchStateRef.current = null;
    setDragOffsetY(0);

    if (offsetY >= MOBILE_LEAGUES_CLOSE_DRAG_PX) {
      onClose();
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 'var(--topbar-h)',
        bottom: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: MOBILE_LEAGUES_SHEET_BG,
        borderTop: '1px solid var(--t-border)',
        transform: `translateY(${dragOffsetY}px)`,
        transition: dragOffsetY === 0 ? 'transform 180ms ease' : 'none',
      }}
    >
      <div
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        onTouchCancel={handleSheetTouchEnd}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 0 6px',
          background: MOBILE_LEAGUES_SHEET_HEADER_BG,
          touchAction: 'none',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
      </div>

      <div
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
        onTouchCancel={handleSheetTouchEnd}
        style={{
          padding: '0 16px 10px',
          borderBottom: '1px solid var(--t-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: MOBILE_LEAGUES_SHEET_HEADER_BG,
          touchAction: 'none',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--t-text-3)',
          }}
        >
          Leagues
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: MOBILE_LEAGUES_SHEET_BG }}>
        {popularLeagues.length > 0 ? (
          <div style={{ padding: '10px 12px 4px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--t-text-5)',
                marginBottom: 6,
              }}
            >
              Popular
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {popularLeagues.map((item) => {
                const isActive = item.leagueId === activeLeagueId;
                return (
                  <Link
                    key={`${item.leagueId}-${item.targetSeason}`}
                    href={buildLeagueHref(item.leagueId, item.targetSeason)}
                    onClick={onClose}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      textDecoration: 'none',
                      background: isActive ? 'rgba(0,230,118,0.14)' : 'rgba(255,255,255,0.07)',
                      border: isActive ? '1px solid rgba(0,230,118,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: isActive ? 'var(--t-accent)' : 'var(--t-text-2)',
                    }}
                  >
                    {item.displayName}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div style={{ margin: '8px 0', borderTop: '1px solid var(--t-border)' }} />

        <div style={{ padding: '0 8px 8px' }}>
          {countryGroups.map((group) => {
            const isExpanded = expandedCountries[group.countryName] ?? false;
            const hasActive = group.leagues.some((league) => league.apiLeagueId === activeLeagueId);
            return (
              <div
                key={group.countryName}
                style={{
                  marginTop: 2,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'var(--t-surface)',
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCountries((current) => ({
                      ...current,
                      [group.countryName]: !isExpanded,
                    }))
                  }
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: hasActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderLeft: 'none',
                    borderBottom: isExpanded ? '1px solid var(--t-border)' : '1px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {group.flagUrl ? (
                    <img
                      src={group.flagUrl}
                      alt={group.countryName}
                      width={14}
                      height={10}
                      style={{ objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 14,
                        fontSize: 9,
                        color: 'var(--t-text-5)',
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ○
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--t-text-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.countryName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--t-text-5)', marginRight: 4 }}>
                    {group.leagues.length}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--t-text-5)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    ›
                  </span>
                </button>
                {isExpanded ? (
                  <div style={{ paddingBottom: 4 }}>
                    {group.leagues.map((league) => {
                      const isActive = league.apiLeagueId === activeLeagueId;
                      return (
                        <Link
                          key={`${league.apiLeagueId}-${league.season}`}
                          href={buildLeagueHref(league.apiLeagueId, league.season)}
                          onClick={onClose}
                          style={{
                            display: 'block',
                            padding: '7px 10px 7px 32px',
                            fontSize: 12,
                            textDecoration: 'none',
                            color: isActive ? 'var(--t-text-1)' : 'var(--t-text-4)',
                            background: isActive ? 'rgba(0,230,118,0.07)' : 'transparent',
                            borderLeft: isActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
                          }}
                        >
                          {league.name}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LeaguesBottomSheet({ onClose }: { onClose: () => void }) {
  return (
    <Suspense fallback={null}>
      <LeaguesBottomSheetInner onClose={onClose} />
    </Suspense>
  );
}
