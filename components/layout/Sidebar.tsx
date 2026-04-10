'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebarContent } from '@/components/layout/AdminSidebarContent';
import { FootballSidebarContent } from '@/components/layout/FootballSidebarContent';

function SkeletonBar({ width = '100%', height = 28 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: 'var(--t-surface-3)',
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Matches/Standings toggle placeholder */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '4px 8px 6px',
          borderBottom: '1px solid var(--t-border)',
          flexShrink: 0,
        }}
      >
        <SkeletonBar />
        <SkeletonBar />
      </div>

      {/* Pinned section placeholder */}
      <div style={{ flexShrink: 0, padding: '8px 8px 6px', borderBottom: '1px solid var(--t-border)' }}>
        <SkeletonBar width={36} height={8} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          <SkeletonBar height={26} />
          <SkeletonBar height={26} />
          <SkeletonBar height={26} />
        </div>
      </div>

      {/* All leagues + search placeholder */}
      <div style={{ padding: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBar height={26} />
        <SkeletonBar height={30} />
        <SkeletonBar height={26} />
        <SkeletonBar height={26} />
        <SkeletonBar height={26} />
        <SkeletonBar height={26} />
      </div>
    </div>
  );
}

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
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 8px 4px',
              flexShrink: 0,
            }}
          >
            <Link
              href="/football"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                ...(isFootball
                  ? {
                      background: 'rgba(0,230,118,0.12)',
                      border: '1px solid rgba(0,230,118,0.3)',
                      color: 'var(--t-accent)',
                    }
                  : {
                      background: 'var(--t-surface-2)',
                      border: '1px solid var(--t-border)',
                      color: 'var(--t-text-4)',
                    }),
              }}
            >
              ⚽ Football
            </Link>
            <span
              title="Coming soon"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--t-surface-2)',
                border: '1px solid var(--t-border)',
                color: 'var(--t-text-5)',
                cursor: 'default',
                opacity: 0.6,
              }}
            >
              🎾 Tennis
            </span>
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
          <Suspense fallback={<SidebarSkeleton />}>
            <FootballSidebarContent />
          </Suspense>
        ) : null}
    </aside>
  );
}
