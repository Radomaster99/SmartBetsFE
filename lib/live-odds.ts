import type { BestOddsDto, LiveOddsMarketDto, LiveOddsSummaryDto, LiveOddsValueDto, OddDto } from '@/lib/types/api';

const FULLTIME_THREE_WAY_MARKET_NAMES = new Set([
  'match winner',
  'fulltime result',
  'full time result',
  '1x2',
  'h2h',
  'moneyline',
]);

const GENERIC_OUTCOME_MATCHERS: Record<'home' | 'draw' | 'away', string[]> = {
  home: ['1', 'home', 'home team', 'team 1'],
  draw: ['x', 'draw', 'tie', 'the draw'],
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
  'women',
  'woman',
  'ladies',
  'youth',
  'reserve',
  'reserves',
  'academy',
  'u17',
  'u18',
  'u19',
  'u20',
  'u21',
  'u22',
  'u23',
  'ii',
  'iii',
]);

export interface LiveOddsMappingOptions {
  fulltimeOnly?: boolean;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
  elapsed?: number | null;
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

function getTeamMatchingParts(name: string | null | undefined): {
  normalized: string;
  compact: string;
  tokens: string[];
} | null {
  if (!name) {
    return null;
  }

  const normalized = normalizeText(name);
  if (!normalized) {
    return null;
  }

  const compact = normalizeCompactText(name);
  const tokens = normalized
    .split(' ')
    .filter((token) => token.length > 2 && !COMMON_TEAM_WORDS.has(token))
    .sort((left, right) => right.length - left.length);

  return { normalized, compact, tokens };
}

function isUsableValue(value: LiveOddsValueDto): value is LiveOddsValueDto & { odd: number } {
  return !value.blocked && !value.finished && value.odd != null && value.odd > 0;
}

function isDrawValue(value: LiveOddsValueDto): boolean {
  return GENERIC_OUTCOME_MATCHERS.draw.includes(normalizeOutcomeLabel(value.outcomeLabel));
}

function getTeamNameMatchScore(value: LiveOddsValueDto, teamName: string | null | undefined): number {
  const teamParts = getTeamMatchingParts(teamName);
  if (!teamParts) {
    return 0;
  }

  const normalizedLabel = normalizeOutcomeLabel(value.outcomeLabel);
  const compactLabel = normalizeCompactText(value.outcomeLabel);
  if (!normalizedLabel || !compactLabel) {
    return 0;
  }

  if (normalizedLabel === teamParts.normalized || compactLabel === teamParts.compact) {
    return 10_000;
  }

  if (
    normalizedLabel.includes(teamParts.normalized) ||
    teamParts.normalized.includes(normalizedLabel) ||
    compactLabel.includes(teamParts.compact) ||
    teamParts.compact.includes(compactLabel)
  ) {
    return 5_000;
  }

  let bestScore = 0;
  for (const token of teamParts.tokens) {
    if (normalizedLabel === token || compactLabel === token) {
      bestScore = Math.max(bestScore, 1_000 + token.length);
      continue;
    }

    if (normalizedLabel.includes(token) || compactLabel.includes(token)) {
      bestScore = Math.max(bestScore, token.length);
    }
  }

  return bestScore;
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
    let bestMatch: LiveOddsValueDto | null = null;
    let bestScore = 0;
    for (const value of usableValues) {
      const score = getTeamNameMatchScore(value, options?.homeTeamName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
    }
    if (bestMatch && bestScore > 0) {
      return bestMatch;
    }
  }

  if (kind === 'away') {
    let bestMatch: LiveOddsValueDto | null = null;
    let bestScore = 0;
    for (const value of usableValues) {
      const score = getTeamNameMatchScore(value, options?.awayTeamName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
    }
    if (bestMatch && bestScore > 0) {
      return bestMatch;
    }
  }

  if (kind === 'draw') {
    const matched = usableValues.find(isDrawValue);
    if (matched) {
      return matched;
    }

    if (usableValues.length === 3) {
      const homeCandidate = usableValues
        .map((value) => ({ value, score: getTeamNameMatchScore(value, options?.homeTeamName) }))
        .sort((left, right) => right.score - left.score)[0];
      const awayCandidate = usableValues
        .filter((value) => value !== homeCandidate?.value)
        .map((value) => ({ value, score: getTeamNameMatchScore(value, options?.awayTeamName) }))
        .sort((left, right) => right.score - left.score)[0];

      if (homeCandidate?.score > 0 && awayCandidate?.score > 0) {
        return (
          usableValues.find(
            (value) => value !== homeCandidate.value && value !== awayCandidate.value,
          ) ?? null
        );
      }
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

function getNormalizedMarketIdentifiers(market: LiveOddsMarketDto): string[] {
  const identifiers = [
    market.betName,
    market.externalMarketKey ?? '',
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return Array.from(new Set(identifiers));
}

function isPrimaryLiveThreeWayMarketName(name: string): boolean {
  return FULLTIME_THREE_WAY_MARKET_NAMES.has(name) || name === 'winner';
}

function getMarketNamePriority(market: LiveOddsMarketDto): number {
  const identifiers = getNormalizedMarketIdentifiers(market);
  let bestPriority = 6;

  for (const name of identifiers) {
    if (name === 'match winner') bestPriority = Math.min(bestPriority, 0);
    else if (name === 'fulltime result') bestPriority = Math.min(bestPriority, 1);
    else if (name === 'h2h' || name === 'moneyline') bestPriority = Math.min(bestPriority, 2);
    else if (name === '1x2') bestPriority = Math.min(bestPriority, 3);
    else if (name.startsWith('1x2')) bestPriority = Math.min(bestPriority, 4);
    else if (name === 'winner') bestPriority = Math.min(bestPriority, 5);
  }

  return bestPriority;
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

function getBookmakerDisplayKey(bookmaker: string): string {
  return normalizeIdentitySegment(bookmaker);
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
  let scopedCandidates = candidates;

  if (options?.fulltimeOnly) {
    const primaryCandidates = candidates.filter((market) =>
      getNormalizedMarketIdentifiers(market).some(isPrimaryLiveThreeWayMarketName),
    );

    if (primaryCandidates.length > 0) {
      scopedCandidates = primaryCandidates;
    } else {
      const minuteMarketCandidates = candidates.filter((market) =>
        getNormalizedMarketIdentifiers(market).some((name) => name.startsWith('1x2')),
      );

      const freshestMinuteMarketByBookmaker = new Map<string, LiveOddsMarketDto>();
      for (const market of minuteMarketCandidates) {
        const key = getMarketBookmakerIdentityKey(market);
        const existing = freshestMinuteMarketByBookmaker.get(key);
        if (!existing || getMarketTimestamp(market) > getMarketTimestamp(existing)) {
          freshestMinuteMarketByBookmaker.set(key, market);
        }
      }

      scopedCandidates = Array.from(freshestMinuteMarketByBookmaker.values());
    }
  }

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

export function dedupeOddsByBookmaker(odds: OddDto[]): OddDto[] {
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

export function dedupeOddsByBookmakerName(odds: OddDto[]): OddDto[] {
  const byBookmakerName = new Map<string, OddDto>();

  for (const odd of odds) {
    const key = getBookmakerDisplayKey(odd.bookmaker);
    const existing = byBookmakerName.get(key);
    if (!existing) {
      byBookmakerName.set(key, odd);
      continue;
    }

    byBookmakerName.set(key, mergeOddRows(existing, odd));
  }

  return Array.from(byBookmakerName.values());
}

function mapThreeWayMarketsToOdds(markets: LiveOddsMarketDto[], options?: LiveOddsMappingOptions): OddDto[] {
  const selectedMarkets = pickThreeWayMarkets(markets, options);
  if (selectedMarkets.length === 0) {
    return [];
  }

  function shouldSwapHomeAwayByLiveScore(homeOdd: number, awayOdd: number): boolean {
    const homeGoals = options?.homeGoals ?? null;
    const awayGoals = options?.awayGoals ?? null;
    const elapsed = options?.elapsed ?? null;

    if (homeGoals == null || awayGoals == null || elapsed == null) {
      return false;
    }

    const goalDiff = homeGoals - awayGoals;
    const absGoalDiff = Math.abs(goalDiff);
    if (absGoalDiff === 0) {
      return false;
    }

    const leaderIsHome = goalDiff > 0;
    const leaderOdd = leaderIsHome ? homeOdd : awayOdd;
    const trailerOdd = leaderIsHome ? awayOdd : homeOdd;

    if (leaderOdd <= trailerOdd) {
      return false;
    }

    const requiredElapsed = absGoalDiff >= 2 ? 20 : 75;
    const requiredRatio = absGoalDiff >= 2 ? 2 : 3;
    const trailerFloor = Math.max(trailerOdd, 1.01);

    if (elapsed < requiredElapsed) {
      return false;
    }

    return leaderOdd / trailerFloor >= requiredRatio;
  }

  const rawOdds = selectedMarkets.flatMap((market): OddDto[] => {
    const home = findOutcomeValue(market.values, 'home', options);
    const draw = findOutcomeValue(market.values, 'draw', options);
    const away = findOutcomeValue(market.values, 'away', options);

    if (!home?.odd || !draw?.odd || !away?.odd) {
      return [];
    }

    const shouldSwapHomeAway = shouldSwapHomeAwayByLiveScore(home.odd, away.odd);

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
        homeOdd: shouldSwapHomeAway ? away.odd : home.odd,
        drawOdd: draw.odd,
        awayOdd: shouldSwapHomeAway ? home.odd : away.odd,
        collectedAtUtc: market.collectedAtUtc ?? new Date().toISOString(),
      } satisfies OddDto,
    ];
  });

  return dedupeOddsByBookmaker(rawOdds);
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

export function mergeLiveSummaryOutcomes(
  previous: LiveOddsSummaryDto | null | undefined,
  next: LiveOddsSummaryDto | null | undefined,
): LiveOddsSummaryDto | null {
  if (!next && !previous) {
    return null;
  }

  if (!next) {
    return previous ?? null;
  }

  return {
    ...next,
    source: next.source,
    collectedAtUtc: next.collectedAtUtc ?? previous?.collectedAtUtc ?? null,
    bestHomeOdd: next.bestHomeOdd ?? previous?.bestHomeOdd ?? null,
    bestHomeBookmaker: next.bestHomeBookmaker ?? previous?.bestHomeBookmaker ?? null,
    bestDrawOdd: next.bestDrawOdd ?? previous?.bestDrawOdd ?? null,
    bestDrawBookmaker: next.bestDrawBookmaker ?? previous?.bestDrawBookmaker ?? null,
    bestAwayOdd: next.bestAwayOdd ?? previous?.bestAwayOdd ?? null,
    bestAwayBookmaker: next.bestAwayBookmaker ?? previous?.bestAwayBookmaker ?? null,
  };
}
