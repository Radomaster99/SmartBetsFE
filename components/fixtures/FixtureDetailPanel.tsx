'use client';

import { useState } from 'react';
import { useFixtureOddsData } from '@/lib/hooks/useFixtureOddsData';
import { FixtureDetailHeader } from '@/components/fixtures/FixtureDetailHeader';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { OddsTable } from '@/components/odds/OddsTable';
import { type LiveOddsRealtimeStatus } from '@/lib/hooks/useLiveOdds';

type PanelTab = 'odds' | 'match' | 'h2h';

function LiveStatusPill({
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
    copy = 'Pre-match fallback';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (hasLiveOdds && status === 'connected') {
    copy = 'Live odds';
    styles = {
      background: 'rgba(0,230,118,0.12)',
      border: '1px solid rgba(0,230,118,0.28)',
      color: 'var(--t-accent)',
    };
  } else if (hasLiveOdds && (status === 'connecting' || status === 'reconnecting')) {
    copy = 'Syncing…';
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
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        padding: '3px 8px',
        fontSize: 10,
        fontWeight: 600,
        ...styles,
      }}
    >
      {hasLiveOdds && status === 'connected' && !usingPreMatchFallback && (
        <span
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--t-accent)',
            animation: 'live-pulse 1.4s ease-in-out infinite',
          }}
        />
      )}
      {copy}
    </div>
  );
}

interface Props {
  fixtureId: number;
  onClose: () => void;
}

export function FixtureDetailPanel({ fixtureId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('odds');
  const fixtureIdStr = String(fixtureId);

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
    liveOddsRealtimeStatus,
    bestOddsMovements,
    oddsTableMovements,
    headerOddsLabel,
  } = useFixtureOddsData(fixtureIdStr, activeTab === 'odds');

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
        borderLeft: '1px solid var(--t-border)',
        background: 'var(--t-sidebar-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Panel header: close + open full page */}
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
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--t-text-4)',
              textDecoration: 'none',
              padding: '3px 6px',
              borderRadius: 5,
              border: '1px solid var(--t-border)',
              background: 'var(--t-surface-2)',
            }}
          >
            Open full page
            <span style={{ fontSize: 10 }}>↗</span>
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

      {/* Fixture header */}
      {detail ? (
        <div style={{ flexShrink: 0, borderBottom: '1px solid var(--t-border)' }}>
          <FixtureDetailHeader detail={detail} />
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

      {/* Tab bar */}
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
        {activeTab === 'odds' && headerOddsLabel ? (
          <span
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              paddingRight: 8,
              fontSize: 9,
              color: 'var(--t-text-5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120,
            }}
          >
            {headerOddsLabel}
          </span>
        ) : null}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'odds' ? (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isLoading ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
                Loading odds…
              </div>
            ) : hasAnyOdds ? (
              <>
                {isLive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <LiveStatusPill
                      status={liveOddsRealtimeStatus}
                      hasLiveOdds={hasLiveOdds}
                      usingPreMatchFallback={usingPreMatchFallback}
                    />
                    {usingPreMatchFallback ? (
                      <div
                        style={{
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 10,
                          background: 'rgba(245,158,11,0.1)',
                          border: '1px solid rgba(245,158,11,0.24)',
                          color: '#fbbf24',
                        }}
                      >
                        Live odds not yet available. Showing latest pre-match prices.
                      </div>
                    ) : null}
                    {liveOddsRealtimeStatus === 'connected' && shouldUseLiveBookmakerView ? (
                      <div
                        style={{
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--t-border)',
                          color: 'var(--t-text-4)',
                        }}
                      >
                        Live prices flash as the provider updates the market.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {resolvedBestOdds && detail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'var(--t-text-5)',
                      }}
                    >
                      Best odds
                    </span>
                    <BestOddsBar
                      bestOdds={resolvedBestOdds}
                      fixtureId={detail.fixture.apiFixtureId}
                      movements={isLive ? bestOddsMovements : undefined}
                    />
                  </div>
                ) : null}

                {displayOdds.length > 0 && detail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'var(--t-text-5)',
                      }}
                    >
                      All bookmakers
                    </span>
                    <OddsTable
                      odds={displayOdds}
                      fixtureId={detail.fixture.apiFixtureId}
                      movements={isLive ? oddsTableMovements : undefined}
                    />
                  </div>
                ) : null}
              </>
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
                  gameTab="events"
                  refresh={isLive ? 120 : undefined}
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
