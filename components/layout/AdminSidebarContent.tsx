'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const ADMIN_NAV_ITEMS = [
  { label: 'Control panel', href: '/admin/sync', section: null },
  { label: 'Quick sync', href: '/admin/sync?section=quick', section: 'quick' },
  { label: 'League actions', href: '/admin/sync?section=league', section: 'league' },
  { label: 'Popular leagues', href: '/admin/sync?section=popular', section: 'popular' },
  { label: 'Hero banners', href: '/admin/sync?section=hero', section: 'hero' },
  { label: 'Side ads', href: '/admin/sync?section=ads', section: 'ads' },
  { label: 'Last run', href: '/admin/sync?section=result', section: 'result' },
  { label: 'Freshness snapshot', href: '/admin/sync?section=snapshot', section: 'snapshot' },
  { label: 'League sync status', href: '/admin/sync?section=status', section: 'status' },
] as const;

export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section');
  const isAdminSyncPage = pathname === '/admin/sync';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-1 pt-1 pb-2">
        {ADMIN_NAV_ITEMS.map((item, index) => {
          const isActive = isAdminSyncPage && ((item.section === null && !activeSection) || item.section === activeSection);

          return (
            <Link
              key={item.label}
              href={item.href}
              onNavigate={onNavigate}
              className="sidebar-hover-item mx-1 flex items-center rounded px-3 py-2.5 text-[12px] transition-colors"
              data-active={isActive ? 'true' : 'false'}
              style={{
                color: isActive ? 'var(--t-text-1)' : 'var(--t-text-3)',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                textDecoration: 'none',
                marginTop: index === 0 ? '4px' : '6px',
                borderLeft: isActive ? '2px solid rgba(0,230,118,0.45)' : '2px solid transparent',
                ['--sidebar-hover-bg' as string]: 'rgba(255,255,255,0.06)',
                ['--sidebar-active-hover-bg' as string]: 'rgba(255,255,255,0.1)',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
