'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SportSwitcherPanel() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isAdmin = pathname.startsWith('/admin');
  const isFootball = pathname.startsWith('/football');

  if (isAdmin) return null;

  return (
    <aside
      className="hidden md:flex md:flex-col md:flex-shrink-0"
      style={{
        position: 'sticky',
        top: 52,
        height: 'calc(100vh - 52px)',
        alignSelf: 'flex-start',
        width: 56,
        background: 'var(--t-sidebar-bg)',
        borderRight: '1px solid var(--t-border)',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 12,
        gap: 4,
        overflowY: 'auto',
      }}
    >
      <Link
        href="/football"
        title="Football"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          textDecoration: 'none',
          fontSize: 18,
          border: '1px solid transparent',
          flexShrink: 0,
          ...(isFootball
            ? {
                background: 'rgba(0,230,118,0.12)',
                borderColor: 'rgba(0,230,118,0.3)',
                color: 'var(--t-accent)',
              }
            : {
                background: 'var(--t-surface-2)',
                borderColor: 'var(--t-border)',
                color: 'var(--t-text-4)',
              }),
        }}
      >
        ⚽
        <span style={{ fontSize: 7, color: 'inherit', letterSpacing: '0.3px' }}>Football</span>
      </Link>

      <span
        title="Tennis — coming soon"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          fontSize: 18,
          background: 'var(--t-surface-2)',
          borderColor: 'var(--t-border)',
          border: '1px solid var(--t-border)',
          color: 'var(--t-text-5)',
          cursor: 'default',
          opacity: 0.5,
          flexShrink: 0,
        }}
      >
        🎾
        <span style={{ fontSize: 7, color: 'inherit', letterSpacing: '0.3px' }}>Tennis</span>
      </span>

      {/* Theme toggle pinned to bottom */}
      <button
        type="button"
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          marginTop: 'auto',
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--t-surface-2)',
          border: '1px solid var(--t-border)',
          color: 'var(--t-text-4)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </aside>
  );
}
