'use client';
import { use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FixtureDetailError, useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useOdds, useBestOdds } from '@/lib/hooks/useOdds';
import { useLiveOdds, useLiveOddsSignalR, type LiveOddsMovementDirection, type LiveOddsRealtimeStatus } from '@/lib/hooks/useLiveOdds';
import type { BestOddsDto, OddDto } from '@/lib/types/api';
import { FixtureDetailHeader, type SelectedFixtureTeam } from '@/components/fixtures/FixtureDetailHeader';
import { OddsTable } from '@/components/odds/OddsTable';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { deriveBestOddsFromOdds, mapLiveOddsToOdds } from '@/lib/live-odds';

type Tab = 'odds' | 'match' | 'h2h';

interface Props {
  params: Promise<{ fixtureId: string }>;
}

const LAST_MATCHES_HREF_KEY = 'smartbets:last-matches-href';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--t-text-5)' }}>
      {children}
    </span>
  );
}

function WidgetCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
    >
      {children}
    </div>
  );
}

function LiveOddsStatusPill({
  status,
  hasLiveOdds,
  usingPreMatchFallback,
}: {
  status: LiveOddsRealtimeStatus;
  hasLiveOdds: boolean;
  usingPreMatchFallback: boolean;
}) {
  let copy = 'Live odds idle';
  let styles = {
    background: 'rgba(148,163,184,0.12)',
    border: '1px solid rgba(148,163,184,0.22)',
    color: 'var(--t-text-3)',
  };

  if (hasLiveOdds && status === 'connected') {
    copy = 'Live odds connected';
    styles = {
      background: 'rgba(0,230,118,0.12)',
      border: '1px solid rgba(0,230,118,0.28)',
      color: 'var(--t-accent)',
    };
  } else if (hasLiveOdds && (status === 'connecting' || status === 'reconnecting')) {
    copy = 'Live odds syncing';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (usingPreMatchFallback) {
    copy = 'Using pre-match fallback';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (status === 'error') {
    copy = 'Realtime unavailable';
    styles = {
      background: 'rgba(239,83,80,0.12)',
      border: '1px solid rgba(239,83,80,0.24)',
      color: '#fca5a5',
    };
  } else if (!hasLiveOdds) {
    copy = 'No live odds from provider';
    styles = {
      background: 'rgba(148,163,184,0.12)',
      border: '1px solid rgba(148,163,184,0.22)',
      color: 'var(--t-text-3)',
    };
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
      style={styles}
    >
      {hasLiveOdds && status === 'connected' && (
        <span className="live-dot" aria-hidden="true" />
      )}
      {copy}
    </div>
  );
}

function resolveInitialTab(tab: string | null): Tab {
  if (tab === 'odds' || tab === 'h2h' || tab === 'match') {
    return tab;
  }

  // Default to odds so bettors land on the comparison surface first.
  return 'odds';
}

function getMovementDirection(previousValue: number | null | undefined, nextValue: number | null | undefined): LiveOddsMovementDirection | null {
  if (previousValue == null || nextValue == null || previousValue === nextValue) {
    return null;
  }

  return nextValue > previousValue ? 'up' : 'down';
}

function formatRelativeTimestamp(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return null;
  }

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return mins % 60 === 0 ? `${hours}h ago` : `${hours}h ${mins % 60}m ago`;
  }

  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? `${days}d ago` : `${days}d ${hours % 24}h ago`;
}

