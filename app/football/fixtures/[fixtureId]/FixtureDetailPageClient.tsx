'use client';
import { Suspense, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FixtureDetailError, useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { usePageVisibility } from '@/lib/hooks/usePageVisibility';
import { useLiveStatsRefresh } from '@/lib/hooks/useLiveStatsRefresh';
import { useFixtureOddsData } from '@/lib/hooks/useFixtureOddsData';
import { useFixtureStatistics } from '@/lib/hooks/useFixtureStatistics';
import { extractFixtureQuickStatsSummary } from '@/lib/fixture-statistics';
import { FixtureDetailHeader, type SelectedFixtureTeam } from '@/components/fixtures/FixtureDetailHeader';
import { OddsComparison } from '@/components/odds/OddsComparison';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { buildStandingsPath } from '@/lib/league-links';
import { buildTeamPath } from '@/lib/team-links';
import { writeTeamPageNavigationContext } from '@/lib/team-page-context';
import { writeFixturePageSidebarContext } from '@/lib/fixture-page-sidebar-context';

type Tab = 'odds' | 'match' | 'h2h';

interface Props {
  params: Promise<{ fixtureId: string }>;
}

const LAST_MATCHES_HREF_KEY = 'smartbets:last-matches-href';

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

function resolveInitialTab(tab: string | null, stateBucket?: string | null): Tab {
  if (tab === 'odds' || tab === 'h2h' || tab === 'match') {
    return tab;
  }

  if (stateBucket === 'Finished') {
    return 'match';
  }

  return 'odds';
}

function FixtureDetailPageInner({ params }: Props) {
  const { fixtureId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = resolveInitialTab(requestedTab);
  const [tab, setTab] = useState<Tab>(initialTab);
  const isPageVisible = usePageVisibility();

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
    isLiveOddsPending,
    liveOddsRealtimeStatus,
    bestOddsMovements,
    oddsTableMovements,
  } = useFixtureOddsData(fixtureId, tab === 'odds');

  const { refetch } = useFixtureDetail(fixtureId);
  const statisticsQuery = useFixtureStatistics(fixtureId, {
    enabled: Boolean(detail),
    refetchInterval: detail && isLive && isPageVisible ? 30_000 : false,
  });
  useLiveStatsRefresh({
    enabled: Boolean(detail),
    isLive,
    isPageVisible,
    refetch: statisticsQuery.refetch,
  });

  const resolvedRequestedTab = useMemo(
    () => resolveInitialTab(requestedTab, detail?.fixture.stateBucket ?? null),
    [detail?.fixture.stateBucket, requestedTab],
  );
  const quickStatsSummary = useMemo(
    () =>
      detail
        ? extractFixtureQuickStatsSummary(
            statisticsQuery.data,
            detail.fixture,
          )
        : null,
    [detail, statisticsQuery.data],
  );

  useEffect(() => {
    setTab(resolvedRequestedTab);
  }, [resolvedRequestedTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY)) {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, '/');
    }
  }, []);

  useEffect(() => {
    if (!detail) {
      return;
    }

    writeFixturePageSidebarContext({
      fixtureId: detail.fixture.apiFixtureId,
      leagueId: detail.fixture.leagueApiId,
      season: detail.fixture.season,
      leagueName: detail.fixture.leagueName,
    });
  }, [detail]);

  const handleBackToMatches = () => {
    if (typeof window === 'undefined') {
      router.push('/');
      return;
    }

    const savedHref = window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY);
    if (savedHref === '/' || savedHref?.startsWith('/?') || savedHref?.startsWith('/football')) {
      router.push(savedHref);
      return;
    }

    router.push('/');
  };

  const handleTeamSelect = (team: SelectedFixtureTeam) => {
    writeTeamPageNavigationContext({
      teamId: team.apiTeamId,
      leagueId: detail?.fixture.leagueApiId ?? null,
      season: detail?.fixture.season ?? null,
      fromFixtureId: detail?.fixture.apiFixtureId ?? null,
    });
    router.push(buildTeamPath(team.apiTeamId, team.name));
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
      ? 'The server is warming up (first load on free tier). Click Retry - it will connect on the next attempt.'
      : detailError?.status === 404
        ? 'This fixture may not exist or the data is unavailable.'
        : 'The fixture detail endpoint is currently slow or unavailable. Try again in a moment.';

    return (
      <EmptyState
        title={title}
        description={description}
        action={(
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
        )}
      />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'odds', label: 'Odds' },
    { id: 'match', label: 'Match' },
    { id: 'h2h', label: 'H2H' },
  ];
  const leagueHref = `/?leagueId=${detail.fixture.leagueApiId}&season=${detail.fixture.season}`;
  const standingsHref = buildStandingsPath(
    detail.fixture.leagueApiId,
    detail.fixture.season,
    detail.fixture.leagueName,
  );

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-1 text-[11px]"
          style={{ color: 'var(--t-text-5)' }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Football
          </Link>
          <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
          <Link href={standingsHref} style={{ color: 'inherit', textDecoration: 'none' }}>
            {detail.fixture.leagueName}
          </Link>
          <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
          <span style={{ color: 'var(--t-text-4)' }}>
            {detail.fixture.homeTeamName} vs {detail.fixture.awayTeamName}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBackToMatches}
            className="inline-flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-[12px] font-medium transition-colors bg-transparent cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08]"
            style={{ color: 'var(--t-text-3)' }}
          >
            <span aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>
              {'<'}
            </span>
            <span>Matches</span>
          </button>

          <Link
            href={leagueHref}
            className="inline-flex items-center rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/[0.04] hover:border-white/[0.1]"
            style={{
              color: 'var(--t-text-4)',
              textDecoration: 'none',
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
            }}
          >
            {detail.fixture.countryName} / {detail.fixture.leagueName}
          </Link>
        </div>
      </div>

      <FixtureDetailHeader
        detail={detail}
        onTeamSelect={handleTeamSelect}
        quickStats={quickStatsSummary}
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
      </div>

      <div className="p-4">
        {tab === 'match' && (
          <WidgetCard>
            <ApiSportsWidget
              type="game"
              gameId={detail.fixture.apiFixtureId}
              refresh={isLive ? 150 : undefined}
            />
          </WidgetCard>
        )}

        {tab === 'h2h' && (
          <WidgetCard>
            <ApiSportsWidget
              type="h2h"
              h2h={`${detail.fixture.homeTeamApiId}-${detail.fixture.awayTeamApiId}`}
              className="widget-wrap--match-page-h2h"
            />
          </WidgetCard>
        )}

        {tab === 'odds' &&
          (isLiveOddsPending ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    background: 'var(--t-surface-2)',
                    animation: 'skeleton-pulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : hasAnyOdds ? (
            <OddsComparison
              bestOdds={resolvedBestOdds ?? null}
              odds={displayOdds}
              fixtureId={detail.fixture.apiFixtureId}
              isLive={isLive}
              liveOddsRealtimeStatus={liveOddsRealtimeStatus}
              hasLiveOdds={hasLiveOdds}
              usingPreMatchFallback={usingPreMatchFallback}
              shouldUseLiveBookmakerView={shouldUseLiveBookmakerView}
              bestOddsMovements={isLive ? bestOddsMovements : undefined}
              oddsMovements={isLive ? oddsTableMovements : undefined}
            />
          ) : (
            <EmptyState title="No odds available" description="No bookmaker odds are available for this fixture." />
          ))}
      </div>
    </div>
  );
}

export default function FixtureDetailPageClient({ params }: Props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FixtureDetailPageInner params={params} />
    </Suspense>
  );
}
