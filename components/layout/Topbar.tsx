'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useLiveFixtureCount } from '@/lib/hooks/useLiveFixtureCount';

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

export function Topbar() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const liveCount = useLiveFixtureCount();
  const isAdminRoute = pathname.startsWith('/admin');

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
      {/* Logo — icon + SmartBets (no Football sub-label) */}
      <div className="flex min-w-0 flex-shrink-0 items-center md:w-56 md:min-w-56">
        <Link href="/football" className="flex min-w-0 items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.24)' }}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ background: 'var(--t-accent)', boxShadow: '0 0 0 4px rgba(0,230,118,0.12)' }}
            />
          </div>
          <span
            className="text-[17px] font-black tracking-[-0.02em]"
            style={{ color: 'var(--t-text-1)' }}
          >
            SmartBets
          </span>
        </Link>
      </div>

      {/* Desktop search */}
      <div className="hidden min-w-0 flex-1 items-center md:-ml-2 md:flex">
        <GlobalSearch />
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Live pill — only shown on desktop when there are live fixtures */}
        {liveCount > 0 ? (
          <button
            type="button"
            onClick={() => router.push('/football?state=Live')}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: 'rgba(0,230,118,0.12)',
              border: '1px solid rgba(0,230,118,0.3)',
              color: 'var(--t-accent)',
              cursor: 'pointer',
            }}
            aria-label={`${liveCount} live fixtures — click to view`}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--t-accent)',
                animation: 'live-pulse 1.4s ease-in-out infinite',
              }}
              aria-hidden="true"
            />
            {liveCount} Live
          </button>
        ) : null}

        <Link
          href="/admin/sync"
          className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{
            textDecoration: 'none',
            background: isAdminRoute ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
            border: isAdminRoute
              ? '1px solid rgba(0,230,118,0.26)'
              : '1px solid rgba(255,255,255,0.08)',
            color: isAdminRoute ? 'var(--t-accent)' : 'var(--t-text-2)',
            boxShadow: isAdminRoute ? '0 0 0 1px rgba(0,230,118,0.04) inset' : 'none',
          }}
          aria-label="Open admin control panel"
        >
          Admin
        </Link>

        {/* Theme toggle */}
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
