'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FixtureDto } from '@/lib/types/api';
import type { LiveOddsMovementByFixture } from '@/lib/hooks/useLiveOdds';
import { fetchBestOddsBatch } from '@/lib/hooks/useOdds';
import { buildBookmakerHref } from '@/lib/bookmakers';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { FixtureRow } from './FixtureRow';
import { TableSkeleton } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { BestOddsDto } from '@/lib/types/api';

interface Props {
  fixtures: FixtureDto[];
  isLoading?: boolean;
  oddsMovements?: LiveOddsMovementByFixture;
  savedFixtureIds?: Set<number>;
  onToggleSave?: (fixtureId: number) => void;
}

function needsBestOddsFallback(fixture: FixtureDto): boolean {
  const liveSummary = fixture.liveOddsSummary ?? null;

  return (
    (fixture.stateBucket === 'Upcoming' ||
      fixture.stateBucket === 'Live' ||
      fixture.stateBucket === 'Unknown') &&
    (
      fixture.stateBucket !== 'Live' ||
      !liveSummary ||
      (liveSummary.source !== 'live' && liveSummary.source !== 'prematch')
    )
  );
}

function buildFixtureHref(apiFixtureId: number, tab?: 'odds') {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  const query = params.toString();
  return `/football/fixtures/${apiFixtureId}${query ? `?${query}` : ''}`;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function truncateBookmaker(name: string, max = 14): string {
  return name.length > max ? `${name.slice(0, max - 3)}...` : name;
}

function MobileOddsCell({
  fixtureId,
  label,
  odd,
  bookmaker,
}: {
  fixtureId: number;
  label: string;
  odd: number | null;
  bookmaker: string | null;
}) {
  if (!odd || !bookmaker) {
    return (
      <div className="odds-btn odds-btn-grid min-h-[58px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          {label}
        </span>
        <span className="odds-value na">-</span>
      </div>
    );
  }

  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId,
    outcome: label === '1' ? 'home' : label === 'X' ? 'draw' : 'away',
    source: 'fixture-list',
  });

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block" style={{ textDecoration: 'none' }}>
      <div className="odds-btn odds-btn-grid min-h-[58px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          {label}
        </span>
        <span className="odds-value">{odd.toFixed(2)}</span>
        <span className="truncate text-center text-[10px]" style={{ color: 'var(--t-text-5)' }}>
          {truncateBookmaker(bookmaker)}
        </span>
      </div>
    </a>
  );
}

