/**
 * Bookmaker slug/URL registry.
 * ReferralUrl values here are placeholder homepage links until
 * real affiliate URLs are configured in the backend BookmakerDto.
 * Replace values with affiliate links (with your tracking tag) when available.
 */

const BOOKMAKER_REGISTRY: Record<string, string> = {
  // Bet365
  'bet365':                'https://www.bet365.com',
  // Unibet
  'unibet':                'https://www.unibet.com',
  // William Hill — API-Football returns "William Hill"
  'william-hill':          'https://www.williamhill.com',
  'williamhill':           'https://www.williamhill.com',
  // Bwin
  'bwin':                  'https://www.bwin.com',
  // Betfair — both sportsbook and exchange
  'betfair':               'https://www.betfair.com',
  'betfair-exchange':      'https://www.betfair.com/exchange',
  'betfair-sportsbook':    'https://www.betfair.com',
  // 1xBet — API may return "1xBet" or "1X Bet"
  '1xbet':                 'https://www.1xbet.com',
  '1x-bet':                'https://www.1xbet.com',
  // Betway
  'betway':                'https://www.betway.com',
  // Pinnacle — API may return "Pinnacle Sports"
  'pinnacle':              'https://www.pinnacle.com',
  'pinnacle-sports':       'https://www.pinnacle.com',
  // Marathonbet
  'marathonbet':           'https://www.marathonbet.com',
  'marathon-bet':          'https://www.marathonbet.com',
  // Betclic
  'betclic':               'https://www.betclic.com',
  // Interwetten
  'interwetten':           'https://www.interwetten.com',
  // 888sport — API may return "888Sport" or "888sport"
  '888sport':              'https://www.888sport.com',
  '888-sport':             'https://www.888sport.com',
  // Ladbrokes
  'ladbrokes':             'https://www.ladbrokes.com',
  // Coral
  'coral':                 'https://www.coral.co.uk',
  // Paddy Power
  'paddy-power':           'https://www.paddypower.com',
  'paddypower':            'https://www.paddypower.com',
  // Sky Bet
  'skybet':                'https://www.skybet.com',
  'sky-bet':               'https://www.skybet.com',
  // Sportingbet
  'sportingbet':           'https://www.sportingbet.com',
  'sporting-bet':          'https://www.sportingbet.com',
  // Betsson
  'betsson':               'https://www.betsson.com',
  // NordicBet
  'nordicbet':             'https://www.nordicbet.com',
  'nordic-bet':            'https://www.nordicbet.com',
  // Betsafe
  'betsafe':               'https://www.betsafe.com',
  // Coolbet
  'coolbet':               'https://www.coolbet.com',
  // Betano — common in Eastern/Southern Europe
  'betano':                'https://www.betano.com',
  // Fortuna
  'fortuna':               'https://www.fortuna.com',
  // SuperBet
  'superbet':              'https://www.superbet.com',
  'super-bet':             'https://www.superbet.com',
};

type BookmakerMetaSeed = {
  order: number;
  short: string;
  accent: string;
  faviconUrl?: string;
};

export type BookmakerMeta = Omit<BookmakerMetaSeed, 'faviconUrl'> & {
  slug: string;
  name: string;
  logoText: string;
  faviconUrl: string | null;
};

