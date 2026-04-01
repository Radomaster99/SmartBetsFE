'use client';
import { useState } from 'react';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function freshnessColor(ts: string | null): string {
  if (!ts) return '#ef5350';
  const age = Date.now() - new Date(ts).getTime();
  if (age < 60 * 60 * 1000)     return '#00e676';
  if (age < 6 * 60 * 60 * 1000) return '#f59e0b';
  return '#ef5350';
}

function fmtTs(ts: string | null): string {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function AdminSyncPage() {
  const [season, setSeason]         = useState(DEFAULT_SEASON);
  const [syncLeagueId, setSyncLeagueId] = useState('');
  const [syncSeason, setSyncSeason] = useState(String(DEFAULT_SEASON));
  const [loading, setLoading]       = useState<string | null>(null);
  const [result, setResult]         = useState<{ action: string; ok: boolean; message: string } | null>(null);

  const { data: status, isLoading: statusLoading, refetch } = useSyncStatus(season);

  async function runAction(action: string, url: string) {
    setLoading(action);
    setResult(null);
    try {
      const res  = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      setResult({ action, ok: res.ok, message: res.ok ? JSON.stringify(json, null, 2) : `Error ${res.status}: ${json.error ?? 'Unknown error'}` });
      if (res.ok) refetch();
    } catch (e) {
      setResult({ action, ok: false, message: String(e) });
    } finally {
      setLoading(null);
    }
  }

  const syncLeagues   = Array.isArray(status?.leagues) ? status!.leagues : [];
  const globalStates  = Array.isArray(status?.global)  ? status!.global  : [];
  const countriesState = globalStates.find(g => g.entityType === 'countries');
  const leaguesState   = globalStates.find(g => g.entityType === 'leagues');

  return (
    <div className="p-5 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-bold mb-0.5" style={{ color: 'var(--t-text-1)' }}>Sync Control Panel</h1>
        <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>Trigger data syncs and monitor freshness across all active leagues.</p>
      </div>

      {/* Actions */}
      <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        <h2 className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--t-text-5)' }}>Actions</h2>

        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-[11px] mb-1" style={{ color: 'var(--t-text-5)' }}>League</label>
            <select
              value={syncLeagueId}
              onChange={(e) => setSyncLeagueId(e.target.value)}
              className="text-[12px] rounded px-3 py-1.5 outline-none min-w-[220px]"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            >
              <option value="">All / default</option>
              {syncLeagues.map((l) => (
                <option key={l.leagueApiId} value={String(l.leagueApiId)}>
                  {l.countryName} — {l.leagueName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] mb-1" style={{ color: 'var(--t-text-5)' }}>Season</label>
            <input
              type="number"
              value={syncSeason}
              onChange={(e) => setSyncSeason(e.target.value)}
              className="text-[12px] rounded px-3 py-1.5 outline-none w-24"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runAction('preload', '/api/preload/run')}
            disabled={!!loading}
            className="px-4 py-2 rounded text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676', border: '1px solid rgba(0,230,118,0.3)' }}
          >
            {loading === 'preload' ? '⏳ Running…' : '▶ Run Preload'}
          </button>
          <button
            onClick={() => { if (!syncLeagueId || !syncSeason) { alert('Select a league and season'); return; } runAction('odds', `/api/odds/sync?leagueId=${syncLeagueId}&season=${syncSeason}`); }}
            disabled={!!loading}
            className="px-4 py-2 rounded text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-2)', border: '1px solid var(--t-border-2)' }}
          >
            {loading === 'odds' ? '⏳ Syncing…' : '🔄 Sync Odds'}
          </button>
          <button
            onClick={() => { if (!syncLeagueId || !syncSeason) { alert('Select a league and season'); return; } runAction('upcoming', `/api/fixtures/sync-upcoming?leagueId=${syncLeagueId}&season=${syncSeason}`); }}
            disabled={!!loading}
            className="px-4 py-2 rounded text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-2)', border: '1px solid var(--t-border-2)' }}
          >
            {loading === 'upcoming' ? '⏳ Syncing…' : '📅 Sync Upcoming'}
          </button>
        </div>

        {result && (
          <div
            className="mt-4 p-3 rounded text-[12px] font-mono"
            style={{
              background: result.ok ? 'rgba(0,230,118,0.06)' : 'rgba(239,83,80,0.06)',
              border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(239,83,80,0.2)'}`,
              color: result.ok ? '#00e676' : '#fca5a5',
            }}
          >
            <div className="font-bold mb-1">{result.ok ? '✓' : '✗'} {result.action}</div>
            <pre className="text-[11px] whitespace-pre-wrap max-h-40 overflow-auto">{result.message}</pre>
          </div>
        )}
      </div>

      {/* Global state */}
      {status && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Countries',    ts: countriesState?.lastSyncedAtUtc ?? null },
            { label: 'Leagues',      ts: leaguesState?.lastSyncedAtUtc   ?? null },
            { label: 'Generated at', ts: status.generatedAtUtc },
          ].map(({ label, ts }) => (
            <div key={label} className="rounded p-3" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
              <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--t-text-6)' }}>{label}</div>
              <div className="text-[13px] font-semibold" style={{ color: freshnessColor(ts) }}>{fmtTs(ts)}</div>
            </div>
          ))}
        </div>
      )}

      {/* League sync table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--t-border)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
          <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>League Sync Status</h2>
          <div className="flex items-center gap-3">
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="text-[11px] rounded px-2 py-1 outline-none"
              style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-3)' }}
            >
              {[2025, 2024, 2023].map((s) => <option key={s} value={s}>{s}/{s + 1}</option>)}
            </select>
            <button onClick={() => refetch()} className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>↻ Refresh</button>
          </div>
        </div>

        {statusLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: 'var(--t-page-bg)', borderBottom: '1px solid var(--t-border)' }}>
                  {['League', 'Country', 'Teams', 'Fix Upcoming', 'Fix Full', 'Standings', 'Odds', 'Bookmakers'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syncLeagues.map((l) => (
                  <tr key={`${l.leagueApiId}-${l.season}`} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td className="px-3 py-2">
                      <span style={{ color: 'var(--t-text-2)' }}>{l.leagueName}</span>
                      {l.isActive && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676' }}>Active</span>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--t-text-4)' }}>{l.countryName}</td>
                    {[l.teamsLastSyncedAtUtc, l.fixturesUpcomingLastSyncedAtUtc, l.fixturesFullLastSyncedAtUtc, l.standingsLastSyncedAtUtc, l.oddsLastSyncedAtUtc, l.bookmakersLastSyncedAtUtc].map((ts, i) => (
                      <td key={i} className="px-3 py-2 font-mono" style={{ color: freshnessColor(ts) }}>{fmtTs(ts)}</td>
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
