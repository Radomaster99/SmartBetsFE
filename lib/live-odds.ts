import type { BestOddsDto, LiveOddsMarketDto, LiveOddsValueDto, OddDto } from '@/lib/types/api';

const FULLTIME_THREE_WAY_MARKET_NAMES = new Set([
  'match winner',
  'fulltime result',
  'full time result',
  '1x2',
  'h2h',
]);

const GENERIC_OUTCOME_MATCHERS: Record<'home' | 'draw' | 'away', string[]> = {
  home: ['1', 'home', 'home team', 'team 1'],
  draw: ['x', 'draw'],
  away: ['2', 'away', 'away team', 'team 2'],
};

const COMMON_TEAM_WORDS = new Set([
  'fc',
  'cf',
  'sc',
  'afc',
  'fk',
  'ac',
  'bc',
  'cd',
  'club',
  'the',
]);

export interface LiveOddsMappingOptions {
  fulltimeOnly?: boolean;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeOutcomeLabel(label: string): string {
  return normalizeText(label);
}

function normalizeCompactText(value: string): string {
  return normalizeText(value).replace(/\s+/g, '');
}

function buildTeamMatchers(name: string | null | undefined): string[] {
  if (!name) {
    return [];
  }

  const normalized = normalizeText(name);
  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(' ')
    .filter((token) => token.length > 1 && !COMMON_TEAM_WORDS.has(token));

  return Array.from(new Set([normalized, normalizeCompactText(name), ...tokens]));
}

function isUsableValue(value: LiveOddsValueDto): value is LiveOddsValueDto & { odd: number } {
  return !value.blocked && !value.finished && value.odd != null && value.odd > 0;
}

function isDrawValue(value: LiveOddsValueDto): boolean {
  return GENERIC_OUTCOME_MATCHERS.draw.includes(normalizeOutcomeLabel(value.outcomeLabel));
}

function matchesTeamName(value: LiveOddsValueDto, teamName: string | null | undefined): boolean {
  const teamMatchers = buildTeamMatchers(teamName);
  if (teamMatchers.length === 0) {
    return false;
  }

  const normalizedLabel = normalizeOutcomeLabel(value.outcomeLabel);
  const compactLabel = normalizeCompactText(value.outcomeLabel);

  return teamMatchers.some((matcher) => {
    if (!matcher) {
      return false;
    }

    return (
      normalizedLabel === matcher ||
      compactLabel === matcher ||
      normalizedLabel.includes(matcher) ||
      matcher.includes(normalizedLabel)
    );
  });
}

function findOutcomeValue(
  values: LiveOddsValueDto[],
  kind: 'home' | 'draw' | 'away',
  options?: Pick<LiveOddsMappingOptions, 'homeTeamName' | 'awayTeamName'>,
): LiveOddsValueDto | null {
  const usableValues = values.filter(isUsableValue);
  if (usableValues.length === 0) {
    return null;
  }

  const genericMatchers = GENERIC_OUTCOME_MATCHERS[kind];
  for (const value of usableValues) {
    if (genericMatchers.includes(normalizeOutcomeLabel(value.outcomeLabel))) {
      return value;
    }
  }

  if (kind === 'home') {
    const matched = usableValues.find((value) => matchesTeamName(value, options?.homeTeamName));
    if (matched) {
      return matched;
    }
  }

  if (kind === 'away') {
    const matched = usableValues.find((value) => matchesTeamName(value, options?.awayTeamName));
    if (matched) {
      return matched;
    }
  }

  if (kind === 'draw') {
    const matched = usableValues.find(isDrawValue);
    if (matched) {
      return matched;
    }
  }

  const nonDrawValues = usableValues.filter((value) => !isDrawValue(value));
  if (nonDrawValues.length === 2) {
    return kind === 'home' ? nonDrawValues[0] : kind === 'away' ? nonDrawValues[1] : null;
  }

  return null;
}

function isThreeWayMainMarket(market: LiveOddsMarketDto, options?: LiveOddsMappingOptions): boolean {
  const home = findOutcomeValue(market.values, 'home', options);
  const draw = findOutcomeValue(market.values, 'draw', options);
  const away = findOutcomeValue(market.values, 'away', options);

  return Boolean(home?.odd && draw?.odd && away?.odd);
}

function getNormalizedMarketName(market: LiveOddsMarketDto): string {
  return market.betName.trim().toLowerCase();
}

function isPrimaryLiveThreeWayMarketName(name: string): boolean {
  return FULLTIME_THREE_WAY_MARKET_NAMES.has(name) || name === 'winner';
}

function getMarketNamePriority(market: LiveOddsMarketDto): number {
  const name = getNormalizedMarketName(market);
  if (name === 'match winner') return 0;
  if (name === 'fulltime result') return 1;
  if (name === 'h2h') return 2;
  if (name === '1x2') return 3;
  if (name.startsWith('1x2')) return 4;
  if (name === 'winner') return 5;
  return 6;
}

function hasMainSelection(market: LiveOddsMarketDto): boolean {
  return market.values.some((value) => value.isMain && !value.blocked && !value.finished && value.odd != null);
}

function getMarketTimestamp(market: LiveOddsMarketDto): number {
  const timestamp = market.lastSnapshotCollectedAtUtc ?? market.collectedAtUtc ?? market.lastSyncedAtUtc ?? null;
  if (!timestamp) {
    return 0;
  }

  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBookmakerIdentityPriority(
  market: Pick<LiveOddsMarketDto, 'apiBookmakerId' | 'bookmakerIdentityType' | 'externalBookmakerKey' | 'bookmaker'>,
): number {
  if (market.bookmakerIdentityType === 'external') {
    return 3;
  }

  if (market.bookmakerIdentityType === 'real' || market.apiBookmakerId > 0) {
    return 2;
  }

  if (market.bookmaker) {
    return 1;
  }

  return 0;
}

function normalizeIdentitySegment(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

function getMarketBookmakerIdentityKey(
  market: Pick<LiveOddsMarketDto, 'apiBookmakerId' | 'bookmakerIdentityType' | 'externalBookmakerKey' | 'bookmaker'>,
): string {
  if (market.bookmakerIdentityType === 'external' && market.externalBookmakerKey) {
    return `external:${normalizeIdentitySegment(market.externalBookmakerKey)}`;
  }

  if (market.apiBookmakerId > 0) {
    return `api:${market.apiBookmakerId}`;
  }

  return `display:${normalizeIdentitySegment(market.bookmaker)}`;
}

export function getOddIdentityKey(
  odd: Pick<
    OddDto,
    'apiBookmakerId' | 'bookmakerIdentityType' | 'externalBookmakerKey' | 'bookmaker' | 'bookmakerStableKey'
  >,
): string {
  if (odd.bookmakerStableKey) {
    return odd.bookmakerStableKey;
  }

  if (odd.bookmakerIdentityType === 'external' && odd.externalBookmakerKey) {
    return `external:${normalizeIdentitySegment(odd.externalBookmakerKey)}`;
  }

  if (odd.apiBookmakerId > 0) {
    return `api:${odd.apiBookmakerId}`;
  }

  return `display:${normalizeIdentitySegment(odd.bookmaker)}`;
}

function pickThreeWayMarkets(markets: LiveOddsMarketDto[], options?: LiveOddsMappingOptions): LiveOddsMarketDto[] {
  const candidates = markets.filter((market) => isThreeWayMainMarket(market, options));
  const scopedCandidates = options?.fulltimeOnly
    ? candidates.filter((market) => isPrimaryLiveThreeWayMarketName(getNormalizedMarketName(market)))
    : candidates;

  return [...scopedCandidates].sort((left, right) => {
    const leftPriority = getMarketNamePriority(left);
    const rightPriority = getMarketNamePriority(right);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftHasMain = hasMainSelection(left);
    const rightHasMain = hasMainSelection(right);
    if (leftHasMain !== rightHasMain) {
      return leftHasMain ? -1 : 1;
    }

    const leftIdentityPriority = getBookmakerIdentityPriority(left);
    const rightIdentityPriority = getBookmakerIdentityPriority(right);
    if (leftIdentityPriority !== rightIdentityPriority) {
      return rightIdentityPriority - leftIdentityPriority;
    }

    const freshnessDelta = getMarketTimestamp(right) - getMarketTimestamp(left);
    if (freshnessDelta !== 0) {
      return freshnessDelta;
    }

    return left.bookmaker.localeCompare(right.bookmaker);
  });
}

function mergeOddRows(left: OddDto, right: OddDto): OddDto {
  const leftTime = new Date(left.collectedAtUtc).getTime();
  const rightTime = new Date(right.collectedAtUtc).getTime();
  const preferred = rightTime >= leftTime ? right : left;
  const fallback = preferred === right ? left : right;

  return {
    ...preferred,
    bookmakerId: preferred.bookmakerId || fallback.bookmakerId,
    apiBookmakerId: preferred.apiBookmakerId || fallback.apiBookmakerId,
    bookmaker: preferred.bookmaker || fallback.bookmaker,
    bookmakerIdentityType: preferred.bookmakerIdentityType ?? fallback.bookmakerIdentityType ?? null,
    sourceProvider: preferred.sourceProvider ?? fallback.sourceProvider ?? null,
    externalEventId: preferred.externalEventId ?? fallback.externalEventId ?? null,
    externalBookmakerKey: preferred.externalBookmakerKey ?? fallback.externalBookmakerKey ?? null,
    externalMarketKey: preferred.externalMarketKey ?? fallback.externalMarketKey ?? null,
    bookmakerStableKey: preferred.bookmakerStableKey ?? fallback.bookmakerStableKey ?? null,
    marketName: preferred.marketName || fallback.marketName,
    homeOdd: Math.max(left.homeOdd, right.homeOdd),
    drawOdd: Math.max(left.drawOdd, right.drawOdd),
    awayOdd: Math.max(left.awayOdd, right.awayOdd),
    collectedAtUtc: rightTime >= leftTime ? right.collectedAtUtc : left.collectedAtUtc,
  };
}

function mergeOddsByBookmaker(odds: OddDto[]): OddDto[] {
  const byBookmaker = new Map<string, OddDto>();

  for (const odd of odds) {
    const key = getOddIdentityKey(odd);
    const existing = byBookmaker.get(key);
    if (!existing) {
      byBookmaker.set(key, odd);
      continue;
    }

    byBookmaker.set(key, mergeOddRows(existing, odd));
  }

  return Array.from(byBookmaker.values());
}

function mapThreeWayMarketsToOdds(markets: LiveOddsMarketDto[], options?: LiveOddsMappingOptions): OddDto[] {
  const selectedMarkets = pickThreeWayMarkets(markets, options);
  if (selectedMarkets.length === 0) {
    return [];
  }

  const rawOdds = selectedMarkets.flatMap((market): OddDto[] => {
    const home = findOutcomeValue(market.values, 'home', options);
    const draw = findOutcomeValue(market.values, 'draw', options);
    const away = findOutcomeValue(market.values, 'away', options);

    if (!home?.odd || !draw?.odd || !away?.odd) {
      return [];
    }

    return [
      {
        fixtureId: market.fixtureId,
        apiFixtureId: market.apiFixtureId,
        bookmakerId: market.bookmakerId,
        apiBookmakerId: market.apiBookmakerId,
        bookmaker: market.bookmaker,
        bookmakerIdentityType: market.bookmakerIdentityType ?? null,
        sourceProvider: market.sourceProvider ?? null,
        externalEventId: market.externalEventId ?? null,
        externalBookmakerKey: market.externalBookmakerKey ?? null,
        externalMarketKey: market.externalMarketKey ?? null,
        bookmakerStableKey: getMarketBookmakerIdentityKey(market),
        marketName: market.betName,
        homeOdd: home.odd,
        drawOdd: draw.odd,
        awayOdd: away.odd,
        collectedAtUtc: market.collectedAtUtc ?? new Date().toISOString(),
      } satisfies OddDto,
    ];
  });

  return mergeOddsByBookmaker(rawOdds);
}

export function mapLiveOddsToOdds(markets: LiveOddsMarketDto[], options?: LiveOddsMappingOptions): OddDto[] {
  return mapThreeWayMarketsToOdds(markets, options);
}

export function mapLiveOddsToMainMatchOdds(markets: LiveOddsMarketDto[], options?: LiveOddsMappingOptions): OddDto[] {
  return mapThreeWayMarketsToOdds(markets, { ...options, fulltimeOnly: true });
}

export function sortOddsByStrength(odds: OddDto[]): OddDto[] {
  if (odds.length <= 1) {
    return [...odds];
  }

  const maxHome = Math.max(...odds.map((odd) => odd.homeOdd));
  const maxDraw = Math.max(...odds.map((odd) => odd.drawOdd));
  const maxAway = Math.max(...odds.map((odd) => odd.awayOdd));

  return [...odds].sort((left, right) => {
    const leftWins =
      Number(left.homeOdd === maxHome) + Number(left.drawOdd === maxDraw) + Number(left.awayOdd === maxAway);
    const rightWins =
      Number(right.homeOdd === maxHome) + Number(right.drawOdd === maxDraw) + Number(right.awayOdd === maxAway);
    if (leftWins !== rightWins) {
      return rightWins - leftWins;
    }

    const leftPeak = Math.max(left.homeOdd, left.drawOdd, left.awayOdd);
    const rightPeak = Math.max(right.homeOdd, right.drawOdd, right.awayOdd);
    if (leftPeak !== rightPeak) {
      return rightPeak - leftPeak;
    }

    const leftTotal = left.homeOdd + left.drawOdd + left.awayOdd;
    const rightTotal = right.homeOdd + right.drawOdd + right.awayOdd;
    if (leftTotal !== rightTotal) {
      return rightTotal - leftTotal;
    }

    return left.bookmaker.localeCompare(right.bookmaker);
  });
}

export function deriveBestOddsFromOdds(odds: OddDto[]): BestOddsDto | null {
  if (odds.length === 0) {
    return null;
  }

  const bestHome = odds.reduce((best, current) => (current.homeOdd > best.homeOdd ? current : best), odds[0]);
  const bestDraw = odds.reduce((best, current) => (current.drawOdd > best.drawOdd ? current : best), odds[0]);
  const bestAway = odds.reduce((best, current) => (current.awayOdd > best.awayOdd ? current : best), odds[0]);
  const latestCollectedAtUtc = odds.reduce(
    (latest, current) =>
      new Date(current.collectedAtUtc).getTime() > new Date(latest.collectedAtUtc).getTime() ? current : latest,
    odds[0],
  ).collectedAtUtc;

  return {
    fixtureId: odds[0].fixtureId,
    apiFixtureId: odds[0].apiFixtureId,
    marketName: odds[0].marketName,
    collectedAtUtc: latestCollectedAtUtc,
    bestHomeOdd: bestHome.homeOdd,
    bestHomeBookmaker: bestHome.bookmaker,
    bestDrawOdd: bestDraw.drawOdd,
    bestDrawBookmaker: bestDraw.bookmaker,
    bestAwayOdd: bestAway.awayOdd,
    bestAwayBookmaker: bestAway.bookmaker,
  };
}
