'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebarContent } from '@/components/layout/AdminSidebarContent';
import { FootballSidebarContent } from '@/components/layout/FootballSidebarContent';

export function Sidebar() {
  const pathname = usePathname();
  const isFootball = pathname.startsWith('/football');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <aside
      className="layout-sidebar hidden md:flex md:w-56 md:flex-shrink-0 md:flex-col md:overflow-hidden"
      style={{
        background: 'var(--t-sidebar-bg)',
        borderRight: '1px solid var(--t-border)',
      }}
    >
        {!isAdmin ? (
          <div className="flex-shrink-0 pt-1">
            <Link
              href="/football"
              className={`sidebar-hover-item mx-2 mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${isFootball ? 'chrome-btn-active' : ''}`}
              data-active={isFootball ? 'true' : 'false'}
              style={{
                color: isFootball ? 'var(--t-text-1)' : 'var(--t-text-3)',
                background: isFootball ? undefined : 'transparent',
                borderLeft: 'none',
                textDecoration: 'none',
                ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.07)',
                ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.12)',
              }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold leading-none"
                style={{
                  background: isFootball ? 'rgba(0,230,118,0.12)' : 'var(--t-surface-2)',
                  color: isFootball ? 'var(--t-accent)' : 'var(--t-text-4)',
                }}
              >
                F
              </span>
              <span>Football</span>
            </Link>
          </div>
        ) : null}

        {isAdmin ? (
          <Suspense
            fallback={
              <div className="flex flex-1 flex-col overflow-hidden">
                <div
                  className="px-3 py-3 text-[12px]"
                  style={{ borderTop: '1px solid var(--t-border)', color: 'var(--t-text-5)' }}
                >
                  Loading navigation...
                </div>
              </div>
            }
          >
            <AdminSidebarContent />
          </Suspense>
        ) : null}

        {isFootball ? (
          <Suspense
            fallback={
              <div className="flex flex-1 flex-col overflow-hidden">
                <div
                  className="px-3 py-3 text-[12px]"
                  style={{ borderTop: '1px solid var(--t-border)', color: 'var(--t-text-5)' }}
                >
                  Loading navigation...
                </div>
              </div>
            }
          >
            <FootballSidebarContent />
          </Suspense>
        ) : null}
    </aside>
  );
}
