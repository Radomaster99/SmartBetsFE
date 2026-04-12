'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useLiveFixtureCount } from '@/lib/hooks/useLiveFixtureCount';

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const liveCount = useLiveFixtureCount();
  const isAdminRoute = pathname.startsWith('/admin');
  const isBonusCodesRoute = pathname.startsWith('/bonus-codes');

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
      <div className="flex min-w-0 flex-shrink-0 items-center" style={{ width: 280, minWidth: 280 }}>
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
          <span className="text-[17px] font-black tracking-[-0.02em]" style={{ color: 'var(--t-text-1)' }}>
            SmartBets
          </span>
        </Link>
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-3 md:-ml-2 md:flex">
        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        <Link
          href="/bonus-codes"
          className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{
            textDecoration: 'none',
            background: isBonusCodesRoute ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
            border: isBonusCodesRoute
              ? '1px solid rgba(251,191,36,0.34)'
              : '1px solid rgba(255,255,255,0.08)',
            color: isBonusCodesRoute ? '#fbbf24' : 'var(--t-text-2)',
            boxShadow: isBonusCodesRoute ? '0 0 0 1px rgba(251,191,36,0.05) inset' : 'none',
            whiteSpace: 'nowrap',
          }}
          aria-label="Open bonus codes page"
        >
          Bonus codes
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Link
          href="/bonus-codes"
          className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] md:hidden"
          style={{
            textDecoration: 'none',
            background: isBonusCodesRoute ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
            border: isBonusCodesRoute
              ? '1px solid rgba(251,191,36,0.34)'
              : '1px solid rgba(255,255,255,0.08)',
            color: isBonusCodesRoute ? '#fbbf24' : 'var(--t-text-2)',
            boxShadow: isBonusCodesRoute ? '0 0 0 1px rgba(251,191,36,0.05) inset' : 'none',
          }}
          aria-label="Open bonus codes page"
        >
          Codes
        </Link>

        {liveCount > 0 ? (
          <button
            type="button"
            onClick={() => router.push('/football?state=Live')}
            className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold md:inline-flex"
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
      </div>
    </header>
  );
}
