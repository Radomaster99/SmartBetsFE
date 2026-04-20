export const SIDE_ADS_STORAGE_KEY = 'smartbets:side-ads';
export const SIDE_ADS_UPDATED_EVENT = 'smartbets:side-ads-updated';
export const DESKTOP_SIDE_AD_WIDTH_PX = 248;
export const DESKTOP_SIDE_AD_MIN_WIDTH_PX = 132;
export const DESKTOP_SIDE_AD_WIDTH_CSS = `clamp(${DESKTOP_SIDE_AD_MIN_WIDTH_PX}px, 14vw, ${DESKTOP_SIDE_AD_WIDTH_PX}px)`;
export const DESKTOP_SIDE_AD_HEIGHT_RATIO = 2.2;
export const DEFAULT_SIDE_AD_FOCUS_PERCENT = 50;
export const DEFAULT_SIDE_AD_ZOOM = 1;
export const MIN_SIDE_AD_ZOOM = 0.45;
export const MAX_SIDE_AD_ZOOM = 2.75;

export type SideAdSlotId = 'left' | 'right';

export type SideAdSlotConfig = {
  imageSrc: string;
  isClickable?: boolean;
  href?: string;
  alt?: string;
  focusXPercent?: number;
  focusYPercent?: number;
  zoom?: number;
  updatedAtUtc?: string;
};

export type SideAdsConfig = Record<SideAdSlotId, SideAdSlotConfig | null>;

export const EMPTY_SIDE_ADS_CONFIG: SideAdsConfig = {
  left: null,
  right: null,
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampZoom(value: number): number {
  return Math.min(MAX_SIDE_AD_ZOOM, Math.max(MIN_SIDE_AD_ZOOM, value));
}

export function normalizeSideAdFocusPercent(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SIDE_AD_FOCUS_PERCENT;
  }

  return clampPercent(value);
}

export function normalizeSideAdZoom(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SIDE_AD_ZOOM;
  }

  return clampZoom(value);
}

export function buildSideAdImageStyle(slot: SideAdSlotConfig): Record<string, string | number> {
  return {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${normalizeSideAdFocusPercent(slot.focusXPercent)}% ${normalizeSideAdFocusPercent(slot.focusYPercent)}%`,
    transform: `scale(${normalizeSideAdZoom(slot.zoom)})`,
    transformOrigin: `${normalizeSideAdFocusPercent(slot.focusXPercent)}% ${normalizeSideAdFocusPercent(slot.focusYPercent)}%`,
    willChange: 'transform, object-position',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserDrag: 'none',
  };
}

function normalizeSideAdSlot(value: unknown): SideAdSlotConfig | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const imageSrc = typeof candidate.imageSrc === 'string' ? candidate.imageSrc : '';

  if (!imageSrc) {
    return null;
  }

  return {
    imageSrc,
    isClickable: typeof candidate.isClickable === 'boolean' ? candidate.isClickable : Boolean(candidate.href),
    href: typeof candidate.href === 'string' ? candidate.href : '',
    alt: typeof candidate.alt === 'string' ? candidate.alt : '',
    focusXPercent: normalizeSideAdFocusPercent(candidate.focusXPercent),
    focusYPercent: normalizeSideAdFocusPercent(candidate.focusYPercent),
    zoom: normalizeSideAdZoom(candidate.zoom),
    updatedAtUtc: typeof candidate.updatedAtUtc === 'string' ? candidate.updatedAtUtc : '',
  };
}

export function readSideAdsConfig(): SideAdsConfig {
  if (typeof window === 'undefined') {
    return EMPTY_SIDE_ADS_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(SIDE_ADS_STORAGE_KEY);

    if (!raw) {
      return EMPTY_SIDE_ADS_CONFIG;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      left: normalizeSideAdSlot(parsed.left),
      right: normalizeSideAdSlot(parsed.right),
    };
  } catch {
    return EMPTY_SIDE_ADS_CONFIG;
  }
}

export function writeSideAdsConfig(config: SideAdsConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SIDE_ADS_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(SIDE_ADS_UPDATED_EVENT));
}
