'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { useTheme } from '@/lib/contexts/ThemeContext';

function SyncIndicator() {
  const { data, isLoading } = useSyncStatus();

  if (isLoading) return (
    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--t-text-5)' }} />
      <span>Checking sync…</span>
    </div>
  );

  if (!data) return (
    <Link href="/admin/sync" className="flex items-center gap-1.5 text-[11px]" style={{ color: '#ef5350' }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef5350' }} />
      <span>Sync error</span>
    </Link>
  );

  const leagues = Array.isArray(data.leagues) ? data.leagues : [];
  const now = Date.now();
  const SIX_H = 6 * 60 * 60 * 1000;
  const ONE_H = 60 * 60 * 1000;

  let worst: 'ok' | 'warn' | 'stale' = 'ok';
  for (const l of leagues) {
    if (!l.isActive) continue;
    if (!l.oddsLastSyncedAtUtc) { worst = 'stale'; break; }
    const age = now - new Date(l.oddsLastSyncedAtUtc).getTime();
    if (age > SIX_H) { worst = 'stale'; break; }
    if (age > ONE_H && (worst as string) !== 'stale') worst = 'warn';
  }

  const cfg = {
    ok:    { color: '#00e676', label: 'Live' },
    warn:  { color: '#f59e0b', label: 'Aging' },
    stale: { color: '#ef5350', label: 'Stale' },
  }[worst];

  return (
    <Link href="/admin/sync" className="flex items-center gap-1.5 text-[11px] hover:opacity-80">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </Link>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  }, []);

  const SPORTS = [
    { name: 'Football', href: '/football' },
    { name: 'Tennis',   href: '/tennis' },
    { name: 'CS2',      href: '/cs2' },
  ];

  return (
    <header
      className="flex-shrink-0 flex items-center px-4 gap-6"
      style={{
        height: '48px',
        background: 'var(--t-topbar-bg)',
        borderBottom: '1px solid var(--t-border)',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/football" className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center justify-center w-6 h-6 rounded font-black text-xs" style={{ background: '#00e676', color: '#000' }}>
          SB
        </div>
        <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--t-text-1)' }}>SmartBets</span>
      </Link>

      {/* Sport tabs */}
      <nav className="flex items-center gap-0.5 h-full">
        {SPORTS.map((s) => {
          const active = pathname.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center px-3 h-full text-[13px] font-medium transition-colors relative"
              style={{
                color: active ? 'var(--t-text-1)' : 'var(--t-text-4)',
                borderBottom: active ? '2px solid var(--t-accent)' : '2px solid transparent',
              }}
            >
              {s.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <SyncIndicator />

      {dateLabel && (
        <div className="text-[11px]" style={{ color: 'var(--t-text-6)' }}>{dateLabel}</div>
      )}

      {/* Theme toggle */}
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
