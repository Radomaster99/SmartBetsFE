'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';

const SPORTS = [
  { name: 'Football', href: '/football', icon: '⚽', active: true },
  { name: 'Tennis',   href: '/tennis',   icon: '🎾', active: false },
  { name: 'CS2',      href: '/cs2',      icon: '🎮', active: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const isFootball = pathname.startsWith('/football');

  return (
    <aside
      className="w-52 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--t-sidebar-bg)', borderRight: '1px solid var(--t-border)' }}
    >
      {/* Sports */}
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
              <span className="text-base leading-none">{sport.icon}</span>
              <span>{sport.name}</span>
              {!sport.active && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                  style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)' }}
                >
                  SOON
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Football sub-nav */}
      {isFootball && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Page links */}
          <div className="px-2 py-2 mt-1 flex-shrink-0" style={{ borderTop: '1px solid var(--t-border)' }}>
            {[
              { label: 'Matches',   href: '/football',           exact: true },
              { label: 'Standings', href: '/football/standings' },
            ].map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-2 py-2 rounded text-[12px] transition-colors"
                  style={{
                    color: active ? 'var(--t-text-1)' : 'var(--t-text-4)',
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Leagues widget — browse & click leagues directly */}
          <div className="flex-1 overflow-y-auto" style={{ borderTop: '1px solid var(--t-border)' }}>
            <ApiSportsWidget type="leagues" className="h-full" />
          </div>

          <div className="px-2 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--t-border)' }}>
            <Link
              href="/admin/sync"
              className="flex items-center gap-2 px-2 py-2 rounded text-[12px] transition-colors"
              style={{ color: pathname.startsWith('/admin') ? 'var(--t-text-2)' : 'var(--t-text-5)' }}
            >
              <span>⚙</span>
              <span>Admin / Sync</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
