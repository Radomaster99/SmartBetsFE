'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OddsFreshnessLabel() {
  const { data } = useSyncStatus();

  if (!data) return null;

  const leagues = Array.isArray(data.leagues) ? data.leagues : [];
  const timestamps = leagues
    .filter((league) => league.isActive && league.oddsLastSyncedAtUtc)
    .map((league) => new Date(league.oddsLastSyncedAtUtc!).getTime());

  if (!timestamps.length) return null;

  const latest = Math.max(...timestamps);
  const mins = Math.floor((Date.now() - latest) / 60000);

  const label =
    mins < 1 ? 'Pre-match refreshed just now' :
    mins < 60 ? `Pre-match refreshed ${mins}m ago` :
    `Pre-match refreshed ${Math.floor(mins / 60)}h ago`;

  const color = mins < 30 ? 'var(--t-text-4)' : mins < 180 ? '#f59e0b' : '#ef5350';

  return (
    <span className="status-chip hidden md:inline-flex" style={{ color }}>
      {label}
    </span>
  );
}

export function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header
      className="layout-topbar flex flex-shrink-0 items-center gap-3 px-3 md:px-4"
      style={{
        height: '52px',
        background: 'var(--t-topbar-bg)',
        borderBottom: '1px solid var(--t-border)',
        boxShadow: '0 1px 0 rgba(0, 230, 118, 0.07)',
        zIndex: 50,
      }}
    >
      {onMenuToggle ? (
        <button
          type="button"
          onClick={onMenuToggle}
          className="icon-btn md:hidden"
          style={{ cursor: 'pointer' }}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>
      ) : null}

      <Link href="/football" className="flex min-w-0 items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.24)' }}
        >
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--t-accent)', boxShadow: '0 0 0 4px rgba(0,230,118,0.12)' }} />
        </div>
        <div className="flex min-w-0 flex-col leading-none">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--t-text-4)' }}>
            Football
          </span>
          <span className="text-[17px] font-black tracking-[-0.02em]" style={{ color: 'var(--t-text-1)' }}>
            SmartBets
          </span>
        </div>
      </Link>

      <div className="hidden min-[900px]:flex flex-1 items-center gap-3 pl-2">
        <div className="h-4 w-px" style={{ background: 'var(--t-border-2)' }} />
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
          Odds desk for serious football bettors
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <OddsFreshnessLabel />

        <Link
          href="/admin/sync"
          className={`hidden px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] md:inline-flex ${isAdmin ? 'chrome-btn chrome-btn-active' : 'chrome-btn'}`}
          style={{
            textDecoration: 'none',
          }}
        >
          Admin
        </Link>

        <button
          type="button"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="icon-btn"
          style={{ cursor: 'pointer' }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
