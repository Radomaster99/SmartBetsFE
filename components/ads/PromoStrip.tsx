'use client';

import { useMemo } from 'react';
import { HeroBannerCard } from '@/components/ads/HeroBannerCard';
import {
  DEFAULT_HERO_BANNERS,
  DEFAULT_HERO_BANNER_LAYOUT,
} from '@/lib/hero-banners';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';
import { useHeroBannersContent } from '@/lib/hooks/useContentDocuments';

export function PromoStrip() {
  const heroBannersQuery = useHeroBannersContent();
  const banners = heroBannersQuery.data?.banners ?? DEFAULT_HERO_BANNERS;
  const layout = heroBannersQuery.data?.layout ?? DEFAULT_HERO_BANNER_LAYOUT;
  const isHydrated = useMemo(
    () => heroBannersQuery.isSuccess || heroBannersQuery.isError,
    [heroBannersQuery.isError, heroBannersQuery.isSuccess],
  );

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
