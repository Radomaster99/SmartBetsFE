'use client';

import {
  HERO_BANNER_THEMES,
  type HeroBannerConfig,
  type HeroBannerThemeId,
} from '@/lib/hero-banners';

type Props = {
  banner: HeroBannerConfig;
  onChange: (id: HeroBannerConfig['id'], updates: Partial<HeroBannerConfig>) => void;
};

export function HeroBannerSlotEditor({ banner, onChange }: Props) {
  const theme = HERO_BANNER_THEMES[banner.themeId ?? 'graphite'];

  return (
    <div
      className="space-y-3 rounded-lg p-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--t-border)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {banner.id.replace('slot-', 'Hero Slot ')}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
            {banner.updatedAtUtc
              ? `Updated ${new Date(banner.updatedAtUtc).toLocaleString('bg-BG', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Default preset'}
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{
            background: banner.isClickable && banner.href ? 'rgba(0,230,118,0.12)' : 'rgba(148,163,184,0.12)',
            color: banner.isClickable && banner.href ? 'var(--t-accent)' : 'var(--t-text-5)',
            border: '1px solid var(--t-border)',
          }}
        >
          {banner.isClickable && banner.href ? 'Clickable' : 'Static'}
        </span>
      </div>

      <div
        className="relative flex h-[104px] flex-col rounded-[8px] px-2 py-2 text-center md:h-[112px] md:px-3"
        style={{
          textDecoration: 'none',
          background: theme.background,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="text-left text-[7px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.64)' }}>
            {banner.eyebrow}
          </div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.88)' }}>
            ^
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mt-0.5 text-[11px] font-black tracking-[-0.02em] md:text-[13px]" style={{ color: '#ffffff' }}>
            {banner.bookmaker}
          </div>
          <div
            className="mx-auto mt-1 max-w-[140px] min-h-[24px] text-[8px] font-medium leading-3 md:max-w-[180px] md:min-h-[28px] md:text-[9px]"
            style={{ color: 'rgba(255,255,255,0.94)' }}
          >
            {banner.offer}
          </div>
        </div>

        <div
          className="mt-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] md:text-[9px]"
          style={{
            background: theme.buttonBackground,
            color: theme.buttonColor,
          }}
        >
          {banner.cta}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Brand / Title
          </label>
          <input
            type="text"
            value={banner.bookmaker}
            onChange={(event) => onChange(banner.id, { bookmaker: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Eyebrow
          </label>
          <input
            type="text"
            value={banner.eyebrow}
            onChange={(event) => onChange(banner.id, { eyebrow: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Offer Text
          </label>
          <input
            type="text"
            value={banner.offer}
            onChange={(event) => onChange(banner.id, { offer: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            CTA Label
          </label>
          <input
            type="text"
            value={banner.cta}
            onChange={(event) => onChange(banner.id, { cta: event.target.value })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Theme
          </label>
          <select
            value={banner.themeId ?? 'graphite'}
            onChange={(event) => onChange(banner.id, { themeId: event.target.value as HeroBannerThemeId })}
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          >
            {Object.entries(HERO_BANNER_THEMES).map(([themeId, themeMeta]) => (
              <option key={themeId} value={themeId}>
                {themeMeta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
          <input
            type="checkbox"
            checked={Boolean(banner.isClickable)}
            onChange={(event) => onChange(banner.id, { isClickable: event.target.checked })}
            className="accent-green-400"
          />
          Banner is clickable
        </label>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Destination URL
          </label>
          <input
            type="url"
            value={banner.href ?? ''}
            onChange={(event) => onChange(banner.id, { href: event.target.value })}
            placeholder="https://example.com or /go/bet365"
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          />
        </div>
      </div>
    </div>
  );
}
