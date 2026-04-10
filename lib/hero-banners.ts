export const HERO_BANNERS_STORAGE_KEY = 'smartbets:hero-banners';
export const HERO_BANNER_LAYOUT_STORAGE_KEY = 'smartbets:hero-banner-layout';
export const HERO_BANNERS_UPDATED_EVENT = 'smartbets:hero-banners-updated';
export const DEFAULT_HERO_BANNER_FOCUS_PERCENT = 50;
export const DEFAULT_HERO_BANNER_IMAGE_ZOOM = 1;
export const MIN_HERO_BANNER_IMAGE_ZOOM = 0.7;
export const MAX_HERO_BANNER_IMAGE_ZOOM = 2.5;
export const DEFAULT_HERO_BANNER_HEIGHT_PX = 112;
export const MIN_HERO_BANNER_HEIGHT_PX = 88;
export const MAX_HERO_BANNER_HEIGHT_PX = 140;

export type HeroBannerSlotId = 'slot-1' | 'slot-2' | 'slot-3';
export type HeroBannerThemeId =
  | 'graphite'
  | 'teal'
  | 'orange'
  | 'crimson'
  | 'royal'
  | 'emerald'
  | 'violet'
  | 'slate';
export type HeroBannerFontPresetId = 'modern' | 'condensed' | 'editorial' | 'mono';
export type HeroBannerContentAlign = 'left' | 'center';

export type HeroBannerLayoutConfig = {
  heightPx: number;
};

export type HeroBannerConfig = {
  id: HeroBannerSlotId;
  bookmaker: string;
  eyebrow: string;
  offer: string;
  cta: string;
  href?: string;
  isClickable?: boolean;
  themeId?: HeroBannerThemeId;
  fontPresetId?: HeroBannerFontPresetId;
  fontScale?: number;
  contentAlign?: HeroBannerContentAlign;
  backgroundFrom?: string;
  backgroundTo?: string;
  borderColor?: string;
  eyebrowColor?: string;
  titleColor?: string;
  offerColor?: string;
  ctaBackground?: string;
  ctaColor?: string;
  backgroundImageSrc?: string;
  backgroundImageOpacity?: number;
  imageFocusXPercent?: number;
  imageFocusYPercent?: number;
  imageZoom?: number;
  updatedAtUtc?: string;
};

export const HERO_BANNER_THEMES: Record<
  HeroBannerThemeId,
  {
    label: string;
    backgroundFrom: string;
    backgroundTo: string;
    borderColor: string;
    eyebrowColor: string;
    titleColor: string;
    offerColor: string;
    buttonBackground: string;
    buttonColor: string;
  }
> = {
  graphite: {
    label: 'Graphite',
    backgroundFrom: '#06080d',
    backgroundTo: '#151a24',
    borderColor: '#2d3446',
    eyebrowColor: '#a8b1c7',
    titleColor: '#ffffff',
    offerColor: '#eff4ff',
    buttonBackground: '#ffffff',
    buttonColor: '#101521',
  },
  teal: {
    label: 'Teal',
    backgroundFrom: '#0f6a72',
    backgroundTo: '#103d45',
    borderColor: '#2f7f88',
    eyebrowColor: '#c1f3f6',
    titleColor: '#ffffff',
    offerColor: '#e9ffff',
    buttonBackground: '#ffffff',
    buttonColor: '#103d45',
  },
  orange: {
    label: 'Orange',
    backgroundFrom: '#ff9817',
    backgroundTo: '#ff6d0b',
    borderColor: '#ffc279',
    eyebrowColor: '#fff1dc',
    titleColor: '#ffffff',
    offerColor: '#fff7eb',
    buttonBackground: '#ffffff',
    buttonColor: '#ff6d0b',
  },
  crimson: {
    label: 'Crimson',
    backgroundFrom: '#7d102c',
    backgroundTo: '#49101f',
    borderColor: '#b44d69',
    eyebrowColor: '#f8d6e0',
    titleColor: '#fff6f8',
    offerColor: '#ffe8ee',
    buttonBackground: '#fff0f4',
    buttonColor: '#6c1026',
  },
  royal: {
    label: 'Royal Blue',
    backgroundFrom: '#234ba8',
    backgroundTo: '#152447',
    borderColor: '#5b84df',
    eyebrowColor: '#d7e4ff',
    titleColor: '#ffffff',
    offerColor: '#ebf1ff',
    buttonBackground: '#ffffff',
    buttonColor: '#1c3170',
  },
  emerald: {
    label: 'Emerald',
    backgroundFrom: '#0f7255',
    backgroundTo: '#0c362d',
    borderColor: '#3da27f',
    eyebrowColor: '#d7fff0',
    titleColor: '#f4fff9',
    offerColor: '#e3fff4',
    buttonBackground: '#f5fffb',
    buttonColor: '#0d4c3a',
  },
  violet: {
    label: 'Violet',
    backgroundFrom: '#5f31a5',
    backgroundTo: '#2d184d',
    borderColor: '#9167cb',
    eyebrowColor: '#ece1ff',
    titleColor: '#ffffff',
    offerColor: '#f2ecff',
    buttonBackground: '#faf6ff',
    buttonColor: '#44227f',
  },
  slate: {
    label: 'Slate',
    backgroundFrom: '#314563',
    backgroundTo: '#182131',
    borderColor: '#647c9f',
    eyebrowColor: '#d8e2f1',
    titleColor: '#ffffff',
    offerColor: '#edf4ff',
    buttonBackground: '#ffffff',
    buttonColor: '#223148',
  },
};

