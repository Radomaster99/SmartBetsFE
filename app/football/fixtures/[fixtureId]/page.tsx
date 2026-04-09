'use client';
import { Suspense, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FixtureDetailError, useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useFixtureOddsData } from '@/lib/hooks/useFixtureOddsData';
import { type LiveOddsRealtimeStatus } from '@/lib/hooks/useLiveOdds';
import { FixtureDetailHeader, type SelectedFixtureTeam } from '@/components/fixtures/FixtureDetailHeader';
import { OddsTable } from '@/components/odds/OddsTable';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

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

  if (usingPreMatchFallback) {
    copy = 'Using pre-match fallback';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (hasLiveOdds && status === 'connected') {
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
      {hasLiveOdds && status === 'connected' && !usingPreMatchFallback && (
        <span className="live-dot" aria-hidden="true" />
      )}
      {copy}
    </div>
  );
}

function resolveInitialTab(tab: string | null, stateBucket?: string | null): Tab {
  if (tab === 'odds' || tab === 'h2h' || tab === 'match') {
    return tab;
  }

  if (stateBucket === 'Finished') {
    return 'match';
  }

  // Default to odds so bettors land on the comparison surface first.
  return 'odds';
}


function FixtureDetailPageInner({ params }: Props) {
  const { fixtureId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = resolveInitialTab(requestedTab);
  const [tab, setTab] = useState<Tab>(initialTab);

  const {
    detail,
    isLoading,
    isError,
    error,
    isLive,
    displayOdds,
    resolvedBestOdds,
    hasAnyOdds,
    usingPreMatchFallback,
    hasLiveOdds,
    shouldUseLiveBookmakerView,
    liveOddsRealtimeStatus,
    bestOddsMovements,
    oddsTableMovements,
    headerOddsLabel,
  } = useFixtureOddsData(fixtureId, tab === 'odds');

  // useFixtureDetail is called inside useFixtureOddsData; we still need refetch
  const { refetch } = useFixtureDetail(fixtureId);

  const resolvedRequestedTab = useMemo(
    () => resolveInitialTab(requestedTab, detail?.fixture.stateBucket ?? null),
    [detail?.fixture.stateBucket, requestedTab],
  );

  useEffect(() => {
    setTab(resolvedRequestedTab);
  }, [resolvedRequestedTab]);

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !detail) {
    const detailError = error instanceof FixtureDetailError ? error : null;
    const isTimeout = detailError?.status === 408;
    const title = isTimeout
      ? 'Loading timed out'
      : detailError?.status === 404
        ? 'Fixture not found'
        : 'Match detail temporarily unavailable';
    const description = isTimeout
      ? 'The server is warming up (first load on free tier). Click Retry — it will connect on the next attempt.'
      : detailError?.status === 404
        ? 'This fixture may not exist or the data is unavailable.'
        : 'The fixture detail endpoint is currently slow or unavailable. Try again in a moment.';

    return (
      <EmptyState
        title={title}
        description={description}
        action={
          <div className="mt-2 flex gap-2">
            {(isTimeout || (detailError && detailError.status !== 404)) ? (
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex items-center px-4 py-2 rounded text-[12px] font-medium"
                style={{
                  background: 'rgba(0,230,118,0.15)',
                  color: '#00e676',
                  border: '1px solid rgba(0,230,118,0.3)',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleBackToMatches}
              className="inline-flex items-center px-4 py-2 rounded text-[12px] font-medium"
              style={{
                background: 'rgba(148,163,184,0.1)',
                color: 'var(--t-text-3)',
                border: '1px solid rgba(148,163,184,0.2)',
                cursor: 'pointer',
              }}
            >
              Back to matches
            </button>
          </div>
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
                      Live odds from the provider are not yet available for this match. Showing latest pre-match prices.
                    </div>
                  ) : null}
                  {liveOddsRealtimeStatus === 'connected' && shouldUseLiveBookmakerView ? (
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

export default function FixtureDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FixtureDetailPageInner params={params} />
    </Suspense>
  );
}