export default function FixtureDetailPage({ params }: Props) {
  const { fixtureId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = resolveInitialTab(searchParams.get('tab'));
  const [tab, setTab] = useState<Tab>(initialTab);
  const [bestOddsMovements, setBestOddsMovements] = useState<Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>({});
  const [oddsTableMovements, setOddsTableMovements] = useState<Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>>({});
  const detailOddsMovementTimeoutsRef = useRef(new Map<string, number>());
  const previousDisplayOddsRef = useRef<OddDto[] | null>(null);
  const previousBestOddsRef = useRef<BestOddsDto | null>(null);

  const { data: detail, isLoading, isError, error } = useFixtureDetail(fixtureId);
  const { data: odds } = useOdds(fixtureId);
  const { data: bestOdds } = useBestOdds(fixtureId);
  const liveOddsEnabled = Boolean(detail?.fixture.stateBucket === 'Live' && tab === 'odds');
  const liveOddsQuery = useLiveOdds(fixtureId, liveOddsEnabled);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const isLiveFixture = detail?.fixture.stateBucket === 'Live';
  const liveOddsRealtimeStatus = useLiveOddsSignalR(fixtureId, liveOddsEnabled);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY)) {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, '/football');
    }
  }, []);

  const handleBackToMatches = () => {
    if (typeof window === 'undefined') {
      router.push('/football');
      return;
    }

    const savedHref = window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY);
    if (savedHref?.startsWith('/football')) {
      router.push(savedHref);
      return;
    }

    router.push('/football');
  };

  const handleTeamSelect = (team: SelectedFixtureTeam) => {
    const params = new URLSearchParams({
      leagueId: String(detail?.fixture.leagueApiId ?? ''),
      season: String(detail?.fixture.season ?? ''),
      fromFixtureId: String(detail?.fixture.apiFixtureId ?? ''),
    });
    const teamHref = `/football/teams/${team.apiTeamId}?${params.toString()}`;
    router.push(teamHref);
  };

  useEffect(() => {
    return () => {
      for (const timeout of detailOddsMovementTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      detailOddsMovementTimeoutsRef.current.clear();
    };
  }, []);

  const isLive = detail?.fixture.stateBucket === 'Live';
  const mappedLiveOdds = useMemo(
    () => (isLive ? mapLiveOddsToOdds(liveOddsQuery.data ?? []) : []),
    [isLive, liveOddsQuery.data],
  );
  const derivedLiveBestOdds = useMemo(
    () => (isLive ? deriveBestOddsFromOdds(mappedLiveOdds) : null),
    [isLive, mappedLiveOdds],
  );
  const hasLiveOdds = mappedLiveOdds.length > 0;
  const hasPreMatchFallback = Boolean((odds?.length ?? 0) > 0 || detail?.bestOdds || bestOdds);
  const usingPreMatchFallback = Boolean(isLive && !hasLiveOdds && hasPreMatchFallback);
  const displayOdds = useMemo(
    () => (isLive ? (hasLiveOdds ? mappedLiveOdds : (odds ?? [])) : (odds ?? [])),
    [hasLiveOdds, isLive, mappedLiveOdds, odds],
  );
  const resolvedBestOdds = isLive
    ? derivedLiveBestOdds ?? detail?.bestOdds ?? bestOdds ?? null
    : detail?.bestOdds ?? bestOdds ?? null;
  const hasAnyOdds = Boolean(resolvedBestOdds) || Boolean(displayOdds.length);
  const oddsFreshnessIso = isLive
    ? resolvedBestOdds?.collectedAtUtc ?? detail?.latestOddsCollectedAtUtc ?? detail?.oddsLastSyncedAtUtc ?? null
    : detail?.oddsLastSyncedAtUtc ?? null;
  const liveOddsSyncedAtIso =
    isLive && hasLiveOdds
      ? (liveOddsQuery.data ?? []).reduce<string | null>((latest, market) => {
          const marketTimestamp = market.lastSyncedAtUtc ?? market.collectedAtUtc ?? null;
          if (!marketTimestamp) {
            return latest;
          }

          if (!latest || new Date(marketTimestamp).getTime() > new Date(latest).getTime()) {
            return marketTimestamp;
          }

          return latest;
        }, null)
      : null;
  const liveOddsLastChangedAtIso =
    isLive && hasLiveOdds
      ? (liveOddsQuery.data ?? []).reduce<string | null>((latest, market) => {
          const marketTimestamp = market.lastSnapshotCollectedAtUtc ?? market.collectedAtUtc ?? null;
          if (!marketTimestamp) {
            return latest;
          }

          if (!latest || new Date(marketTimestamp).getTime() > new Date(latest).getTime()) {
            return marketTimestamp;
          }

          return latest;
        }, null)
      : null;
  const liveOddsLastSyncedLabel = formatRelativeTimestamp(liveOddsSyncedAtIso);
  const liveOddsLastChangedLabel = formatRelativeTimestamp(liveOddsLastChangedAtIso);
  const headerOddsLabel = isLive
    ? liveOddsLastSyncedLabel
      ? `Live odds synced ${liveOddsLastSyncedLabel}${
          liveOddsLastChangedLabel && liveOddsLastChangedLabel !== liveOddsLastSyncedLabel
            ? ` · Last change ${liveOddsLastChangedLabel}`
            : ''
        }`
      : usingPreMatchFallback && oddsFreshnessIso
        ? `Pre-match odds updated ${formatRelativeTimestamp(oddsFreshnessIso) ?? 'recently'}`
        : null
    : oddsFreshnessIso
      ? (() => {
          const label = formatRelativeTimestamp(oddsFreshnessIso);
          return label ? `Odds updated ${label}` : null;
        })()
      : null;

  useEffect(() => {
    if (!isLive || tab !== 'odds') {
      previousDisplayOddsRef.current = null;
      previousBestOddsRef.current = null;
      setBestOddsMovements((current) => (Object.keys(current).length === 0 ? current : {}));
      setOddsTableMovements((current) => (Object.keys(current).length === 0 ? current : {}));

      if (detailOddsMovementTimeoutsRef.current.size > 0) {
        for (const timeout of detailOddsMovementTimeoutsRef.current.values()) {
          window.clearTimeout(timeout);
        }
        detailOddsMovementTimeoutsRef.current.clear();
      }
      return;
    }

    const previousDisplayOdds = previousDisplayOddsRef.current;
    const previousBestOdds = previousBestOddsRef.current;

    const scheduleBestMovementClear = (outcome: 'home' | 'draw' | 'away') => {
      const timeoutKey = `best:${outcome}`;
      const existingTimeout = detailOddsMovementTimeoutsRef.current.get(timeoutKey);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      const timeout = window.setTimeout(() => {
        setBestOddsMovements((current) => {
          if (!current[outcome]) {
            return current;
          }

          const next = { ...current };
          delete next[outcome];
          return next;
        });
        detailOddsMovementTimeoutsRef.current.delete(timeoutKey);
      }, 1800);

      detailOddsMovementTimeoutsRef.current.set(timeoutKey, timeout);
    };

    const scheduleTableMovementClear = (bookmaker: string, outcome: 'home' | 'draw' | 'away') => {
      const timeoutKey = `table:${bookmaker}:${outcome}`;
      const existingTimeout = detailOddsMovementTimeoutsRef.current.get(timeoutKey);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      const timeout = window.setTimeout(() => {
        setOddsTableMovements((current) => {
          const fixtureMovement = current[bookmaker];
          if (!fixtureMovement?.[outcome]) {
            return current;
          }

          const nextBookmakerMovement = { ...fixtureMovement };
          delete nextBookmakerMovement[outcome];

          if (Object.keys(nextBookmakerMovement).length === 0) {
            const nextState = { ...current };
            delete nextState[bookmaker];
            return nextState;
          }

          return {
            ...current,
            [bookmaker]: nextBookmakerMovement,
          };
        });

        detailOddsMovementTimeoutsRef.current.delete(timeoutKey);
      }, 1800);

      detailOddsMovementTimeoutsRef.current.set(timeoutKey, timeout);
    };

    if (previousBestOdds && resolvedBestOdds) {
      const nextBestMovements: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> = {};

      const homeMovement = getMovementDirection(previousBestOdds.bestHomeOdd, resolvedBestOdds.bestHomeOdd);
      const drawMovement = getMovementDirection(previousBestOdds.bestDrawOdd, resolvedBestOdds.bestDrawOdd);
      const awayMovement = getMovementDirection(previousBestOdds.bestAwayOdd, resolvedBestOdds.bestAwayOdd);

      if (homeMovement) nextBestMovements.home = homeMovement;
      if (drawMovement) nextBestMovements.draw = drawMovement;
      if (awayMovement) nextBestMovements.away = awayMovement;

      if (Object.keys(nextBestMovements).length > 0) {
        setBestOddsMovements((current) => ({ ...current, ...nextBestMovements }));
        (Object.keys(nextBestMovements) as Array<'home' | 'draw' | 'away'>).forEach(scheduleBestMovementClear);
      }
    }

    if (previousDisplayOdds) {
      const previousByBookmaker = new Map(previousDisplayOdds.map((odd) => [odd.bookmaker, odd]));
      const nextTableMovements: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>> = {};

      displayOdds.forEach((odd) => {
        const previous = previousByBookmaker.get(odd.bookmaker);
        if (!previous) {
          return;
        }

        const homeMovement = getMovementDirection(previous.homeOdd, odd.homeOdd);
        const drawMovement = getMovementDirection(previous.drawOdd, odd.drawOdd);
        const awayMovement = getMovementDirection(previous.awayOdd, odd.awayOdd);
        const bookmakerMovements: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>> = {};

        if (homeMovement) bookmakerMovements.home = homeMovement;
        if (drawMovement) bookmakerMovements.draw = drawMovement;
        if (awayMovement) bookmakerMovements.away = awayMovement;

        if (Object.keys(bookmakerMovements).length > 0) {
          nextTableMovements[odd.bookmaker] = bookmakerMovements;
        }
      });

      if (Object.keys(nextTableMovements).length > 0) {
        setOddsTableMovements((current) => {
          const nextState = { ...current };

          for (const [bookmaker, movements] of Object.entries(nextTableMovements)) {
            nextState[bookmaker] = {
              ...(current[bookmaker] ?? {}),
              ...movements,
            };
          }

          return nextState;
        });

        for (const [bookmaker, movements] of Object.entries(nextTableMovements)) {
          (Object.keys(movements) as Array<'home' | 'draw' | 'away'>).forEach((outcome) => {
            scheduleTableMovementClear(bookmaker, outcome);
          });
        }
      }
    }

    previousDisplayOddsRef.current = displayOdds;
    previousBestOddsRef.current = resolvedBestOdds;
  }, [displayOdds, isLive, resolvedBestOdds, tab]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !detail) {
    const detailError = error instanceof FixtureDetailError ? error : null;
    const title = detailError?.status === 500 ? 'Live match detail is temporarily unavailable' : 'Fixture not found';
    const description =
      detailError?.status === 500
        ? 'The backend fixture detail endpoint is currently failing for this match. The fixture exists, but its full detail screen cannot be loaded right now.'
        : 'This fixture may not exist or the data is unavailable.';

    return (
      <EmptyState
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={handleBackToMatches}
            className="mt-2 inline-flex items-center px-4 py-2 rounded text-[12px] font-medium"
            style={{
              background: 'rgba(0,230,118,0.15)',
              color: '#00e676',
              border: '1px solid rgba(0,230,118,0.3)',
              cursor: 'pointer',
            }}
          >
            Back to matches
          </button>
        }
      />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'odds', label: 'Odds' },
    { id: 'match', label: 'Match' },
    { id: 'h2h', label: 'H2H' },
  ];

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleBackToMatches}
          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors bg-transparent border-0 cursor-pointer"
          style={{ color: 'var(--t-text-3)' }}
        >
          <span aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>
            {'<'}
          </span>
          <span>Matches</span>
        </button>
      </div>

      <FixtureDetailHeader
        detail={detail}
        onTeamSelect={handleTeamSelect}
      />

      <div
        className="flex items-center"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-topbar-bg)' }}
      >
        {tabs.map((currentTab) => (
          <button
            key={currentTab.id}
            onClick={() => setTab(currentTab.id)}
            className="px-5 py-3 text-[13px] font-medium transition-colors flex-shrink-0"
            style={{
              color: tab === currentTab.id ? 'var(--t-text-1)' : 'var(--t-text-4)',
              borderBottom: tab === currentTab.id ? '2px solid var(--t-accent)' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {currentTab.label}
          </button>
        ))}
        {headerOddsLabel && (
          <span className="ml-auto pr-4 text-[11px] flex-shrink-0" style={{ color: 'var(--t-text-5)' }}>
            {headerOddsLabel}
          </span>
        )}
      </div>

      <div className="p-4">
        {tab === 'match' && (
          <WidgetCard>
            <ApiSportsWidget
              type="game"
              gameId={detail.fixture.apiFixtureId}
              gameTab="events"
              refresh={isLive ? 120 : undefined}
            />
          </WidgetCard>
        )}

        {tab === 'h2h' && (
          <WidgetCard>
            <ApiSportsWidget
              type="h2h"
              h2h={`${detail.fixture.homeTeamApiId}-${detail.fixture.awayTeamApiId}`}
            />
          </WidgetCard>
        )}

        {tab === 'odds' &&
          (hasAnyOdds ? (
            <div className="flex flex-col gap-5">
              {isLive ? (
                <div className="flex flex-col gap-2">
                  <LiveOddsStatusPill
                    status={liveOddsRealtimeStatus}
                    hasLiveOdds={hasLiveOdds}
                    usingPreMatchFallback={usingPreMatchFallback}
                  />
                  {usingPreMatchFallback ? (
                    <div
                      className="rounded-md px-3 py-2 text-[11px]"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.24)',
                        color: '#fbbf24',
                      }}
                    >
                      Provider live markets are missing for this fixture right now, so SmartBets is showing the latest pre-match prices instead.
                    </div>
                  ) : null}
                  {liveOddsRealtimeStatus === 'connected' && hasLiveOdds ? (
                    <div
                      className="rounded-md px-3 py-2 text-[11px]"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--t-border)',
                        color: 'var(--t-text-4)',
                      }}
                    >
                      Live price movements flash in the table below as the provider updates the market.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {resolvedBestOdds ? (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Best Odds</SectionLabel>
                  <BestOddsBar
                    bestOdds={resolvedBestOdds}
                    fixtureId={detail.fixture.apiFixtureId}
                    movements={isLive ? bestOddsMovements : undefined}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <SectionLabel>All Bookmakers</SectionLabel>
                <OddsTable
                  odds={displayOdds}
                  fixtureId={detail.fixture.apiFixtureId}
                  movements={isLive ? oddsTableMovements : undefined}
                />
              </div>
            </div>
          ) : (
            <EmptyState title="No odds available" description="No bookmaker odds are available for this fixture." />
          ))}
      </div>
    </div>
  );
}
