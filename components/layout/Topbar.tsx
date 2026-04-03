'use client';
import Link from 'next/link';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';

function OddsFreshnessLabel() {
  const { data } = useSyncStatus();

  if (!data) return null;

  const leagues = Array.isArray(data.leagues) ? data.leagues : [];
  const timestamps = leagues
    .filter((l) => l.isActive && l.oddsLastSyncedAtUtc)
    .map((l) => new Date(l.oddsLastSyncedAtUtc!).getTime());

  if (!timestamps.length) return null;

  const latest = Math.max(...timestamps);
  const mins = Math.floor((Date.now() - latest) / 60000);

  const label =
    mins < 1 ? 'Odds: just now' :
    mins < 60 ? `Odds: ${mins}m ago` :
    `Odds: ${Math.floor(mins / 60)}h ago`;

  const color =
    mins < 30 ? 'var(--t-text-5)' :
    mins < 180 ? '#f59e0b' :
    '#ef5350';

  return (
    <span className="text-[11px]" style={{ color }}>
      {label}
    </span>
  );
}

export function Topbar() {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="flex-shrink-0 flex items-center px-4 gap-4"
      style={{
        height: '48px',
        background: 'var(--t-topbar-bg)',
        borderBottom: '1px solid var(--t-border)',
        zIndex: 50,
      }}
    >
      <Link href="/football" className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center justify-center w-6 h-6 rounded font-black text-xs" style={{ background: '#00e676', color: '#000' }}>
          SB
        </div>
        <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--t-text-1)' }}>SmartBets</span>
      </Link>

      <div className="flex-1" />

      <OddsFreshnessLabel />

      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center justify-center w-7 h-7 rounded transition-colors"
        style={{
          background: 'var(--t-surface-2)',
          border: '1px solid var(--t-border-2)',
          color: 'var(--t-text-3)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </header>
  );
}
