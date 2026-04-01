'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function StandingsContent() {
  const searchParams = useSearchParams();
  const initialLeagueId = searchParams.get('leagueId') ? Number(searchParams.get('leagueId')) : null;
  const initialSeason   = searchParams.get('season') ? Number(searchParams.get('season')) : DEFAULT_SEASON;

  const [leagueId, setLeagueId] = useState<number | null>(initialLeagueId);
  const [season, setSeason]     = useState(initialSeason);

  const { data: leagues, isLoading: leaguesLoading } = useLeagues(season);
  const selectedLeague = leagues?.find(l => l.apiLeagueId === leagueId);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-wrap"
        style={{ borderBottom: '1px solid var(--t-border)' }}
      >
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--t-text-1)' }}>Standings</h1>

        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="text-[12px] rounded px-3 py-1.5 outline-none"
          style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
        >
          {[2025, 2024, 2023].map((s) => <option key={s} value={s}>{s}/{s + 1}</option>)}
        </select>

        <select
          value={leagueId ?? ''}
          onChange={(e) => setLeagueId(e.target.value ? Number(e.target.value) : null)}
          disabled={leaguesLoading}
          className="text-[12px] rounded px-3 py-1.5 outline-none min-w-[240px]"
          style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
        >
          <option value="">Select a league…</option>
          {leagues?.map((l) => (
            <option key={`${l.apiLeagueId}-${l.season}`} value={l.apiLeagueId}>
              {l.countryName} — {l.name}
            </option>
          ))}
        </select>

        {selectedLeague && (
          <span className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            {selectedLeague.countryName} · {selectedLeague.name} · {selectedLeague.season}
          </span>
        )}
      </div>

      {/* Widget area */}
      <div className="flex-1 overflow-auto p-5">
        {!leagueId ? (
          <EmptyState title="Select a league" description="Choose a league from the dropdown above to view standings." />
        ) : (
          /* Standings are historical — no auto-refresh needed */
          <ApiSportsWidget
            key={`${leagueId}-${season}`}
            type="standings"
            league={leagueId}
            season={season}
          />
        )}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StandingsContent />
    </Suspense>
  );
}
