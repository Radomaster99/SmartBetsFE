'use client';

import { useState } from 'react';
import { useFixtureOddsData } from '@/lib/hooks/useFixtureOddsData';
import { useFixtureCorners } from '@/lib/hooks/useFixtureCorners';
import { FixtureDetailHeader } from '@/components/fixtures/FixtureDetailHeader';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { OddsComparison } from '@/components/odds/OddsComparison';

type PanelTab = 'odds' | 'match' | 'h2h';

interface Props {
  fixtureId: number;
  onClose: () => void;
}

function CornersStrip({
  homeCorners,
  awayCorners,
  totalCorners,
  isLoading,
  syncedAtUtc,
}: {
  homeCorners: number | null;
  awayCorners: number | null;
  totalCorners: number | null;
  isLoading: boolean;
  syncedAtUtc?: string | null;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderBottom: '1px solid var(--t-border)',
        background: 'linear-gradient(180deg, rgba(0,230,118,0.05), rgba(0,230,118,0.02))',
      }}
    >
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--t-text-5)',
          }}
        >
          Home corners
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-text-1)' }}>
          {isLoading ? '...' : (homeCorners ?? '-')}
        </div>
      </div>

      <div
        style={{
          minWidth: 88,
          textAlign: 'center',
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid rgba(0,230,118,0.18)',
          background: 'rgba(0,230,118,0.08)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(0,230,118,0.72)',
          }}
        >
          Corners
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-2)' }}>
          {isLoading ? 'Syncing...' : totalCorners != null ? `Total ${totalCorners}` : 'Live stats'}
        </div>
        {!isLoading && syncedAtUtc ? (
          <div style={{ marginTop: 2, fontSize: 10, color: 'var(--t-text-5)' }}>
            {new Date(syncedAtUtc).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        ) : null}
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--t-text-5)',
          }}
        >
          Away corners
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t-text-1)' }}>
          {isLoading ? '...' : (awayCorners ?? '-')}
        </div>
      </div>
    </div>
  );
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
  } = useFixtureOddsData(fixtureIdStr, activeTab === 'odds');

  const cornersQuery = useFixtureCorners(fixtureIdStr, {
    enabled: Boolean(detail),
    refetchInterval: isLive ? 60_000 : false,
  });

  const cornersSummary = cornersQuery.data;
  const shouldShowCornersStrip = Boolean(
    detail &&
      ((cornersSummary?.hasData ?? false) ||
        (isLive && (cornersQuery.isLoading || cornersQuery.isFetching))),
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

      {shouldShowCornersStrip && cornersSummary?.hasData ? (
        <div style={{ flexShrink: 0 }}>
          <CornersStrip
            homeCorners={cornersSummary.home?.corners ?? null}
            awayCorners={cornersSummary.away?.corners ?? null}
            totalCorners={cornersSummary.totalCorners}
            syncedAtUtc={cornersSummary.syncedAtUtc}
            isLoading={false}
          />
        </div>
      ) : shouldShowCornersStrip ? (
        <div style={{ flexShrink: 0 }}>
          <CornersStrip
            homeCorners={null}
            awayCorners={null}
            totalCorners={null}
            isLoading
          />
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
            {isLoading ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
                Loading odds...
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
