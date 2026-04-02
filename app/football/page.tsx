'use client';
import { useState } from 'react';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
import type { StateBucket } from '@/lib/types/api';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export default function FootballPage() {
  const [date, setDate] = useState(todayISO());
  const [state, setState] = useState<StateBucket | 'All'>('All');

  const filters = {
    date,
    state: state === 'All' ? undefined : state,
    season: DEFAULT_SEASON,
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

      {isError ? (
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
