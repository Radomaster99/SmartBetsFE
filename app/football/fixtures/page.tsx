'use client';
import { useState } from 'react';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
import type { StateBucket } from '@/lib/types/api';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function FixturesPage() {
  const [date, setDate] = useState(todayISO());
  const [state, setState] = useState<StateBucket | 'All'>('All');

  const { data, isLoading, isError, refetch } = useFixtures({
    date,
    state: state === 'All' ? undefined : state,
    pageSize: 100,
  });

  return (
    <div className="flex flex-col h-full">
      <SyncFreshnessBanner />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold" style={{ color: 'var(--t-text-1)' }}>Fixtures</h1>
      </div>
      <FixtureFilters state={state} onStateChange={setState} date={date} onDateChange={setDate} />
      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-400 mb-3">Failed to load fixtures.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-accent/20 text-accent border border-accent/40 rounded text-sm">Retry</button>
        </div>
      ) : (
        <FixtureTable fixtures={data?.items ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}
