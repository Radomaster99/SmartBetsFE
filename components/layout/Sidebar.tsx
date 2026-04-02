'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FootballSidebarContent } from '@/components/layout/FootballSidebarContent';

const SPORTS = [
  { name: 'Football', href: '/football', icon: 'F', active: true },
  { name: 'Tennis', href: '/tennis', icon: 'T', active: false },
  { name: 'CS2', href: '/cs2', icon: 'C', active: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const isFootball = pathname.startsWith('/football');

  return (
    <aside
      className="w-52 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--t-sidebar-bg)', borderRight: '1px solid var(--t-border)' }}
    >
      <div className="pt-1 flex-shrink-0">
        {SPORTS.map((sport) => {
          const active = pathname.startsWith(sport.href);

          return (
            <Link
              key={sport.href}
              href={sport.href}
              className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors"
              style={{
                color: active ? 'var(--t-text-1)' : 'var(--t-text-3)',
                background: active ? 'rgba(0,230,118,0.07)' : 'transparent',
                borderLeft: active ? '2px solid var(--t-accent)' : '2px solid transparent',
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold leading-none"
                style={{
                  background: active ? 'rgba(0,230,118,0.14)' : 'var(--t-surface-2)',
                  color: active ? 'var(--t-accent)' : 'var(--t-text-4)',
                }}
              >
                {sport.icon}
              </span>
              <span>{sport.name}</span>
              {!sport.active ? (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                  style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)' }}
                >
                  SOON
                </span>
              ) : null}
            </Link>
          );
        })}
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
