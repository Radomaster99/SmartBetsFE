'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type MobileOverlay = 'none' | 'search' | 'leagues' | 'saved';

interface Props {
  activeOverlay: MobileOverlay;
  onOverlayChange: (next: MobileOverlay) => void;
}

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 62;
const MOBILE_BOTTOM_NAV_ICON_SIZE_PX = 21;
const MOBILE_BOTTOM_NAV_LABEL_SIZE_PX = 10;

function MatchesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      height={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      height={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function LeaguesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      height={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M8 21l4-16 4 16M4 9h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SavedIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      height={MOBILE_BOTTOM_NAV_ICON_SIZE_PX}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileBottomNav({ activeOverlay, onOverlayChange }: Props) {
  const pathname = usePathname();
  const isMatchesActive = pathname === '/football' && activeOverlay === 'none';

  const tabs = [
    {
      id: 'matches' as const,
      label: 'Matches',
      icon: <MatchesIcon />,
      isActive: isMatchesActive,
    },
    {
      id: 'search' as const,
      label: 'Search',
      icon: <SearchIcon />,
      isActive: activeOverlay === 'search',
    },
    {
      id: 'leagues' as const,
      label: 'Leagues',
      icon: <LeaguesIcon />,
      isActive: activeOverlay === 'leagues',
    },
    {
      id: 'saved' as const,
      label: 'Saved',
      icon: <SavedIcon filled={activeOverlay === 'saved'} />,
      isActive: activeOverlay === 'saved',
    },
  ];

  function handlePress(tabId: (typeof tabs)[number]['id']) {
    if (tabId === 'matches') {
      onOverlayChange('none');
      return;
    }
    onOverlayChange(activeOverlay === tabId ? 'none' : (tabId as MobileOverlay));
  }

  return (
    <nav
      className="md:hidden flex items-stretch"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: MOBILE_BOTTOM_NAV_HEIGHT_PX,
        background: 'rgba(6,10,20,0.99)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.09)',
        zIndex: 50,
      }}
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        if (tab.id === 'matches') {
          return (
            <Link
              key={tab.id}
              href="/football"
              onClick={() => onOverlayChange('none')}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                textDecoration: 'none',
                opacity: tab.isActive ? 1 : 0.28,
                filter: tab.isActive ? 'none' : 'grayscale(1)',
                color: tab.isActive ? 'var(--t-accent)' : 'var(--t-text-3)',
                paddingBottom: 2,
              }}
              aria-label={tab.label}
              aria-current={tab.isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span style={{ fontSize: MOBILE_BOTTOM_NAV_LABEL_SIZE_PX, fontWeight: 700, letterSpacing: '0.04em' }}>{tab.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handlePress(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: tab.isActive ? 1 : 0.55,
              color: tab.isActive ? 'var(--t-accent)' : 'var(--t-text-3)',
              paddingBottom: 2,
            }}
            aria-label={tab.label}
            aria-pressed={tab.isActive}
          >
            {tab.icon}
            <span style={{ fontSize: MOBILE_BOTTOM_NAV_LABEL_SIZE_PX, fontWeight: 700, letterSpacing: '0.04em' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
