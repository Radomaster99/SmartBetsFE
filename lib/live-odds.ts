import type { BestOddsDto, LiveOddsMarketDto, LiveOddsValueDto, OddDto } from '@/lib/types/api';

const LEGACY_SYNTHETIC_LIVE_BOOKMAKER_LABEL = 'api-football live feed';
const FULLTIME_THREE_WAY_MARKET_NAMES = new Set([
  'match winner',
  'fulltime result',
  'full time result',
  '1x2',
]);

function normalizeOutcomeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function findOutcomeValue(values: LiveOddsValueDto[], kind: 'home' | 'draw' | 'away'): LiveOddsValueDto | null {
  const matchers: Record<'home' | 'draw' | 'away', string[]> = {
    home: ['1', 'home', 'home team', 'team 1'],
    draw: ['x', 'draw'],
    away: ['2', 'away', 'away team', 'team 2'],
  };

  for (const value of values) {
    if (value.blocked || value.finished) continue;
    const normalized = normalizeOutcomeLabel(value.outcomeLabel);
    if (matchers[kind].includes(normalized)) {
      return value;
    }
  }

  return null;
}

function isThreeWayMainMarket(market: LiveOddsMarketDto): boolean {
  const home = findOutcomeValue(market.values, 'home');
  const draw = findOutcomeValue(market.values, 'draw');
  const away = findOutcomeValue(market.values, 'away');

  return Boolean(home?.odd && draw?.odd && away?.odd);
}

function getNormalizedMarketName(market: LiveOddsMarketDto): string {
  return market.betName.trim().toLowerCase();
}

function isPrimaryLiveThreeWayMarketName(name: string): boolean {
  return FULLTIME_THREE_WAY_MARKET_NAMES.has(name) || name.startsWith('1x2');
}

function getMarketNamePriority(market: LiveOddsMarketDto): number {
  const name = getNormalizedMarketName(market);
  if (name === 'match winner') return 0;
  if (name === 'fulltime result') return 1;
  if (name === '1x2') return 2;
  if (name.startsWith('1x2')) return 3;
  if (name === 'winner') return 4;
  return 5;
}

function hasMainSelection(market: LiveOddsMarketDto): boolean {
  return market.values.some((value) => value.isMain && !value.blocked && !value.finished && value.odd != null);
}

function getMarketTimestamp(market: LiveOddsMarketDto): number {
  const timestamp =
    market.lastSnapshotCollectedAtUtc ??
    market.collectedAtUtc ??
    market.lastSyncedAtUtc ??
    null;

  if (!timestamp) {
    return 0;
  }

  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function rankThreeWayGroups(markets: LiveOddsMarketDto[]): LiveOddsMarketDto[][] {
  const groups = new Map<number, LiveOddsMarketDto[]>();
  for (const market of markets) {
    const existing = groups.get(market.apiBetId);
    if (existing) {
      existing.push(market);
    } else {
      groups.set(market.apiBetId, [market]);
    }
  }

  return Array.from(groups.values()).sort((left, right) => {
    const leftSample = left[0];
    const rightSample = right[0];

    const leftPriority = getMarketNamePriority(leftSample);
    const rightPriority = getMarketNamePriority(rightSample);
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftHasMain = left.some(hasMainSelection);
    const rightHasMain = right.some(hasMainSelection);
    if (leftHasMain !== rightHasMain) {
      return leftHasMain ? -1 : 1;
    }

    const leftRealCount = left.filter((market) => market.apiBookmakerId > 0).length;
    const rightRealCount = right.filter((market) => market.apiBookmakerId > 0).length;
    if (leftRealCount !== rightRealCount) {
      return rightRealCount - leftRealCount;
    }

    const leftFreshness = Math.max(...left.map(getMarketTimestamp));
    const rightFreshness = Math.max(...right.map(getMarketTimestamp));
    if (leftFreshness !== rightFreshness) {
      return rightFreshness - leftFreshness;
    }

    return leftSample.apiBetId - rightSample.apiBetId;
  });
}

function pickThreeWayMarkets(
  markets: LiveOddsMarketDto[],
  options?: { fulltimeOnly?: boolean },
): LiveOddsMarketDto[] {
  const candidates = markets.filter(isThreeWayMainMarket);
  const scopedCandidates = options?.fulltimeOnly
    ? candidates.filter((market) => isPrimaryLiveThreeWayMarketName(getNormalizedMarketName(market)))
    : candidates;

  const effectiveCandidates = scopedCandidates;

  const rankedGroups = rankThreeWayGroups(effectiveCandidates);
  if (rankedGroups.length === 0) {
    return [];
  }

  return [...rankedGroups[0]].sort((left, right) => {
    const leftReal = left.apiBookmakerId > 0 ? 1 : 0;
    const rightReal = right.apiBookmakerId > 0 ? 1 : 0;
    if (leftReal !== rightReal) {
      return rightReal - leftReal;
    }

    return getMarketTimestamp(right) - getMarketTimestamp(left);
  });
}

function mapThreeWayMarketsToOdds(markets: LiveOddsMarketDto[], options?: { fulltimeOnly?: boolean }): OddDto[] {
  const selectedMarkets = pickThreeWayMarkets(markets, options);
  if (selectedMarkets.length === 0) {
    return [];
  }

  return selectedMarkets
    .map((market) => {
      const home = findOutcomeValue(market.values, 'home');
      const draw = findOutcomeValue(market.values, 'draw');
      const away = findOutcomeValue(market.values, 'away');

      if (!home?.odd || !draw?.odd || !away?.odd) {
        return null;
      }

      return {
        fixtureId: market.fixtureId,
        apiFixtureId: market.apiFixtureId,
        bookmakerId: market.bookmakerId,
        apiBookmakerId: market.apiBookmakerId,
        bookmaker: market.bookmaker,
        marketName: market.betName,
        homeOdd: home.odd,
        drawOdd: draw.odd,
        awayOdd: away.odd,
        collectedAtUtc: market.collectedAtUtc ?? new Date().toISOString(),
      } satisfies OddDto;
    })
    .filter((market): market is OddDto => market !== null);
}

export function mapLiveOddsToOdds(markets: LiveOddsMarketDto[]): OddDto[] {
  return mapThreeWayMarketsToOdds(markets);
}

export function mapLiveOddsToMainMatchOdds(markets: LiveOddsMarketDto[]): OddDto[] {
  return mapThreeWayMarketsToOdds(markets, { fulltimeOnly: true });
}

export function hasUsableLiveBookmakerOdds(markets: LiveOddsMarketDto[]): boolean {
  return markets.some((market) => {
    const bookmakerName = market.bookmaker?.trim();
    if (!bookmakerName) {
      return false;
    }

    if (bookmakerName.toLowerCase() === LEGACY_SYNTHETIC_LIVE_BOOKMAKER_LABEL) {
      return false;
    }

    return true;
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