export const HERO_BANNER_FONT_PRESETS: Record<
  HeroBannerFontPresetId,
  {
    label: string;
    fontFamily: string;
  }
> = {
  modern: {
    label: 'Modern Sans',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  condensed: {
    label: 'Condensed',
    fontFamily: "'Arial Narrow', 'Roboto Condensed', 'Inter', sans-serif",
  },
  editorial: {
    label: 'Editorial Serif',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  mono: {
    label: 'Mono',
    fontFamily: "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};

export const DEFAULT_HERO_BANNERS: HeroBannerConfig[] = [
  {
    id: 'slot-1',
    bookmaker: 'Bet365',
    eyebrow: 'Sponsored',
    offer: 'Football prices and fast access.',
    cta: 'CLAIM',
    href: '/go/bet365?source=football-board-banner',
    isClickable: true,
    themeId: 'graphite',
    fontPresetId: 'modern',
    fontScale: 1,
    contentAlign: 'center',
  },
  {
    id: 'slot-2',
    bookmaker: 'Pinnacle',
    eyebrow: 'Sponsored',
    offer: 'Live and pre-match bonus flow.',
    cta: 'CLAIM',
    href: '/go/pinnacle?source=football-board-banner',
    isClickable: true,
    themeId: 'teal',
    fontPresetId: 'modern',
    fontScale: 1,
    contentAlign: 'center',
  },
  {
    id: 'slot-3',
    bookmaker: 'Betano',
    eyebrow: 'Sponsored',
    offer: 'Matchday offer and quick entry.',
    cta: 'CLAIM',
    href: '/go/betano?source=football-board-banner',
    isClickable: true,
    themeId: 'orange',
    fontPresetId: 'modern',
    fontScale: 1,
    contentAlign: 'center',
  },
];

export const DEFAULT_HERO_BANNER_LAYOUT: HeroBannerLayoutConfig = {
  heightPx: DEFAULT_HERO_BANNER_HEIGHT_PX,
};

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizeOptionalColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampImageZoom(value: number): number {
  return Math.min(MAX_HERO_BANNER_IMAGE_ZOOM, Math.max(MIN_HERO_BANNER_IMAGE_ZOOM, value));
}

function clampHeroBannerHeight(value: number): number {
  return Math.min(MAX_HERO_BANNER_HEIGHT_PX, Math.max(MIN_HERO_BANNER_HEIGHT_PX, value));
}

export function normalizeHeroBannerFontScale(value: unknown, fallback = 1): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1.4, Math.max(0.75, Number(value.toFixed(2))));
}

export function normalizeHeroBannerImageOpacity(value: unknown, fallback = 0.42): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0.08, Number(value.toFixed(2))));
}

