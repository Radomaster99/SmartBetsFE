'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_HERO_BANNERS,
  HERO_BANNERS_STORAGE_KEY,
  HERO_BANNERS_UPDATED_EVENT,
  readHeroBannersConfig,
} from '@/lib/hero-banners';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';

const BRAND_COLORS: Record<string, { gradient: string; cta: string; ctaBorder: string }> = {
  Bet365:   { gradient: 'linear-gradient(135deg, rgba(0,74,35,0.25), rgba(0,74,35,0.08))',      cta: 'rgba(0,74,35,0.9)',    ctaBorder: 'rgba(0,130,60,0.6)' },
  Pinnacle: { gradient: 'linear-gradient(135deg, rgba(30,58,138,0.25), rgba(30,58,138,0.08))',  cta: 'rgba(30,58,138,0.9)', ctaBorder: 'rgba(59,130,246,0.6)' },
  Betano:   { gradient: 'linear-gradient(135deg, rgba(220,38,38,0.25), rgba(220,38,38,0.08))',  cta: 'rgba(185,28,28,0.9)', ctaBorder: 'rgba(239,68,68,0.6)' },
  Unibet:   { gradient: 'linear-gradient(135deg, rgba(0,100,50,0.25), rgba(0,100,50,0.08))',    cta: 'rgba(0,90,40,0.9)',   ctaBorder: 'rgba(0,160,70,0.6)' },
  Bwin:     { gradient: 'linear-gradient(135deg, rgba(180,20,20,0.25), rgba(180,20,20,0.08))',  cta: 'rgba(160,15,15,0.9)', ctaBorder: 'rgba(220,50,50,0.6)' },
};

function getBrandColors(bookmakerName: string) {
  return BRAND_COLORS[bookmakerName] ?? {
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    cta: 'rgba(0,230,118,0.15)',
    ctaBorder: 'rgba(0,230,118,0.4)',
  };
}

function BookmakerInitialLogo({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.15)',
        fontSize: 13,
        fontWeight: 900,
        color: 'var(--t-text-1)',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export function PromoStrip() {
  const [banners, setBanners] = useState(DEFAULT_HERO_BANNERS);

  useEffect(() => {
    const syncBanners = () => setBanners(readHeroBannersConfig());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HERO_BANNERS_STORAGE_KEY) syncBanners();
    };

    syncBanners();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(HERO_BANNERS_UPDATED_EVENT, syncBanners);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(HERO_BANNERS_UPDATED_EVENT, syncBanners);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '8px 6px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {banners.map((banner) => {
        const meta = getBookmakerMeta(banner.bookmaker);
        const brand = getBrandColors(meta.name);
        const href =
          banner.href?.trim() ||
          buildBookmakerHref(banner.bookmaker, { source: 'football-board-promo' });

        const card = (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.1)',
              background: brand.gradient,
              minWidth: 180,
              flex: '0 0 auto',
              transition: 'border-color 0.15s ease, filter 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)';
              (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLDivElement).style.filter = 'none';
            }}
          >
            <BookmakerInitialLogo name={meta.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text-1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta.name}
              </div>
              {banner.eyebrow ? (
                <div style={{ fontSize: 10, color: 'var(--t-text-5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {banner.eyebrow}
                </div>
              ) : null}
            </div>
            <div
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                background: brand.cta,
                border: `1px solid ${brand.ctaBorder}`,
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Open ↗
            </div>
          </div>
        );

        if (!banner.isClickable || !href) {
          return <div key={banner.id} aria-label={`${meta.name} promo`}>{card}</div>;
        }

        return (
          <a
            key={banner.id}
            href={href}
            aria-label={`Open ${meta.name}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            {card}
          </a>
        );
      })}
    </div>
  );
}
