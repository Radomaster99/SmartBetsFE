import type { BestOddsDto, LiveOddsMarketDto, LiveOddsValueDto, OddDto } from '@/lib/types/api';

const SYNTHETIC_LIVE_BOOKMAKER_LABEL = 'api-football live feed';

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

function pickThreeWayMarkets(markets: LiveOddsMarketDto[]): LiveOddsMarketDto[] {
  const preferred = markets.filter((market) => {
    const name = market.betName.trim().toLowerCase();
    return (name === 'match winner' || name === 'winner') && isThreeWayMainMarket(market);
  });

  if (preferred.length > 0) {
    return preferred;
  }

  return markets.filter(isThreeWayMainMarket);
}

export function mapLiveOddsToOdds(markets: LiveOddsMarketDto[]): OddDto[] {
  return pickThreeWayMarkets(markets)
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

export function hasNonSyntheticBookmakerOdds(odds: OddDto[]): boolean {
  return odds.some((odd) => odd.apiBookmakerId > 0 && odd.bookmaker.trim().toLowerCase() !== SYNTHETIC_LIVE_BOOKMAKER_LABEL);
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
