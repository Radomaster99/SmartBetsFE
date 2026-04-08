export const HERO_BANNERS_STORAGE_KEY = 'smartbets:hero-banners';
export const HERO_BANNERS_UPDATED_EVENT = 'smartbets:hero-banners-updated';

export type HeroBannerSlotId = 'slot-1' | 'slot-2' | 'slot-3';
export type HeroBannerThemeId = 'graphite' | 'teal' | 'orange';

export type HeroBannerConfig = {
  id: HeroBannerSlotId;
  bookmaker: string;
  eyebrow: string;
  offer: string;
  cta: string;
  href?: string;
  isClickable?: boolean;
  themeId?: HeroBannerThemeId;
  updatedAtUtc?: string;
};

export const HERO_BANNER_THEMES: Record<
  HeroBannerThemeId,
  {
    label: string;
    background: string;
    border: string;
    buttonBackground: string;
    buttonColor: string;
  }
> = {
  graphite: {
    label: 'Graphite',
    background: 'linear-gradient(180deg, #050608 0%, #0d1016 100%)',
    border: 'rgba(255,255,255,0.08)',
    buttonBackground: '#ffffff',
    buttonColor: '#0d1016',
  },
  teal: {
    label: 'Teal',
    background: 'linear-gradient(180deg, #0b5157 0%, #0d3f45 100%)',
    border: 'rgba(255,255,255,0.08)',
    buttonBackground: '#ffffff',
    buttonColor: '#0d3f45',
  },
  orange: {
    label: 'Orange',
    background: 'linear-gradient(180deg, #ff8a00 0%, #ff6a00 100%)',
    border: 'rgba(255,255,255,0.18)',
    buttonBackground: '#ffffff',
    buttonColor: '#ff6a00',
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
  },
];

function normalizeHeroBanner(candidate: unknown, fallback: HeroBannerConfig): HeroBannerConfig {
  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const value = candidate as Record<string, unknown>;
  const themeId = typeof value.themeId === 'string' && value.themeId in HERO_BANNER_THEMES
    ? (value.themeId as HeroBannerThemeId)
    : fallback.themeId;

  return {
    id: fallback.id,
    bookmaker: typeof value.bookmaker === 'string' && value.bookmaker.trim() ? value.bookmaker : fallback.bookmaker,
    eyebrow: typeof value.eyebrow === 'string' && value.eyebrow.trim() ? value.eyebrow : fallback.eyebrow,
    offer: typeof value.offer === 'string' && value.offer.trim() ? value.offer : fallback.offer,
    cta: typeof value.cta === 'string' && value.cta.trim() ? value.cta : fallback.cta,
    href: typeof value.href === 'string' ? value.href : fallback.href,
    isClickable: typeof value.isClickable === 'boolean' ? value.isClickable : Boolean(fallback.href),
    themeId,
    updatedAtUtc: typeof value.updatedAtUtc === 'string' ? value.updatedAtUtc : fallback.updatedAtUtc,
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
      const matching = parsed.find((item) => item && typeof item === 'object' && (item as { id?: string }).id === fallback.id);
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
