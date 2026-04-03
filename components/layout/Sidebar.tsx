'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FootballSidebarContent } from '@/components/layout/FootballSidebarContent';

export function Sidebar() {
  const pathname = usePathname();
  const isFootball = pathname.startsWith('/football');

  return (
    <aside
      className="w-52 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--t-sidebar-bg)', borderRight: '1px solid var(--t-border)' }}
    >
      {/* Sport selector */}
      <div className="pt-1 flex-shrink-0">
        <Link
          href="/football"
          className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors"
          style={{
            color: isFootball ? 'var(--t-text-1)' : 'var(--t-text-3)',
            background: isFootball ? 'rgba(255,255,255,0.06)' : 'transparent',
            borderLeft: isFootball ? '2px solid rgba(255,255,255,0.25)' : '2px solid transparent',
          }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold leading-none"
            style={{
              background: isFootball ? 'rgba(255,255,255,0.1)' : 'var(--t-surface-2)',
              color: isFootball ? 'var(--t-text-1)' : 'var(--t-text-4)',
            }}
          >
            F
          </span>
          <span>Football</span>
        </Link>

        {/* More sports placeholder */}
        <div
          className="px-3 py-2 text-[11px]"
          style={{ color: 'var(--t-text-6)' }}
        >
          More sports coming soon
        </div>
      </div>

      {isFootball ? (
        <Suspense
          fallback={
            <div className="flex flex-col flex-1 overflow-hidden">
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
