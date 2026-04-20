'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { SideAdArtwork } from '@/components/ads/SideAdArtwork';
import { FavoritesDock } from '@/components/layout/FavoritesDock';
import { LeaguesBottomSheet } from '@/components/layout/LeaguesBottomSheet';
import { MobileBottomNav, type MobileOverlay } from '@/components/layout/MobileBottomNav';
import { MobileSavedScreen } from '@/components/layout/MobileSavedScreen';
import { MobileSearchOverlay } from '@/components/layout/MobileSearchOverlay';
import { Sidebar } from '@/components/layout/Sidebar';
import { SportSwitcherPanel } from '@/components/layout/SportSwitcherPanel';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Topbar } from '@/components/layout/Topbar';
import { useFixtureWatchlist } from '@/lib/hooks/useFixtureWatchlist';
import {
  DESKTOP_SIDE_AD_WIDTH_CSS,
  DESKTOP_SIDE_AD_SHOW_MIN_HEIGHT_PX,
  DESKTOP_SIDE_AD_SHOW_MIN_WIDTH_PX,
  EMPTY_SIDE_ADS_CONFIG,
  type SideAdSlotConfig,
} from '@/lib/side-ads';
import { useSideAdsContent } from '@/lib/hooks/useContentDocuments';

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
  const [mobileOverlay, setMobileOverlay] = useState<MobileOverlay>('none');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [canShowDesktopSideAds, setCanShowDesktopSideAds] = useState(false);
  const sideAdsQuery = useSideAdsContent();
  const sideAdsConfig = sideAdsQuery.data ?? EMPTY_SIDE_ADS_CONFIG;
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
    const media = window.matchMedia(
      `(min-width: ${DESKTOP_SIDE_AD_SHOW_MIN_WIDTH_PX}px) and (min-height: ${DESKTOP_SIDE_AD_SHOW_MIN_HEIGHT_PX}px)`,
    );
    const apply = () => setCanShowDesktopSideAds(media.matches);

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

  const shouldRenderDesktopSideAds = !isMobileViewport && canShowDesktopSideAds;
  const shellGutter = shouldRenderDesktopSideAds ? DESKTOP_SIDE_AD_WIDTH_CSS : '5px';

  function renderSideAd(slot: SideAdSlotConfig | null, side: 'left' | 'right') {
    if (!shouldRenderDesktopSideAds || !slot?.imageSrc) {
      return null;
    }

    const content = (
      <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
        <SideAdArtwork slot={slot} alt={slot.alt || `${side} sidebar banner`} />
      </div>
    );

    const wrapperStyle = {
      position: 'fixed' as const,
      top: 0,
      bottom: 0,
      width: DESKTOP_SIDE_AD_WIDTH_CSS,
      height: '100vh',
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
    <div style={{ minHeight: '100vh', width: '100%', ['--shell-gutter-px' as string]: shellGutter }}>
      {renderSideAd(sideAdsConfig.left, 'left')}
      {renderSideAd(sideAdsConfig.right, 'right')}
      {!isMobileViewport ? <FavoritesDock entries={favoriteEntries} onRemove={removeFixture} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column', paddingInline: shellGutter, boxSizing: 'border-box' }}>
        <Topbar />
        <div style={{ display: 'flex', position: 'relative' }}>
          <SportSwitcherPanel />
          <Sidebar />
          <main className="pb-[62px] md:pb-0" style={{ flex: 1, minWidth: 0 }}>
            {children}
          </main>
        </div>
        <MobileBottomNav activeOverlay={mobileOverlay} onOverlayChange={setMobileOverlay} />
      </div>
      <SiteFooter />

      {mobileOverlay === 'search' ? <MobileSearchOverlay onClose={() => setMobileOverlay('none')} /> : null}
      {mobileOverlay === 'leagues' ? <LeaguesBottomSheet onClose={() => setMobileOverlay('none')} /> : null}
      {mobileOverlay === 'saved' ? (
        <MobileSavedScreen
          entries={favoriteEntries}
          onClose={() => setMobileOverlay('none')}
          onRemove={removeFixture}
        />
      ) : null}
    </div>
  );
}
