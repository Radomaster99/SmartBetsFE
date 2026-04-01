'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useOdds, useBestOdds } from '@/lib/hooks/useOdds';
import { FixtureDetailHeader } from '@/components/fixtures/FixtureDetailHeader';
import { OddsTable } from '@/components/odds/OddsTable';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

type Tab = 'best' | 'odds' | 'match' | 'h2h';

interface Props {
  params: Promise<{ fixtureId: string }>;
}

export default function FixtureDetailPage({ params }: Props) {
  const { fixtureId } = use(params);
  const [tab, setTab] = useState<Tab>('match');

  const { data: detail, isLoading, isError } = useFixtureDetail(fixtureId);
  const { data: odds }     = useOdds(fixtureId);
  const { data: bestOdds } = useBestOdds(fixtureId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !detail) {
    return (
      <EmptyState
        title="Fixture not found"
        description="This fixture may not exist or the data is unavailable."
        action={
          <Link href="/football" className="mt-2 inline-flex items-center px-4 py-2 rounded text-[12px] font-medium" style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}>
            ← Back to fixtures
          </Link>
        }
      />
    );
  }

  const isLive = detail.fixture.stateBucket === 'Live';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'match', label: 'Match' },
    { id: 'h2h',   label: 'Head to Head' },
    { id: 'best',  label: 'Best Odds' },
    { id: 'odds',  label: 'All Bookmakers' },
  ];

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <Link href="/football" className="flex items-center gap-1 text-[11px] transition-colors" style={{ color: 'var(--t-text-5)' }}>
          ← Fixtures
        </Link>
      </div>

      <FixtureDetailHeader detail={detail} />

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-topbar-bg)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-5 py-3 text-[13px] font-medium transition-colors"
            style={{
              color: tab === t.id ? 'var(--t-text-1)' : 'var(--t-text-4)',
              borderBottom: tab === t.id ? '2px solid var(--t-accent)' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'match' && (
          /* game widget: refresh every 2 min if live, no refresh if finished */
          <ApiSportsWidget
            type="game"
            id={detail.fixture.apiFixtureId}
            refresh={isLive ? 120 : undefined}
          />
        )}

        {tab === 'h2h' && (
          /* H2H is historical — no auto-refresh needed */
          <ApiSportsWidget
            type="h2h"
            home={detail.fixture.homeTeamApiId}
            away={detail.fixture.awayTeamApiId}
          />
        )}

        {tab === 'best' && (
          detail.bestOdds || bestOdds ? (
            <BestOddsBar bestOdds={(detail.bestOdds ?? bestOdds)!} />
          ) : (
            <EmptyState title="No odds available" description="Best odds data is not available for this fixture." />
          )
        )}

        {tab === 'odds' && <OddsTable odds={odds ?? []} />}
      </div>
    </div>
  );
}
