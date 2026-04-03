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
