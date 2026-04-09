'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebarContent } from '@/components/layout/AdminSidebarContent';
import { FootballSidebarContent } from '@/components/layout/FootballSidebarContent';

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const isFootball = pathname.startsWith('/football');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`layout-sidebar fixed inset-y-0 left-0 z-40 flex h-full w-64 max-w-[86vw] flex-col overflow-hidden md:static md:z-auto md:w-56 md:max-w-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background: 'var(--t-sidebar-bg)',
          borderRight: '1px solid var(--t-border)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div className="flex-shrink-0 border-b md:hidden" style={{ borderColor: 'var(--t-border)' }}>
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
              Navigation
            </span>
            <button
              type="button"
              onClick={onClose}
              className="chrome-btn px-2 py-1 text-[11px]"
              >
              Close
            </button>
          </div>
        </div>

        {!isAdmin ? (
          <div className="flex-shrink-0 pt-1">
            <Link
              href="/football"
              onNavigate={onClose}
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
            <AdminSidebarContent onNavigate={onClose} />
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
            <FootballSidebarContent onNavigate={onClose} />
          </Suspense>
        ) : null}
      </aside>
    </>
  );
}
