'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { SideAdArtwork } from '@/components/ads/SideAdArtwork';
import { FavoritesDock } from '@/components/layout/FavoritesDock';
import { LeaguesBottomSheet } from '@/components/layout/LeaguesBottomSheet';
import { MobileBottomNav, type MobileOverlay } from '@/components/layout/MobileBottomNav';
import { MobileSavedScreen } from '@/components/layout/MobileSavedScreen';
import { MobileSearchOverlay } from '@/components/layout/MobileSearchOverlay';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useFixtureWatchlist } from '@/lib/hooks/useFixtureWatchlist';
import {
  DESKTOP_SIDE_AD_WIDTH_PX,
  EMPTY_SIDE_ADS_CONFIG,
  readSideAdsConfig,
  SIDE_ADS_STORAGE_KEY,
  SIDE_ADS_UPDATED_EVENT,
  type SideAdSlotConfig,
  type SideAdsConfig,
} from '@/lib/side-ads';

function shouldOpenExternallyInNewTab(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href');

  if (!href || href.startsWith('#') || anchor.hasAttribute('download')) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    const isSameOrigin = url.origin === window.location.origin;
    const isGoRedirect = isSameOrigin && url.pathname.startsWith('/go/');

    return !isSameOrigin || isGoRedirect;
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const DESKTOP_SHELL_GUTTER_PX = 280;
  const [mobileOverlay, setMobileOverlay] = useState<MobileOverlay>('none');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [sideAdsConfig, setSideAdsConfig] = useState<SideAdsConfig>(EMPTY_SIDE_ADS_CONFIG);
  const { entries: favoriteEntries, removeFixture } = useFixtureWatchlist();

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobileViewport(media.matches);

    apply();
    media.addEventListener('change', apply);

    return () => {
      media.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    if (mobileOverlay === 'none') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOverlay]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      if (!shouldOpenExternallyInNewTab(anchor)) {
        return;
      }

      const href = anchor.href;
      if (!href) {
        return;
      }

      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    const syncSideAds = () => {
      setSideAdsConfig(readSideAdsConfig());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SIDE_ADS_STORAGE_KEY) {
        syncSideAds();
      }
    };

    syncSideAds();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(SIDE_ADS_UPDATED_EVENT, syncSideAds);

    return () => {
      window.removeEventListener(SIDE_ADS_UPDATED_EVENT, syncSideAds);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const shellGutter = isMobileViewport ? '5px' : `${DESKTOP_SHELL_GUTTER_PX}px`;

  function renderSideAd(slot: SideAdSlotConfig | null, side: 'left' | 'right') {
    if (isMobileViewport || !slot?.imageSrc) {
      return null;
    }

    const content = (
      <div style={{ height: '100%', width: `${DESKTOP_SIDE_AD_WIDTH_PX}px`, overflow: 'hidden' }}>
        <SideAdArtwork slot={slot} alt={slot.alt || `${side} sidebar banner`} />
      </div>
    );

    const wrapperStyle = {
      position: 'fixed' as const,
      top: 0,
      bottom: 0,
      width: `${DESKTOP_SIDE_AD_WIDTH_PX}px`,
      zIndex: 1,
      [side]: 0,
    };

    if (slot.isClickable && slot.href) {
      return (
        <a
          key={side}
          href={slot.href}
          aria-label={slot.alt || `${side} sidebar banner`}
          style={wrapperStyle}
        >
          {content}
        </a>
      );
    }

    return (
      <div key={side} aria-hidden="true" style={wrapperStyle}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', paddingInline: shellGutter, boxSizing: 'border-box' }}>
      {renderSideAd(sideAdsConfig.left, 'left')}
      {renderSideAd(sideAdsConfig.right, 'right')}
      {!isMobileViewport ? <FavoritesDock entries={favoriteEntries} onRemove={removeFixture} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
        </div>
        <MobileBottomNav activeOverlay={mobileOverlay} onOverlayChange={setMobileOverlay} />
      </div>

      {mobileOverlay === 'search' ? <MobileSearchOverlay onClose={() => setMobileOverlay('none')} /> : null}
      {mobileOverlay === 'leagues' ? <LeaguesBottomSheet onClose={() => setMobileOverlay('none')} /> : null}
      {mobileOverlay === 'saved' ? <MobileSavedScreen entries={favoriteEntries} onClose={() => setMobileOverlay('none')} /> : null}
    </div>
  );
}
