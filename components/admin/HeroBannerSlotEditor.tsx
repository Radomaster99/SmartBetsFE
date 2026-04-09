'use client';

import { useRef, useState } from 'react';
import { HeroBannerCard } from '@/components/ads/HeroBannerCard';
import {
  DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  DEFAULT_HERO_BANNER_IMAGE_ZOOM,
  HERO_BANNER_FONT_PRESETS,
  HERO_BANNER_THEMES,
  normalizeHeroBannerFontScale,
  normalizeHeroBannerFocusPercent,
  normalizeHeroBannerImageZoom,
  MAX_HERO_BANNER_IMAGE_ZOOM,
  MIN_HERO_BANNER_IMAGE_ZOOM,
  type HeroBannerConfig,
  type HeroBannerContentAlign,
  type HeroBannerFontPresetId,
  type HeroBannerThemeId,
} from '@/lib/hero-banners';

type Props = {
  banner: HeroBannerConfig;
  heightPx: number;
  onChange: (id: HeroBannerConfig['id'], updates: Partial<HeroBannerConfig>) => void;
  onUploadImage: (id: HeroBannerConfig['id'], file: File) => Promise<void>;
  onClearImage: (id: HeroBannerConfig['id']) => void;
  isUploadingImage?: boolean;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

  return (
    <div>
      <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-shell min-w-0 flex-1 px-3 py-1.5 text-[12px]"
        />
      </div>
    </div>
  );
}

