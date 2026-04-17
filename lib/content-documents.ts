import {
  DEFAULT_BONUS_CODES_PAGE_CONFIG,
  EMPTY_BONUS_CODES_PAGE_CONFIG,
  type BonusCodeEntry,
  type BonusCodeToneId,
  type BonusCodesPageConfig,
  BONUS_CODE_TONES,
} from '@/lib/bonus-codes';
import {
  DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  DEFAULT_HERO_BANNER_HEIGHT_PX,
  DEFAULT_HERO_BANNER_IMAGE_ZOOM,
  DEFAULT_HERO_BANNER_LAYOUT,
  DEFAULT_HERO_BANNERS,
  HERO_BANNER_FONT_PRESETS,
  HERO_BANNER_THEMES,
  type HeroBannerConfig,
  type HeroBannerContentAlign,
  type HeroBannerFontPresetId,
  type HeroBannerLayoutConfig,
  type HeroBannerThemeId,
  normalizeHeroBannerFocusPercent,
  normalizeHeroBannerFontScale,
  normalizeHeroBannerHeight,
  normalizeHeroBannerImageOpacity,
  normalizeHeroBannerImageZoom,
} from '@/lib/hero-banners';
import {
  EMPTY_SIDE_ADS_CONFIG,
  type SideAdSlotConfig,
  type SideAdSlotId,
  type SideAdsConfig,
  normalizeSideAdFocusPercent,
  normalizeSideAdZoom,
} from '@/lib/side-ads';
import {
  DEFAULT_POPULAR_LEAGUES_PRESET,
  normalizePopularLeaguePreset,
  type PopularLeaguePreset,
} from '@/lib/popular-leagues';

export type ContentDocumentId = 'bonus-codes' | 'hero-banners' | 'side-ads' | 'popular-leagues';