export function normalizeHeroBannerFocusPercent(
  value: unknown,
  fallback = DEFAULT_HERO_BANNER_FOCUS_PERCENT,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return clampPercent(value);
}

export function normalizeHeroBannerImageZoom(
  value: unknown,
  fallback = DEFAULT_HERO_BANNER_IMAGE_ZOOM,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return clampImageZoom(value);
}

export function normalizeHeroBannerHeight(
  value: unknown,
  fallback = DEFAULT_HERO_BANNER_HEIGHT_PX,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return clampHeroBannerHeight(Math.round(value));
}

function normalizeHeroBanner(candidate: unknown, fallback: HeroBannerConfig): HeroBannerConfig {
  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const value = candidate as Record<string, unknown>;
  const themeId =
    typeof value.themeId === 'string' && value.themeId in HERO_BANNER_THEMES
      ? (value.themeId as HeroBannerThemeId)
      : (fallback.themeId ?? 'graphite');
  const fontPresetId =
    typeof value.fontPresetId === 'string' && value.fontPresetId in HERO_BANNER_FONT_PRESETS
      ? (value.fontPresetId as HeroBannerFontPresetId)
      : (fallback.fontPresetId ?? 'modern');
  const contentAlign =
    value.contentAlign === 'left' || value.contentAlign === 'center'
      ? (value.contentAlign as HeroBannerContentAlign)
      : (fallback.contentAlign ?? 'center');
  const theme = HERO_BANNER_THEMES[themeId];

  return {
    id: fallback.id,
    bookmaker: normalizeString(value.bookmaker, fallback.bookmaker),
    eyebrow: normalizeString(value.eyebrow, fallback.eyebrow),
    offer: normalizeString(value.offer, fallback.offer),
    cta: normalizeString(value.cta, fallback.cta),
    href: typeof value.href === 'string' ? value.href : fallback.href,
    isClickable: typeof value.isClickable === 'boolean' ? value.isClickable : Boolean(fallback.href),
    themeId,
    fontPresetId,
    fontScale: normalizeHeroBannerFontScale(value.fontScale, fallback.fontScale ?? 1),
    contentAlign,
    backgroundFrom: normalizeOptionalColor(value.backgroundFrom, fallback.backgroundFrom ?? theme.backgroundFrom),
    backgroundTo: normalizeOptionalColor(value.backgroundTo, fallback.backgroundTo ?? theme.backgroundTo),
    borderColor: normalizeOptionalColor(value.borderColor, fallback.borderColor ?? theme.borderColor),
    eyebrowColor: normalizeOptionalColor(value.eyebrowColor, fallback.eyebrowColor ?? theme.eyebrowColor),
    titleColor: normalizeOptionalColor(value.titleColor, fallback.titleColor ?? theme.titleColor),
    offerColor: normalizeOptionalColor(value.offerColor, fallback.offerColor ?? theme.offerColor),
    ctaBackground: normalizeOptionalColor(value.ctaBackground, fallback.ctaBackground ?? theme.buttonBackground),
    ctaColor: normalizeOptionalColor(value.ctaColor, fallback.ctaColor ?? theme.buttonColor),
    backgroundImageSrc:
      typeof value.backgroundImageSrc === 'string' && value.backgroundImageSrc.trim()
        ? value.backgroundImageSrc
        : fallback.backgroundImageSrc,
    backgroundImageOpacity: normalizeHeroBannerImageOpacity(
      value.backgroundImageOpacity,
      fallback.backgroundImageOpacity ?? 0.42,
    ),
    imageFocusXPercent: normalizeHeroBannerFocusPercent(
      value.imageFocusXPercent,
      fallback.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageFocusYPercent: normalizeHeroBannerFocusPercent(
      value.imageFocusYPercent,
      fallback.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageZoom: normalizeHeroBannerImageZoom(
      value.imageZoom,
      fallback.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM,
    ),
    updatedAtUtc: typeof value.updatedAtUtc === 'string' ? value.updatedAtUtc : fallback.updatedAtUtc,
  };
}

export function resolveHeroBannerAppearance(banner: HeroBannerConfig) {
  const theme = HERO_BANNER_THEMES[banner.themeId ?? 'graphite'];
  const fontPreset = HERO_BANNER_FONT_PRESETS[banner.fontPresetId ?? 'modern'];

  return {
    background: `linear-gradient(180deg, ${banner.backgroundFrom ?? theme.backgroundFrom} 0%, ${banner.backgroundTo ?? theme.backgroundTo} 100%)`,
    borderColor: banner.borderColor ?? theme.borderColor,
    eyebrowColor: banner.eyebrowColor ?? theme.eyebrowColor,
    titleColor: banner.titleColor ?? theme.titleColor,
    offerColor: banner.offerColor ?? theme.offerColor,
    ctaBackground: banner.ctaBackground ?? theme.buttonBackground,
    ctaColor: banner.ctaColor ?? theme.buttonColor,
    backgroundImageSrc: banner.backgroundImageSrc ?? '',
    backgroundImageOpacity: normalizeHeroBannerImageOpacity(banner.backgroundImageOpacity, 0.42),
    imageFocusXPercent: normalizeHeroBannerFocusPercent(
      banner.imageFocusXPercent,
      DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageFocusYPercent: normalizeHeroBannerFocusPercent(
      banner.imageFocusYPercent,
      DEFAULT_HERO_BANNER_FOCUS_PERCENT,
    ),
    imageZoom: normalizeHeroBannerImageZoom(
      banner.imageZoom,
      DEFAULT_HERO_BANNER_IMAGE_ZOOM,
    ),
    fontFamily: fontPreset.fontFamily,
    fontScale: normalizeHeroBannerFontScale(banner.fontScale, 1),
    contentAlign: banner.contentAlign ?? 'center',
  };
}

export function buildHeroBannerImageStyle(banner: HeroBannerConfig): Record<string, string | number> {
  const focusX = normalizeHeroBannerFocusPercent(
    banner.imageFocusXPercent,
    DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  );
  const focusY = normalizeHeroBannerFocusPercent(
    banner.imageFocusYPercent,
    DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  );
  const zoom = normalizeHeroBannerImageZoom(
    banner.imageZoom,
    DEFAULT_HERO_BANNER_IMAGE_ZOOM,
  );

  return {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${focusX}% ${focusY}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${focusX}% ${focusY}%`,
    willChange: 'transform, object-position',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserDrag: 'none',
  };
}

export function readHeroBannersConfig(): HeroBannerConfig[] {
  if (typeof window === 'undefined') {
    return DEFAULT_HERO_BANNERS;
  }

  try {
    const raw = window.localStorage.getItem(HERO_BANNERS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_HERO_BANNERS;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_HERO_BANNERS;
    }

    return DEFAULT_HERO_BANNERS.map((fallback) => {
      const matching = parsed.find(
        (item) => item && typeof item === 'object' && (item as { id?: string }).id === fallback.id,
      );
      return normalizeHeroBanner(matching, fallback);
    });
  } catch {
    return DEFAULT_HERO_BANNERS;
  }
}

export function writeHeroBannersConfig(config: HeroBannerConfig[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HERO_BANNERS_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(HERO_BANNERS_UPDATED_EVENT));
}

export function readHeroBannerLayoutConfig(): HeroBannerLayoutConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_HERO_BANNER_LAYOUT;
  }

  try {
    const raw = window.localStorage.getItem(HERO_BANNER_LAYOUT_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_HERO_BANNER_LAYOUT;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      heightPx: normalizeHeroBannerHeight(parsed.heightPx, DEFAULT_HERO_BANNER_HEIGHT_PX),
    };
  } catch {
    return DEFAULT_HERO_BANNER_LAYOUT;
  }
}

export function writeHeroBannerLayoutConfig(config: HeroBannerLayoutConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HERO_BANNER_LAYOUT_STORAGE_KEY, JSON.stringify({
    heightPx: normalizeHeroBannerHeight(config.heightPx, DEFAULT_HERO_BANNER_HEIGHT_PX),
  }));
  window.dispatchEvent(new CustomEvent(HERO_BANNERS_UPDATED_EVENT));
}