export function HeroBannerSlotEditor({
  banner,
  heightPx,
  onChange,
  onUploadImage,
  onClearImage,
  isUploadingImage = false,
}: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
    width: number;
    height: number;
    zoom: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!banner.backgroundImageSrc || !previewRef.current) {
      return;
    }

    const rect = previewRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocusX: banner.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
      startFocusY: banner.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
      width: rect.width,
      height: rect.height,
      zoom: banner.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM,
    };
    setIsDragging(true);
    previewRef.current.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const zoomFactor = Math.max(dragState.zoom, 1);
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const nextFocusX = dragState.startFocusX - (deltaX / dragState.width) * (100 / zoomFactor);
    const nextFocusY = dragState.startFocusY - (deltaY / dragState.height) * (100 / zoomFactor);

    onChange(banner.id, {
      imageFocusXPercent: nextFocusX,
      imageFocusYPercent: nextFocusY,
    });
  }

  function finishDrag(event?: React.PointerEvent<HTMLDivElement>) {
    if (event && previewRef.current && dragStateRef.current?.pointerId === event.pointerId) {
      previewRef.current.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }

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

      {banner.backgroundImageSrc ? (
        <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
          Drag inside the preview to choose the visible part of the image, then fine-tune with zoom and focus sliders.
        </div>
      ) : null}

      <div
        ref={previewRef}
        className="overflow-hidden rounded-[8px]"
        style={{
          border: isDragging ? '1px solid rgba(0, 230, 118, 0.5)' : '1px solid var(--t-border)',
          background: 'rgba(5,8,18,0.22)',
          cursor: banner.backgroundImageSrc ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <HeroBannerCard banner={banner} heightPx={heightPx} className="pointer-events-none select-none" />
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
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Font Family
          </label>
          <select
            value={banner.fontPresetId ?? 'modern'}
            onChange={(event) =>
              onChange(banner.id, { fontPresetId: event.target.value as HeroBannerFontPresetId })
            }
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          >
            {Object.entries(HERO_BANNER_FONT_PRESETS).map(([fontPresetId, fontPresetMeta]) => (
              <option key={fontPresetId} value={fontPresetId}>
                {fontPresetMeta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Content Align
          </label>
          <select
            value={banner.contentAlign ?? 'center'}
            onChange={(event) =>
              onChange(banner.id, { contentAlign: event.target.value as HeroBannerContentAlign })
            }
            className="input-shell w-full px-3 py-1.5 text-[12px]"
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Font Scale: {(banner.fontScale ?? 1).toFixed(2)}x
          </label>
          <input
            type="range"
            min="0.75"
            max="1.4"
            step="0.05"
            value={banner.fontScale ?? 1}
            onChange={(event) =>
              onChange(banner.id, {
                fontScale: normalizeHeroBannerFontScale(Number(event.target.value), 1),
              })
            }
            className="w-full accent-green-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
          Colors
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <ColorField
            label="Gradient From"
            value={banner.backgroundFrom ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].backgroundFrom}
            onChange={(nextValue) => onChange(banner.id, { backgroundFrom: nextValue })}
          />
          <ColorField
            label="Gradient To"
            value={banner.backgroundTo ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].backgroundTo}
            onChange={(nextValue) => onChange(banner.id, { backgroundTo: nextValue })}
          />
          <ColorField
            label="Border"
            value={banner.borderColor ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].borderColor}
            onChange={(nextValue) => onChange(banner.id, { borderColor: nextValue })}
          />
          <ColorField
            label="Eyebrow"
            value={banner.eyebrowColor ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].eyebrowColor}
            onChange={(nextValue) => onChange(banner.id, { eyebrowColor: nextValue })}
          />
          <ColorField
            label="Title"
            value={banner.titleColor ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].titleColor}
            onChange={(nextValue) => onChange(banner.id, { titleColor: nextValue })}
          />
          <ColorField
            label="Offer Text"
            value={banner.offerColor ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].offerColor}
            onChange={(nextValue) => onChange(banner.id, { offerColor: nextValue })}
          />
          <ColorField
            label="CTA Background"
            value={banner.ctaBackground ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].buttonBackground}
            onChange={(nextValue) => onChange(banner.id, { ctaBackground: nextValue })}
          />
          <ColorField
            label="CTA Text"
            value={banner.ctaColor ?? HERO_BANNER_THEMES[banner.themeId ?? 'graphite'].buttonColor}
            onChange={(nextValue) => onChange(banner.id, { ctaColor: nextValue })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="chrome-btn inline-flex cursor-pointer items-center rounded px-3 py-1.5 text-[12px] font-bold transition-all"
            style={{ color: 'var(--t-text-2)' }}
          >
            {isUploadingImage
              ? 'Uploading...'
              : banner.backgroundImageSrc
                ? 'Replace Background Image'
                : 'Upload Background Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingImage}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';

                if (!file) {
                  return;
                }

                await onUploadImage(banner.id, file);
              }}
            />
          </label>

          {banner.backgroundImageSrc ? (
            <button
              type="button"
              onClick={() => onClearImage(banner.id)}
              className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all"
              style={{ color: 'var(--t-text-3)' }}
            >
              Remove Background
            </button>
          ) : null}
        </div>

        <div className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
          Add an optional photo background behind the gradient. The image stays local in the admin browser profile.
        </div>

        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Image Opacity: {((banner.backgroundImageOpacity ?? 0.42) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.08"
            max="1"
            step="0.02"
            value={banner.backgroundImageOpacity ?? 0.42}
            onChange={(event) =>
              onChange(banner.id, {
                backgroundImageOpacity: Number(event.target.value),
              })
            }
            className="w-full accent-green-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onChange(banner.id, {
                imageFocusXPercent: DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                imageFocusYPercent: DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                imageZoom: DEFAULT_HERO_BANNER_IMAGE_ZOOM,
              })
            }
            disabled={!banner.backgroundImageSrc}
            className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
          >
            Reset Crop
          </button>
        </div>

        <div>
          <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            Image Zoom: {(banner.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM).toFixed(2)}x
          </label>
          <input
            type="range"
            min={String(MIN_HERO_BANNER_IMAGE_ZOOM)}
            max={String(MAX_HERO_BANNER_IMAGE_ZOOM)}
            step="0.01"
            value={banner.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM}
            onChange={(event) =>
              onChange(banner.id, {
                imageZoom: normalizeHeroBannerImageZoom(Number(event.target.value), DEFAULT_HERO_BANNER_IMAGE_ZOOM),
              })
            }
            disabled={!banner.backgroundImageSrc}
            className="w-full accent-green-400 disabled:opacity-40"
          />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Horizontal Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={banner.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT}
              onChange={(event) =>
                onChange(banner.id, {
                  imageFocusXPercent: normalizeHeroBannerFocusPercent(
                    Number(event.target.value),
                    DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                  ),
                })
              }
              disabled={!banner.backgroundImageSrc}
              className="w-full accent-green-400 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              Vertical Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={banner.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT}
              onChange={(event) =>
                onChange(banner.id, {
                  imageFocusYPercent: normalizeHeroBannerFocusPercent(
                    Number(event.target.value),
                    DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                  ),
                })
              }
              disabled={!banner.backgroundImageSrc}
              className="w-full accent-green-400 disabled:opacity-40"
            />
          </div>
        </div>

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
