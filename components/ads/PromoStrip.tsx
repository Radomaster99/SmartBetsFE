'use client';

import { useLayoutEffect, useState } from 'react';
import { HeroBannerCard } from '@/components/ads/HeroBannerCard';
import {
  DEFAULT_HERO_BANNERS,
  DEFAULT_HERO_BANNER_LAYOUT,
  HERO_BANNER_LAYOUT_STORAGE_KEY,
  HERO_BANNERS_STORAGE_KEY,
  HERO_BANNERS_UPDATED_EVENT,
  readHeroBannerLayoutConfig,
  readHeroBannersConfig,
} from '@/lib/hero-banners';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';

export function PromoStrip() {
  const [banners, setBanners] = useState(DEFAULT_HERO_BANNERS);
  const [layout, setLayout] = useState(DEFAULT_HERO_BANNER_LAYOUT);
  const [isHydrated, setIsHydrated] = useState(false);

  useLayoutEffect(() => {
    const syncBanners = () => {
      setBanners(readHeroBannersConfig());
      setLayout(readHeroBannerLayoutConfig());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HERO_BANNERS_STORAGE_KEY || event.key === HERO_BANNER_LAYOUT_STORAGE_KEY) {
        syncBanners();
      }
    };

    syncBanners();
    setIsHydrated(true);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(HERO_BANNERS_UPDATED_EVENT, syncBanners);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(HERO_BANNERS_UPDATED_EVENT, syncBanners);
    };
  }, []);

  return (
    <div
      className="grid grid-cols-3 items-stretch gap-1.5 rounded-[10px]"
      style={{
        visibility: isHydrated ? 'visible' : 'hidden',
      }}
    >
      {banners.map((banner) => {
        const meta = getBookmakerMeta(banner.bookmaker);
        const href =
          banner.href?.trim() ||
          buildBookmakerHref(banner.bookmaker, {
            source: 'football-board-banner',
          });

        return (
          <HeroBannerCard
            key={banner.id}
            banner={banner}
            href={href}
            clickable={Boolean(banner.isClickable && href)}
            ariaLabel={`${meta.name} promo banner`}
            title={`${meta.name} promo banner`}
            heightPx={layout.heightPx}
          />
        );
      })}
    </div>
  );
}