const BOOKMAKER_META_REGISTRY: Record<string, BookmakerMetaSeed> = {
  'bet365':             { order: 1,  short: 'B365', accent: '#1db954', faviconUrl: 'https://www.bet365.com/favicon.ico' },
  'pinnacle':           { order: 2,  short: 'PIN',  accent: '#ef4444', faviconUrl: 'https://www.pinnacle.com/favicon.ico' },
  'pinnacle-sports':    { order: 2,  short: 'PIN',  accent: '#ef4444', faviconUrl: 'https://www.pinnacle.com/favicon.ico' },
  'betfair':            { order: 3,  short: 'BF',   accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'betfair-exchange':   { order: 3,  short: 'BFX',  accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'betfair-sportsbook': { order: 4,  short: 'BF',   accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'william-hill':       { order: 5,  short: 'WH',   accent: '#1d4ed8', faviconUrl: 'https://www.williamhill.com/favicon.ico' },
  'williamhill':        { order: 5,  short: 'WH',   accent: '#1d4ed8', faviconUrl: 'https://www.williamhill.com/favicon.ico' },
  'unibet':             { order: 6,  short: 'UNI',  accent: '#16a34a', faviconUrl: 'https://www.unibet.com/favicon.ico' },
  'betano':             { order: 7,  short: 'BTN',  accent: '#f97316', faviconUrl: 'https://www.betano.com/favicon.ico' },
  'bwin':               { order: 8,  short: 'BWN',  accent: '#facc15', faviconUrl: 'https://www.bwin.com/favicon.ico' },
  'betway':             { order: 9,  short: 'BTW',  accent: '#22c55e', faviconUrl: 'https://www.betway.com/favicon.ico' },
  '1xbet':              { order: 10, short: '1X',   accent: '#2563eb', faviconUrl: 'https://www.1xbet.com/favicon.ico' },
  '1x-bet':             { order: 10, short: '1X',   accent: '#2563eb', faviconUrl: 'https://www.1xbet.com/favicon.ico' },
  'marathonbet':        { order: 11, short: 'MAR',  accent: '#0ea5e9', faviconUrl: 'https://www.marathonbet.com/favicon.ico' },
  'marathon-bet':       { order: 11, short: 'MAR',  accent: '#0ea5e9', faviconUrl: 'https://www.marathonbet.com/favicon.ico' },
  'betclic':            { order: 12, short: 'BC',   accent: '#ef4444', faviconUrl: 'https://www.betclic.com/favicon.ico' },
  'interwetten':        { order: 13, short: 'IW',   accent: '#e11d48' },
  '888sport':           { order: 14, short: '888',  accent: '#0ea5e9', faviconUrl: 'https://www.888sport.com/favicon.ico' },
  '888-sport':          { order: 14, short: '888',  accent: '#0ea5e9', faviconUrl: 'https://www.888sport.com/favicon.ico' },
  'ladbrokes':          { order: 15, short: 'LAD',  accent: '#ef4444', faviconUrl: 'https://www.ladbrokes.com/favicon.ico' },
  'coral':              { order: 16, short: 'COR',  accent: '#06b6d4', faviconUrl: 'https://www.coral.co.uk/favicon.ico' },
  'paddy-power':        { order: 17, short: 'PP',   accent: '#16a34a', faviconUrl: 'https://www.paddypower.com/favicon.ico' },
  'paddypower':         { order: 17, short: 'PP',   accent: '#16a34a', faviconUrl: 'https://www.paddypower.com/favicon.ico' },
  'skybet':             { order: 18, short: 'SKY',  accent: '#2563eb', faviconUrl: 'https://www.skybet.com/favicon.ico' },
  'sky-bet':            { order: 18, short: 'SKY',  accent: '#2563eb', faviconUrl: 'https://www.skybet.com/favicon.ico' },
  'sportingbet':        { order: 19, short: 'SPB',  accent: '#22c55e' },
  'sporting-bet':       { order: 19, short: 'SPB',  accent: '#22c55e' },
  'betsson':            { order: 20, short: 'BTS',  accent: '#2563eb', faviconUrl: 'https://www.betsson.com/favicon.ico' },
  'nordicbet':          { order: 21, short: 'NB',   accent: '#06b6d4' },
  'nordic-bet':         { order: 21, short: 'NB',   accent: '#06b6d4' },
  'betsafe':            { order: 22, short: 'SAFE', accent: '#2563eb' },
  'coolbet':            { order: 23, short: 'COOL', accent: '#7c3aed' },
  'fortuna':            { order: 24, short: 'FOR',  accent: '#eab308' },
  'superbet':           { order: 25, short: 'SB',   accent: '#ef4444' },
  'super-bet':          { order: 25, short: 'SB',   accent: '#ef4444' },
};

/**
 * Converts a bookmaker display name (as returned by the backend API)
 * into a URL-safe slug.
 * e.g. "William Hill" → "william-hill", "Bet365" → "bet365"
 */
export function bookmakerNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function fallbackShort(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 3).toUpperCase() || 'BK';
}

function resolveMetaSeed(slug: string): BookmakerMetaSeed | null {
  return BOOKMAKER_META_REGISTRY[slug] ?? BOOKMAKER_META_REGISTRY[slug.replace(/-/g, '')] ?? null;
}

export function getBookmakerMeta(name: string): BookmakerMeta {
  const slug = bookmakerNameToSlug(name);
  const seed = resolveMetaSeed(slug);

  return {
    slug,
    name,
    logoText: seed?.short ?? fallbackShort(name),
    short: seed?.short ?? fallbackShort(name),
    order: seed?.order ?? 999,
    accent: seed?.accent ?? '#64748b',
    faviconUrl: seed?.faviconUrl ?? null,
  };
}

export function getBookmakerOrder(name: string): number {
  return getBookmakerMeta(name).order;
}

/**
 * Resolves a bookmaker slug to its destination URL.
 * Returns null if the slug is not in the registry.
 */
export function slugToBookmakerUrl(slug: string): string | null {
  const normalized = slug.toLowerCase().trim();
  return BOOKMAKER_REGISTRY[normalized] ?? null;
}

/**
 * Builds a referral tracking href pointing to the /go/[slug] route handler.
 * The route handler logs the click and redirects to the bookmaker.
 */
export function buildBookmakerHref(
  bookmakerName: string,
  options?: {
    fixture?: number | string;
    outcome?: 'home' | 'draw' | 'away';
    source?: string;
  },
): string {
  const slug = bookmakerNameToSlug(bookmakerName);
  const params = new URLSearchParams();
  if (options?.fixture !== undefined) params.set('fixture', String(options.fixture));
  if (options?.outcome) params.set('outcome', options.outcome);
  if (options?.source) params.set('source', options.source);
  const query = params.toString();
  return `/go/${slug}${query ? `?${query}` : ''}`;
}
