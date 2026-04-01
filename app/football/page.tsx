'use client';
import { useEffect, useState } from 'react';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { FixtureFilters } from '@/components/fixtures/FixtureFilters';
import { FixtureTable } from '@/components/fixtures/FixtureTable';
import { SyncFreshnessBanner } from '@/components/shared/SyncFreshnessBanner';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { StateBucket } from '@/lib/types/api';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

type ViewMode = 'table' | 'widget';
const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export default function FootballPage() {
  const [date, setDate] = useState(todayISO());
  const [state, setState] = useState<StateBucket | 'All'>('All');
  const [view, setView] = useState<ViewMode>('table');
  const [widgetSeason, setWidgetSeason] = useState(DEFAULT_SEASON);
  const [widgetLeagueId, setWidgetLeagueId] = useState<number | null>(null);

  const filters = {
    date,
    state: state === 'All' ? undefined : state,
    season: DEFAULT_SEASON,
    pageSize: 100,
  };

  const { data, isLoading, isError, refetch } = useFixtures(filters);
  const { data: leagues, isLoading: leaguesLoading } = useLeagues(widgetSeason);
  const selectedLeague = leagues?.find((league) => league.apiLeagueId === widgetLeagueId);

  useEffect(() => {
    if (!leagues?.length) {
      setWidgetLeagueId(null);
      return;
    }

    setWidgetLeagueId((current) => {
      if (current && leagues.some((league) => league.apiLeagueId === current)) {
        return current;
      }

      return leagues[0]?.apiLeagueId ?? null;
    });
  }, [leagues]);

  return (
    <div className="flex flex-col h-full">
      <SyncFreshnessBanner />

      {view === 'table' ? (
        <FixtureFilters
          state={state}
          onStateChange={setState}
          date={date}
          onDateChange={setDate}
        />
      ) : null}

      <div
        className="flex items-center gap-1 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
      >
        {(['table', 'widget'] as ViewMode[]).map((currentView) => (
          <button
            key={currentView}
            onClick={() => setView(currentView)}
            className="px-3 py-1 rounded text-[11px] font-medium transition-colors"
            style={{
              background: view === currentView ? 'rgba(0,230,118,0.12)' : 'transparent',
              color: view === currentView ? 'var(--t-accent)' : 'var(--t-text-4)',
              border: view === currentView ? '1px solid rgba(0,230,118,0.3)' : '1px solid transparent',
            }}
          >
            {currentView === 'table' ? 'Table View' : 'League Widget'}
          </button>
        ))}
      </div>

      {view === 'widget' ? (
        <div className="flex-1 overflow-auto p-4">
          <div
            className="mb-4 flex items-center gap-3 flex-wrap"
            style={{
              border: '1px solid var(--t-border)',
              background: 'var(--t-surface)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <span className="text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
              League Season Widget
            </span>

            <select
              value={widgetSeason}
              onChange={(e) => setWidgetSeason(Number(e.target.value))}
              className="text-[12px] rounded px-3 py-1.5 outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            >
              {[2025, 2024, 2023].map((season) => (
                <option key={season} value={season}>
                  {season}/{season + 1}
                </option>
              ))}
            </select>

            <select
              value={widgetLeagueId ?? ''}
              onChange={(e) => setWidgetLeagueId(e.target.value ? Number(e.target.value) : null)}
              disabled={leaguesLoading}
              className="text-[12px] rounded px-3 py-1.5 outline-none min-w-[260px]"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            >
              <option value="">{leaguesLoading ? 'Loading leagues...' : 'Select a league...'}</option>
              {leagues?.map((league) => (
                <option key={`${league.apiLeagueId}-${league.season}`} value={league.apiLeagueId}>
                  {league.countryName} - {league.name}
                </option>
              ))}
            </select>

            {selectedLeague ? (
              <span className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
                {selectedLeague.countryName} - {selectedLeague.name} - {widgetSeason}
              </span>
            ) : null}
          </div>

          {leaguesLoading ? (
            <LoadingSpinner />
          ) : !widgetLeagueId ? (
            <EmptyState
              title="Select a league"
              description="Choose a league and season to show only those matches in the widget."
            />
          ) : (
            <ApiSportsWidget
              key={`${widgetLeagueId}-${widgetSeason}`}
              type="league"
              league={widgetLeagueId}
              season={widgetSeason}
              refresh={300}
            />
          )}
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
