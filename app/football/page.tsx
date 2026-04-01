'use client';
import { useState } from 'react';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import type { StateBucket } from '@/lib/types/api';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

type ViewMode = 'table' | 'widget';

export default function FootballPage() {
  const [date, setDate] = useState(todayISO());
  const [state, setState] = useState<StateBucket | 'All'>('All');
  const [view, setView] = useState<ViewMode>('table');

  const filters = {
    date,
    state: state === 'All' ? undefined : state,
    season: Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025'),
    pageSize: 100,
  };

  const { data, isLoading, isError, refetch } = useFixtures(filters);

  return (
    <div className="flex flex-col h-full">
      <SyncFreshnessBanner />
      <FixtureFilters
        state={state}
        onStateChange={setState}
        date={date}
        onDateChange={setDate}
      />

      {/* View toggle */}
      <div
        className="flex items-center gap-1 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
      >
        {(['table', 'widget'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1 rounded text-[11px] font-medium transition-colors"
            style={{
              background: view === v ? 'rgba(0,230,118,0.12)' : 'transparent',
              color: view === v ? 'var(--t-accent)' : 'var(--t-text-4)',
              border: view === v ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent',
            }}
          >
            {v === 'table' ? 'Table View' : 'Live Scores Widget'}
          </button>
        ))}
      </div>

      {view === 'widget' ? (
        <div className="flex-1 overflow-auto p-4">
          {/* Livescore widget — refreshes every 5 min to stay within API limits */}
          <ApiSportsWidget
            type="livescore"
            refresh={300}
            date={date}
          />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-400 mb-3">Failed to load fixtures.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/40 rounded text-sm hover:bg-accent/30"
          >
            Retry
          </button>
        </div>
      ) : (
        <FixtureTable fixtures={data?.items ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}