export interface HeroBannersContentDocument {
  banners: HeroBannerConfig[];
  layout: HeroBannerLayoutConfig;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeBonusTone(value: unknown, fallback: BonusCodeToneId): BonusCodeToneId {
  return typeof value === 'string' && value in BONUS_CODE_TONES ? (value as BonusCodeToneId) : fallback;
}

function normalizeBonusCodeEntry(value: unknown, fallback: BonusCodeEntry): BonusCodeEntry {
  const candidate = asRecord(value);
  if (!candidate) {
    return fallback;
  }

  return {
    id: normalizeString(candidate.id, fallback.id),
    bookmaker: normalizeString(candidate.bookmaker, fallback.bookmaker),
    badge: normalizeOptionalString(candidate.badge, fallback.badge ?? ''),
    offer: normalizeString(candidate.offer, fallback.offer),
    code: normalizeString(candidate.code, fallback.code),
    description: normalizeString(candidate.description, fallback.description),
    terms: normalizeOptionalString(candidate.terms, fallback.terms ?? ''),
    ctaLabel: normalizeString(candidate.ctaLabel, fallback.ctaLabel),
    href: normalizeOptionalString(candidate.href, fallback.href ?? ''),
    isActive: normalizeBoolean(candidate.isActive, fallback.isActive),
    isFeatured: normalizeBoolean(candidate.isFeatured, fallback.isFeatured),
    toneId: normalizeBonusTone(candidate.toneId, fallback.toneId),
    updatedAtUtc:
      typeof candidate.updatedAtUtc === 'string' && candidate.updatedAtUtc.trim()
        ? candidate.updatedAtUtc
        : fallback.updatedAtUtc,
    isExpandable:
      typeof candidate.isExpandable === 'boolean'
        ? candidate.isExpandable
        : fallback.isExpandable ?? false,
  };
}

export function serializeBonusCodesDocument(config: BonusCodesPageConfig): unknown[] {
  return [
    {
      kind: 'copy',
      ...config.copy,
    },
    ...config.entries.map((entry) => ({
      kind: 'entry',
      ...entry,
    })),
  ];
}

export function deserializeBonusCodesDocument(
  value: unknown,
  fallback: BonusCodesPageConfig = EMPTY_BONUS_CODES_PAGE_CONFIG,
): BonusCodesPageConfig {
  const rows = asArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const copyRow =
    rows.find((row) => {
      const candidate = asRecord(row);
      return candidate?.kind === 'copy' || candidate?.type === 'copy';
    }) ?? null;

  const copyCandidate = asRecord(copyRow);
  const copy = {
    eyebrow: normalizeString(copyCandidate?.eyebrow, fallback.copy.eyebrow),
    title: normalizeString(copyCandidate?.title, fallback.copy.title),
    subtitle: normalizeString(copyCandidate?.subtitle, fallback.copy.subtitle),
    featuredLabel: normalizeString(copyCandidate?.featuredLabel, fallback.copy.featuredLabel),
    allLabel: normalizeString(copyCandidate?.allLabel, fallback.copy.allLabel),
  };

  const entryRows = rows.filter((row) => {
    const candidate = asRecord(row);
    if (!candidate) {
      return false;
    }

    if (candidate.kind === 'entry' || candidate.type === 'entry') {
      return true;
    }

    return typeof candidate.bookmaker === 'string' || typeof candidate.offer === 'string';
  });

  const entries =
    entryRows.length > 0
      ? entryRows.map((row, index) =>
          normalizeBonusCodeEntry(
            row,
            fallback.entries[index] ?? {
              ...fallback.entries[0],
              id: `bonus-entry-${index + 1}`,
            },
          ),
        )
      : [];

  return { copy, entries };
}

function normalizeHeroBannerTheme(value: unknown, fallback: HeroBannerThemeId): HeroBannerThemeId {
  return typeof value === 'string' && value in HERO_BANNER_THEMES
    ? (value as HeroBannerThemeId)
    : fallback;
}

function normalizeHeroFontPreset(value: unknown, fallback: HeroBannerFontPresetId): HeroBannerFontPresetId {
  return typeof value === 'string' && value in HERO_BANNER_FONT_PRESETS
    ? (value as HeroBannerFontPresetId)
    : fallback;
}

function normalizeHeroContentAlign(value: unknown, fallback: HeroBannerContentAlign): HeroBannerContentAlign {
  return value === 'left' || value === 'center' ? (value as HeroBannerContentAlign) : fallback;
}

function normalizeHeroBanner(value: unknown, fallback: HeroBannerConfig): HeroBannerConfig {
  const candidate = asRecord(value);
  if (!candidate) {
    return fallback;
  }

  const themeId = normalizeHeroBannerTheme(candidate.themeId, fallback.themeId ?? 'graphite');
  const fontPresetId = normalizeHeroFontPreset(candidate.fontPresetId, fallback.fontPresetId ?? 'modern');

  return {
    id: fallback.id,
    bookmaker: normalizeString(candidate.bookmaker, fallback.bookmaker),
    eyebrow: normalizeString(candidate.eyebrow, fallback.eyebrow),
    offer: normalizeString(candidate.offer, fallback.offer),
    cta: normalizeString(candidate.cta, fallback.cta),
    href: normalizeOptionalString(candidate.href, fallback.href ?? ''),
    isClickable: normalizeBoolean(candidate.isClickable, fallback.isClickable ?? Boolean(fallback.href)),
    themeId,
    fontPresetId,
    fontScale: normalizeHeroBannerFontScale(candidate.fontScale, fallback.fontScale ?? 1),
    contentAlign: normalizeHeroContentAlign(candidate.contentAlign, fallback.contentAlign ?? 'center'),
    backgroundFrom: normalizeOptionalString(candidate.backgroundFrom, fallback.backgroundFrom ?? ''),
    backgroundTo: normalizeOptionalString(candidate.backgroundTo, fallback.backgroundTo ?? ''),
    borderColor: normalizeOptionalString(candidate.borderColor, fallback.borderColor ?? ''),
    eyebrowColor: normalizeOptionalString(candidate.eyebrowColor, fallback.eyebrowColor ?? ''),
    titleColor: normalizeOptionalString(candidate.titleColor, fallback.titleColor ?? ''),
    offerColor: normalizeOptionalString(candidate.offerColor, fallback.offerColor ?? ''),
    ctaBackground: normalizeOptionalString(candidate.ctaBackground, fallback.ctaBackground ?? ''),
    ctaColor: normalizeOptionalString(candidate.ctaColor, fallback.ctaColor ?? ''),
    backgroundImageSrc: normalizeOptionalString(candidate.backgroundImageSrc, fallback.backgroundImageSrc ?? ''),
    backgroundImageOpacity: normalizeHeroBannerImageOpacity(
      candidate.backgroundImageOpacity,
      fallback.backgroundImageOpacity ?? 0.42,
    ),
    imageFocusXPercent: normalizeHeroBannerFocusPercent(
      candidate.imageFocusXPercent,
      fallback.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageFocusYPercent: normalizeHeroBannerFocusPercent(
      candidate.imageFocusYPercent,
      fallback.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageZoom: normalizeHeroBannerImageZoom(candidate.imageZoom, fallback.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM),
    updatedAtUtc:
      typeof candidate.updatedAtUtc === 'string' && candidate.updatedAtUtc.trim()
        ? candidate.updatedAtUtc
        : fallback.updatedAtUtc,
  };
}

export function serializeHeroBannersDocument(content: HeroBannersContentDocument): unknown[] {
  return [
    {
      kind: 'layout',
      heightPx: content.layout.heightPx,
    },
    ...content.banners.map((banner) => ({
      kind: 'banner',
      ...banner,
    })),
  ];
}

export function deserializeHeroBannersDocument(
  value: unknown,
  fallback: HeroBannersContentDocument = {
    banners: DEFAULT_HERO_BANNERS,
    layout: DEFAULT_HERO_BANNER_LAYOUT,
  },
): HeroBannersContentDocument {
  const rows = asArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const layoutRow =
    rows.find((row) => {
      const candidate = asRecord(row);
      return candidate?.kind === 'layout' || candidate?.type === 'layout';
    }) ?? null;

  const layoutCandidate = asRecord(layoutRow);
  const layout: HeroBannerLayoutConfig = {
    heightPx: normalizeHeroBannerHeight(layoutCandidate?.heightPx, fallback.layout.heightPx ?? DEFAULT_HERO_BANNER_HEIGHT_PX),
  };

  const banners = fallback.banners.map((fallbackBanner) => {
    const matching = rows.find((row) => {
      const candidate = asRecord(row);
      if (!candidate) {
        return false;
      }

      if (candidate.kind === 'layout' || candidate.type === 'layout') {
        return false;
      }

      return candidate.id === fallbackBanner.id;
    });

    return normalizeHeroBanner(matching, fallbackBanner);
  });

  return { banners, layout };
}

function normalizeSideAdSlot(value: unknown): SideAdSlotConfig | null {
  const candidate = asRecord(value);
  if (!candidate) {
    return null;
  }

  const imageSrc = normalizeOptionalString(candidate.imageSrc, '');
  if (!imageSrc) {
    return null;
  }

  return {
    imageSrc,
    isClickable: normalizeBoolean(candidate.isClickable, Boolean(candidate.href)),
    href: normalizeOptionalString(candidate.href, ''),
    alt: normalizeOptionalString(candidate.alt, ''),
    focusXPercent: normalizeSideAdFocusPercent(candidate.focusXPercent),
    focusYPercent: normalizeSideAdFocusPercent(candidate.focusYPercent),
    zoom: normalizeSideAdZoom(candidate.zoom),
    updatedAtUtc:
      typeof candidate.updatedAtUtc === 'string' && candidate.updatedAtUtc.trim()
        ? candidate.updatedAtUtc
        : '',
  };
}

export function serializeSideAdsDocument(config: SideAdsConfig): unknown[] {
  return (['left', 'right'] as const)
    .map((slotId) => {
      const slot = config[slotId];
      if (!slot) {
        return null;
      }

      return {
        slot: slotId,
        ...slot,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function deserializeSideAdsDocument(
  value: unknown,
  fallback: SideAdsConfig = EMPTY_SIDE_ADS_CONFIG,
): SideAdsConfig {
  const rows = asArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const next: SideAdsConfig = {
    left: fallback.left,
    right: fallback.right,
  };

  for (const row of rows) {
    const candidate = asRecord(row);
    const slotId =
      candidate?.slot === 'left' || candidate?.slotId === 'left'
        ? 'left'
        : candidate?.slot === 'right' || candidate?.slotId === 'right'
          ? 'right'
          : null;

    if (!slotId) {
      continue;
    }

    next[slotId as SideAdSlotId] = normalizeSideAdSlot(candidate);
  }

  return next;
}

export function serializePopularLeaguesDocument(items: PopularLeaguePreset[]): unknown[] {
  return items.map((item) => ({
    leagueId: item.leagueId,
    displayName: item.displayName,
    ...(item.season != null ? { season: item.season } : {}),
  }));
}

export function deserializePopularLeaguesDocument(
  value: unknown,
  fallback: PopularLeaguePreset[] = DEFAULT_POPULAR_LEAGUES_PRESET,
): PopularLeaguePreset[] {
  const rows = asArray(value);
  if (rows.length === 0) {
    return fallback;
  }

  const normalized = rows
    .map((row) => normalizePopularLeaguePreset(row))
    .filter((item): item is PopularLeaguePreset => item !== null);

  return normalized.length > 0 ? normalized : fallback;
}
