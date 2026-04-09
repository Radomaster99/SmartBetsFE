'use client';

import { useState } from 'react';
import { useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useOdds, useBestOdds } from '@/lib/hooks/useOdds';
import { FixtureDetailHeader } from '@/components/fixtures/FixtureDetailHeader';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { OddsTable } from '@/components/odds/OddsTable';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';

type PanelTab = 'odds' | 'match' | 'h2h';

interface Props {
  fixtureId: number;
  onClose: () => void;
}

export function FixtureDetailPanel({ fixtureId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>('odds');
  const fixtureIdStr = String(fixtureId);

  const { data: detail, isLoading, isError } = useFixtureDetail(fixtureIdStr);
  const { data: odds = [] } = useOdds(fixtureIdStr);
  const { data: bestOdds } = useBestOdds(fixtureIdStr);

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
      {/* Panel close button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 12px 4px',
          flexShrink: 0,
          borderBottom: '1px solid var(--t-border)',
        }}
      >
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
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'odds' ? (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bestOdds ? (
              <BestOddsBar bestOdds={bestOdds} fixtureId={fixtureId} />
            ) : null}
            {odds.length > 0 ? (
              <OddsTable odds={odds} fixtureId={fixtureId} />
            ) : !bestOdds && !isLoading ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--t-text-5)',
                  fontSize: 12,
                }}
              >
                No odds available for this fixture.
              </div>
            ) : null}
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
