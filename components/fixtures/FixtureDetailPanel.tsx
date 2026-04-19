'use client';

import { useMemo, useState } from 'react';
import { useFixtureOddsData } from '@/lib/hooks/useFixtureOddsData';
import { useFixtureCorners } from '@/lib/hooks/useFixtureCorners';
import { useFixtureStatistics } from '@/lib/hooks/useFixtureStatistics';
import { extractFixtureQuickStatsSummary } from '@/lib/fixture-statistics';
import { FixtureDetailHeader } from '@/components/fixtures/FixtureDetailHeader';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { OddsComparison } from '@/components/odds/OddsComparison';

type PanelTab = 'odds' | 'match' | 'h2h';

interface Props {
  fixtureId: number;
  onClose: () => void;
}

export function FixtureDetailPanel({ fixtureId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('odds');
  const fixtureIdStr = String(fixtureId);
  const stickyOffsetPx = 60;

  const {
    detail,
    isLoading,
    isError,
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
  } = useFixtureOddsData(fixtureIdStr, activeTab === 'odds');

  const cornersQuery = useFixtureCorners(fixtureIdStr, {
    enabled: Boolean(detail),
    refetchInterval: isLive ? 60_000 : false,
  });
  const statisticsQuery = useFixtureStatistics(fixtureIdStr, {
    enabled: Boolean(detail),
    refetchInterval: isLive ? 60_000 : false,
  });

  const cornersSummary = cornersQuery.data;
  const quickStatsSummary = useMemo(
    () =>
      detail
        ? extractFixtureQuickStatsSummary(
            statisticsQuery.data,
            detail.fixture,
            cornersSummary,
          )
        : null,
    [cornersSummary, detail, statisticsQuery.data],
  );

  const tabs: { id: PanelTab; label: string }[] = [
    { id: 'odds', label: 'Odds' },
    { id: 'match', label: 'Match' },
    { id: 'h2h', label: 'H2H' },
  ];

  return (
    <div
      className="hidden md:flex md:flex-col"
      style={{
        width: 380,
        flexShrink: 0,
        alignSelf: 'flex-start',
        position: 'sticky',
        top: stickyOffsetPx,
        height: `calc(100vh - ${stickyOffsetPx}px)`,
        maxHeight: `calc(100vh - ${stickyOffsetPx}px)`,
        borderLeft: '1px solid var(--t-border)',
        background: 'var(--t-sidebar-bg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px 6px 12px',
          flexShrink: 0,
          borderBottom: '1px solid var(--t-border)',
          gap: 8,
        }}
      >
        {detail ? (
          <a
            href={`/football/fixtures/${detail.fixture.apiFixtureId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--t-accent)',
              textDecoration: 'none',
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid rgba(0,230,118,0.28)',
              background: 'rgba(0,230,118,0.1)',
            }}
          >
            Match page →
          </a>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--t-text-4)',
            fontSize: 16,
            padding: '2px 6px',
            lineHeight: 1,
          }}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {detail ? (
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--t-border)' }}>
          <FixtureDetailHeader detail={detail} quickStats={quickStatsSummary} />
        </div>
      ) : isLoading ? (
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--t-text-5)',
            fontSize: 12,
            flexShrink: 0,
            borderBottom: '1px solid var(--t-border)',
          }}
        >
          Loading...
        </div>
      ) : isError ? (
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fca5a5',
            fontSize: 12,
            flexShrink: 0,
            borderBottom: '1px solid var(--t-border)',
          }}
        >
          Failed to load fixture
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--t-border)',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--t-accent)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--t-accent)' : 'var(--t-text-4)',
              transition: 'color 0.12s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'odds' ? (
          <div style={{ padding: 12 }}>
            {isLoading || isLiveOddsPending ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
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
            ) : hasAnyOdds && detail ? (
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
                hidePreMatchFallbackPill
                hideLiveStatusPill
              />
            ) : (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
                No odds available for this fixture.
              </div>
            )}
          </div>
        ) : activeTab === 'match' ? (
          detail ? (
            <div style={{ padding: 12 }}>
              <div
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                }}
              >
                <ApiSportsWidget
                  type="game"
                  gameId={detail.fixture.apiFixtureId}
                  refresh={isLive ? 120 : undefined}
                  compactPlayerDetails
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
              {isLoading ? 'Loading...' : 'No data'}
            </div>
          )
        ) : activeTab === 'h2h' ? (
          detail ? (
            <div style={{ padding: 12 }}>
              <div
                style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                }}
              >
                <ApiSportsWidget
                  type="h2h"
                  h2h={`${detail.fixture.homeTeamApiId}-${detail.fixture.awayTeamApiId}`}
                  className="widget-wrap--panel-default-h2h"
                />
              </div>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
              {isLoading ? 'Loading...' : 'No data'}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
