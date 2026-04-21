'use client';
import { Suspense } from 'react';
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
  const isFootball = pathname === '/' || pathname.startsWith('/football');
  const isAdmin = pathname.startsWith('/admin');

  if (!isFootball && !isAdmin) return null;

  return (
    <aside
      className="layout-sidebar hidden md:flex md:w-56 md:flex-shrink-0 md:flex-col"
      style={{
        position: 'sticky',
        top: 52,
        height: 'calc(100vh - 52px)',
        alignSelf: 'flex-start',
        overflowY: 'hidden',
        background: 'var(--t-sidebar-bg)',
        borderRight: '1px solid var(--t-border)',
      }}
    >
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
