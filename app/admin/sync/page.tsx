'use client';

import { useState, type ReactNode } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function freshnessColor(ts: string | null): string {
  if (!ts) return '#ef5350';
  const age = Date.now() - new Date(ts).getTime();
  if (age < 60 * 60 * 1000) return '#00e676';
  if (age < 6 * 60 * 60 * 1000) return '#f59e0b';
  return '#ef5350';
}

function fmtTs(ts: string | null): string {
  if (!ts) return '-';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>
      {children}
    </h2>
  );
}

function SectionDesc({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
      {children}
    </p>
  );
}

type ActionBtn = {
  id: string;
  label: string;
  runningLabel: string;
  accent?: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

function ActionButton({ btn, loading }: { btn: ActionBtn; loading: string | null }) {
  const isRunning = loading === btn.id;
  const isDisabled = Boolean(loading) || btn.disabled;

  return (
    <button
      type="button"
      title={isDisabled && btn.disabledReason && !loading ? btn.disabledReason : undefined}
      onClick={btn.onClick}
      disabled={isDisabled}
      className="rounded px-3 py-1.5 text-[12px] font-bold transition-all disabled:opacity-40"
      style={
        btn.accent
          ? { background: 'rgba(0,230,118,0.13)', color: '#00e676', border: '1px solid rgba(0,230,118,0.28)' }
          : { background: 'var(--t-surface-2)', color: 'var(--t-text-2)', border: '1px solid var(--t-border-2)' }
      }
    >
      {isRunning ? btn.runningLabel : btn.label}
    </button>
  );
}

export default function AdminSyncPage() {
  const [season, setSeason] = useState(DEFAULT_SEASON);
  const [syncLeagueId, setSyncLeagueId] = useState('');
  const [syncSeason, setSyncSeason] = useState(String(DEFAULT_SEASON));
  const [includeOdds, setIncludeOdds] = useState(false);
  const [forceSync, setForceSync] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ action: string; ok: boolean; message: string } | null>(null);

  const { data: status, isLoading: statusLoading, refetch } = useSyncStatus(season);

  async function runAction(action: string, url: string) {
    setLoading(action);
    setResult(null);

    try {
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      setResult({
        action,
        ok: res.ok,
        message: res.ok
          ? JSON.stringify(json, null, 2)
          : `Error ${res.status}: ${json.error ?? 'Unknown error'}`,
      });
      if (res.ok) refetch();
    } catch (e) {
      setResult({ action, ok: false, message: String(e) });
    } finally {
      setLoading(null);
    }
  }

  const syncLeagues = Array.isArray(status?.leagues) ? status.leagues : [];
  const globalStates = Array.isArray(status?.global) ? status.global : [];
  const countriesState = globalStates.find((g) => g.entityType === 'countries');
  const leaguesState = globalStates.find((g) => g.entityType === 'leagues');
  const liveBetTypesState = globalStates.find((g) => g.entityType === 'live_bet_types');

  function buildCoreDataUrl() {
    const params = new URLSearchParams();
    if (includeOdds) params.set('includeOdds', 'true');
    if (forceSync) params.set('force', 'true');
    const query = params.toString();
    return `/api/preload/run${query ? `?${query}` : ''}`;
  }

  const hasLeague = Boolean(syncLeagueId);
  const hasLeagueAndSeason = Boolean(syncLeagueId && syncSeason);

  const perLeagueButtons: ActionBtn[] = [
    {
      id: 'upcoming',
      label: 'Sync Upcoming Fixtures',
      runningLabel: 'Syncing...',
      onClick: () => runAction('upcoming', `/api/fixtures/sync-upcoming?leagueId=${syncLeagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league and season',
    },
    {
      id: 'fixtures-full',
      label: 'Sync Full Fixtures',
      runningLabel: 'Syncing...',
      onClick: () => runAction('fixtures-full', `/api/fixtures/sync?leagueId=${syncLeagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league and season',
    },
    {
      id: 'odds',
      label: 'Sync Pre-match Odds',
      runningLabel: 'Syncing...',
      onClick: () => runAction('odds', `/api/odds/sync?leagueId=${syncLeagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league and season',
    },
    {
      id: 'live-odds',
      label: 'Sync Live Odds',
      runningLabel: 'Syncing...',
      accent: true,
      onClick: () => runAction('live-odds', `/api/odds/live/sync?leagueId=${syncLeagueId}`),
      disabled: !hasLeague,
      disabledReason: 'Select a league',
    },
  ];

  return (
    <div className="max-w-5xl p-5">
      <div className="mb-5">
        <h1 className="mb-0.5 text-[18px] font-bold" style={{ color: 'var(--t-text-1)' }}>
          Sync Control Panel
        </h1>
        <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
          Manually trigger backend syncs and monitor data freshness.
        </p>
      </div>

      <div className="mb-4 rounded-lg p-4" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        <SectionTitle>Core Data</SectionTitle>
        <SectionDesc>
          Bootstraps active league-seasons: countries, leagues, bookmaker catalog, teams, and full fixtures. Pre-match odds
          are excluded by default and live odds are handled separately.
        </SectionDesc>

        <div className="mb-3 flex flex-wrap gap-5">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
            <input
              type="checkbox"
              checked={includeOdds}
              onChange={(e) => setIncludeOdds(e.target.checked)}
              className="accent-green-400"
            />
            Include pre-match odds
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
            <input
              type="checkbox"
              checked={forceSync}
              onChange={(e) => setForceSync(e.target.checked)}
              className="accent-green-400"
            />
            Force refresh
          </label>
        </div>

        <button
          type="button"
          onClick={() => runAction('core-data', buildCoreDataUrl())}
          disabled={Boolean(loading)}
          className="rounded px-4 py-2 text-[12px] font-bold transition-all disabled:opacity-40"
          style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}
        >
          {loading === 'core-data' ? 'Running...' : 'Sync Core Data'}
        </button>
      </div>

      <div className="mb-4 rounded-lg p-4" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        <SectionTitle>Per-League</SectionTitle>
        <SectionDesc>
          Target a specific league and season. Upcoming fixtures, full fixtures, and pre-match odds require both. Live odds
          only requires a league.
        </SectionDesc>

        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              League
            </label>
            <select
              value={syncLeagueId}
              onChange={(e) => setSyncLeagueId(e.target.value)}
              className="min-w-[220px] rounded px-3 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            >
              <option value="">- select a league -</option>
              {syncLeagues.map((league) => (
                <option key={league.leagueApiId} value={String(league.leagueApiId)}>
                  {league.countryName} - {league.leagueName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Season
            </label>
            <input
              type="number"
              value={syncSeason}
              onChange={(e) => setSyncSeason(e.target.value)}
              className="w-24 rounded px-3 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {perLeagueButtons.map((btn) => (
            <ActionButton key={btn.id} btn={btn} loading={loading} />
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-lg p-4" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        <SectionTitle>Reference Data</SectionTitle>
        <SectionDesc>
          Live bet type IDs from the provider. Required before filtering live odds by bet type. Use this if live-odds sync is
          enabled but bet IDs have not been populated yet.
        </SectionDesc>
        <button
          type="button"
          onClick={() => runAction('live-bets', '/api/odds/live-bets/sync')}
          disabled={Boolean(loading)}
          className="rounded px-3 py-1.5 text-[12px] font-bold transition-all disabled:opacity-40"
          style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-2)', border: '1px solid var(--t-border-2)' }}
        >
          {loading === 'live-bets' ? 'Syncing...' : 'Sync Live Bet Types'}
        </button>
      </div>

      {result && (
        <div
          className="mb-5 rounded p-3 font-mono text-[12px]"
          style={{
            background: result.ok ? 'rgba(0,230,118,0.06)' : 'rgba(239,83,80,0.06)',
            border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(239,83,80,0.2)'}`,
            color: result.ok ? '#00e676' : '#fca5a5',
          }}
        >
          <div className="mb-1 font-bold">
            {result.ok ? 'OK' : 'ERR'} {result.action}
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[11px]">{result.message}</pre>
        </div>
      )}

      {status && (
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Countries', ts: countriesState?.lastSyncedAtUtc ?? null },
            { label: 'Leagues', ts: leaguesState?.lastSyncedAtUtc ?? null },
            { label: 'Live Bet Types', ts: liveBetTypesState?.lastSyncedAtUtc ?? null },
            { label: 'Status At', ts: status.generatedAtUtc },
          ].map(({ label, ts }) => (
            <div key={label} className="rounded p-3" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
                {label}
              </div>
              <div className="text-[13px] font-semibold" style={{ color: freshnessColor(ts) }}>
                {fmtTs(ts)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--t-border)' }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}
        >
          <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>
            League Sync Status
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded px-2 py-1 text-[11px] outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-3)' }}
            >
              {[2025, 2024, 2023].map((year) => (
                <option key={year} value={year}>
                  {year}/{year + 1}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => refetch()} className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Refresh
            </button>
          </div>
        </div>

        {statusLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: 'var(--t-page-bg)', borderBottom: '1px solid var(--t-border)' }}>
                  {['League', 'Country', 'Teams', 'Fix Upcoming', 'Fix Full', 'Standings', 'Pre-match Odds', 'Bookmakers', 'Live Odds'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--t-text-6)' }}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {syncLeagues.map((league) => (
                  <tr key={`${league.leagueApiId}-${league.season}`} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td className="px-3 py-2">
                      <span style={{ color: 'var(--t-text-2)' }}>{league.leagueName}</span>
                      {league.isActive && (
                        <span
                          className="ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676' }}
                        >
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--t-text-4)' }}>
                      {league.countryName}
                    </td>
                    {[
                      league.teamsLastSyncedAtUtc,
                      league.fixturesUpcomingLastSyncedAtUtc,
                      league.fixturesFullLastSyncedAtUtc,
                      league.standingsLastSyncedAtUtc,
                      league.oddsLastSyncedAtUtc,
                      league.bookmakersLastSyncedAtUtc,
                      league.liveOddsLastSyncedAtUtc ?? null,
                    ].map((ts, index) => (
                      <td key={index} className="px-3 py-2 font-mono" style={{ color: freshnessColor(ts) }}>
                        {fmtTs(ts)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