function MobileFixtureCard({
  fixture,
  bestOddsFallback,
  isSaved,
  onToggleSave,
}: {
  fixture: FixtureDto;
  bestOddsFallback: BestOddsDto | null;
  isSaved: boolean;
  onToggleSave?: (fixtureId: number) => void;
}) {
  const router = useRouter();
  const isLive = fixture.stateBucket === 'Live';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const liveSource = liveSummary?.source ?? 'none';
  const needsPreMatchFallback =
    isLive &&
    (!liveSummary ||
      (liveSummary.source !== 'live' && liveSummary.source !== 'prematch'));
  const bestOdds = !isLive || needsPreMatchFallback ? bestOddsFallback ?? null : null;
  const scoreReady = fixture.homeGoals !== null && fixture.awayGoals !== null;

  const homeOdd = isLive ? liveSummary?.bestHomeOdd ?? bestOdds?.bestHomeOdd ?? null : bestOdds?.bestHomeOdd ?? null;
  const drawOdd = isLive ? liveSummary?.bestDrawOdd ?? bestOdds?.bestDrawOdd ?? null : bestOdds?.bestDrawOdd ?? null;
  const awayOdd = isLive ? liveSummary?.bestAwayOdd ?? bestOdds?.bestAwayOdd ?? null : bestOdds?.bestAwayOdd ?? null;
  const homeBookmaker = isLive ? liveSummary?.bestHomeBookmaker ?? bestOdds?.bestHomeBookmaker ?? null : bestOdds?.bestHomeBookmaker ?? null;
  const drawBookmaker = isLive ? liveSummary?.bestDrawBookmaker ?? bestOdds?.bestDrawBookmaker ?? null : bestOdds?.bestDrawBookmaker ?? null;
  const awayBookmaker = isLive ? liveSummary?.bestAwayBookmaker ?? bestOdds?.bestAwayBookmaker ?? null : bestOdds?.bestAwayBookmaker ?? null;

  const statusTone =
    liveSource === 'live'
      ? { label: 'Live prices', color: 'var(--t-accent)', bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.24)' }
      : liveSource === 'prematch'
        ? { label: 'Pre-match', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.24)' }
        : { label: 'Waiting', color: 'var(--t-text-4)', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.18)' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(buildFixtureHref(fixture.apiFixtureId))}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(buildFixtureHref(fixture.apiFixtureId));
        }
      }}
      className="panel-shell w-full rounded-xl p-3 text-left"
      style={{
        position: 'relative',
        ...(isLive ? { boxShadow: 'inset 3px 0 0 rgba(239,83,80,0.65), var(--t-shadow-soft)' } : null),
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
            {isLive ? 'Live' : formatKickoffDate(fixture.kickoffAt)}
          </span>
          <span className="text-[12px] font-semibold" style={{ color: isLive ? '#fca5a5' : 'var(--t-text-3)' }}>
            {isLive ? `${fixture.elapsed ?? ''}${fixture.elapsed != null ? "'" : ''}` : formatKickoff(fixture.kickoffAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: statusTone.color, background: statusTone.bg, borderColor: statusTone.border }}
            >
              {statusTone.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave?.(fixture.apiFixtureId);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-black"
            style={{
              background: isSaved ? 'rgba(0,230,118,0.12)' : 'var(--t-surface-2)',
              borderColor: isSaved ? 'rgba(0,230,118,0.28)' : 'var(--t-border-2)',
              color: isSaved ? 'var(--t-accent)' : 'var(--t-text-5)',
            }}
            aria-label={isSaved ? 'Remove fixture from watchlist' : 'Save fixture to watchlist'}
            title={isSaved ? 'Saved to watchlist' : 'Save to watchlist'}
          >
            {isSaved ? '★' : '☆'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
            <span className="min-w-0 truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
              {fixture.homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={18} />
            <span className="min-w-0 truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
              {fixture.awayTeamName}
            </span>
          </div>
        </div>

        <div className="flex min-w-[54px] items-center justify-center">
          <div
            className="rounded-lg px-2 py-1 text-center odds-cell"
            style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-2)' }}
          >
            {scoreReady ? (
              <div className="text-[13px] font-bold">
                {fixture.homeGoals} - {fixture.awayGoals}
              </div>
            ) : (
              <div className="text-[12px] font-semibold" style={{ color: 'var(--t-text-5)' }}>
                vs
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2" onClick={(event) => event.stopPropagation()}>
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="1" odd={homeOdd} bookmaker={homeBookmaker} />
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="X" odd={drawOdd} bookmaker={drawBookmaker} />
        <MobileOddsCell fixtureId={fixture.apiFixtureId} label="2" odd={awayOdd} bookmaker={awayBookmaker} />
      </div>
    </div>
  );
}

export function FixtureTable({ fixtures, isLoading, oddsMovements, savedFixtureIds, onToggleSave }: Props) {
  const fallbackFixtureIds = useMemo(
    () => fixtures.filter(needsBestOddsFallback).map((fixture) => fixture.apiFixtureId),
    [fixtures],
  );

  const { data: bestOddsBatch = {} } = useQuery({
    queryKey: ['best-odds-batch', fallbackFixtureIds],
    queryFn: () => fetchBestOddsBatch(fallbackFixtureIds),
    staleTime: 60_000,
    enabled: fallbackFixtureIds.length > 0,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const bestOddsMap = useMemo(
    () =>
      new Map(
        fixtures.map((fixture) => [fixture.apiFixtureId, bestOddsBatch[String(fixture.apiFixtureId)] ?? null]),
      ),
    [bestOddsBatch, fixtures],
  );

  const byLeague = useMemo(
    () =>
      fixtures.reduce<Record<string, { name: string; country: string; items: FixtureDto[] }>>((acc, fixture) => {
        const key = String(fixture.leagueApiId);
        if (!acc[key]) {
          acc[key] = { name: fixture.leagueName, country: fixture.countryName, items: [] };
        }
        acc[key].items.push(fixture);
        return acc;
      }, {}),
    [fixtures],
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed">
          <tbody>
            <TableSkeleton rows={12} cols={5} />
          </tbody>
        </table>
      </div>
    );
  }

  if (Object.keys(byLeague).length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <EmptyState title="No fixtures" description="No matches found for the selected date or filters." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {Object.entries(byLeague).map(([key, { name, country, items }]) => {
        const oddsCount = items.filter((fixture) => {
          const liveSummary = fixture.liveOddsSummary ?? null;
          if (liveSummary?.bestHomeOdd || liveSummary?.bestDrawOdd || liveSummary?.bestAwayOdd) {
            return true;
          }

          const bestOdds = bestOddsMap.get(fixture.apiFixtureId);
          return Boolean(bestOdds?.bestHomeOdd || bestOdds?.bestDrawOdd || bestOdds?.bestAwayOdd);
        }).length;

        return (
          <div key={key}>
            <div
              className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5"
              style={{
                background: 'var(--t-surface)',
                borderBottom: '1px solid var(--t-border)',
                borderTop: '1px solid var(--t-border)',
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: 'var(--t-text-5)' }}>
                {country}
              </span>
              <span style={{ color: 'var(--t-border-2)' }}>|</span>
              <span className="text-[12px] font-bold" style={{ color: 'var(--t-text-2)' }}>
                {name}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                {oddsCount}/{items.length} with odds
              </span>
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[11px] font-mono"
                style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)' }}
              >
                {items.length}
              </span>
            </div>

            <div className="md:hidden space-y-2 px-2 py-2">
              {items.map((fixture) => (
                <MobileFixtureCard
                  key={`mobile-${fixture.apiFixtureId}`}
                  fixture={fixture}
                  bestOddsFallback={bestOddsMap.get(fixture.apiFixtureId) ?? null}
                  isSaved={savedFixtureIds?.has(fixture.apiFixtureId) ?? false}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>

            <table className="hidden w-full table-fixed md:table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--t-border)' }}>
                  <th
                    className="w-[80px] py-1.5 pl-3 pr-2 text-center text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--t-text-6)' }}
                  >
                    Time
                  </th>
                  <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
                    Home
                  </th>
                  <th className="w-14 px-1 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
                    Score
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
                    Away
                  </th>
                  <th className="w-[210px] py-1.5 pl-1 pr-3" style={{ color: 'var(--t-text-5)' }}>
                    <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider">
                      <span>1</span>
                      <span>X</span>
                      <span>2</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((fixture) => (
                  <FixtureRow
                    key={String(fixture.apiFixtureId)}
                    fixture={fixture}
                    bestOddsFallback={bestOddsMap.get(fixture.apiFixtureId) ?? null}
                    oddsMovement={oddsMovements?.[fixture.apiFixtureId]}
                    isSaved={savedFixtureIds?.has(fixture.apiFixtureId) ?? false}
                    onToggleSave={onToggleSave}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
