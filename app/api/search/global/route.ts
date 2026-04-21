import { NextRequest, NextResponse } from 'next/server';
import { getFixtureDetail, getFixtures } from '@/lib/api/fixtures';
import { getLeagues } from '@/lib/api/leagues';
import { getTeams } from '@/lib/api/teams';
import type { FixtureDto, LeagueDto, TeamDto } from '@/lib/types/api';
import type { GlobalSearchResponse, GlobalSearchSuggestion } from '@/lib/types/search';
import { buildTeamHref } from '@/lib/team-links';

export const dynamic = 'force-dynamic';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
const TEAM_CACHE_MS = 60 * 60 * 1000;
const LEAGUE_CACHE_MS = 60 * 60 * 1000;
const FIXTURE_CACHE_MS = 60 * 1000;

let teamsCache: { data: TeamDto[]; expiresAt: number } | null = null;
let leaguesCache: { data: LeagueDto[]; expiresAt: number } | null = null;
let fixturesCache: { data: FixtureDto[]; expiresAt: number } | null = null;
let warmCachesPromise: Promise<void> | null = null;

type ScoredSuggestion = GlobalSearchSuggestion & { score: number };

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(/[\s/-]+/).filter(Boolean);
}

function joinParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(' / ');
}

function scoreMatch(query: string, primary: string, secondary = ''): number {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const primaryText = normalizeText(primary);
  const secondaryText = normalizeText(secondary);
  const combined = `${primaryText} ${secondaryText}`.trim();
  const primaryTokens = tokenize(primary);
  const combinedTokens = tokenize(`${primary} ${secondary}`);

  if (primaryText === normalizedQuery) {
    return 220;
  }

  if (combined === normalizedQuery) {
    return 210;
  }

  if (primaryText.startsWith(normalizedQuery)) {
    return 180;
  }

  if (primaryTokens.some((token) => token.startsWith(normalizedQuery))) {
    return 160;
  }

  if (combinedTokens.some((token) => token.startsWith(normalizedQuery))) {
    return 145;
  }

  if (combined.includes(normalizedQuery)) {
    return 120;
  }

  return 0;
}

async function getCachedTeams(): Promise<TeamDto[]> {
  const now = Date.now();

  if (teamsCache && teamsCache.expiresAt > now) {
    return teamsCache.data;
  }

  const data = await getTeams();
  teamsCache = { data, expiresAt: now + TEAM_CACHE_MS };
  return data;
}

async function getCachedLeagues(): Promise<LeagueDto[]> {
  const now = Date.now();

  if (leaguesCache && leaguesCache.expiresAt > now) {
    return leaguesCache.data;
  }

  const data = await getLeagues();
  leaguesCache = { data, expiresAt: now + LEAGUE_CACHE_MS };
  return data;
}

async function getCachedSearchFixtures(): Promise<FixtureDto[]> {
  const now = Date.now();

  if (fixturesCache && fixturesCache.expiresAt > now) {
    return fixturesCache.data;
  }

  const [live, upcoming, finished] = await Promise.all([
    getFixtures({ state: 'Live', page: 1, pageSize: 24, direction: 'asc' }),
    getFixtures({ state: 'Upcoming', page: 1, pageSize: 36, direction: 'asc' }),
    getFixtures({ state: 'Finished', page: 1, pageSize: 36, direction: 'desc' }),
  ]);

  const merged = new Map<number, FixtureDto>();

  [...live.items, ...upcoming.items, ...finished.items].forEach((fixture) => {
    merged.set(fixture.apiFixtureId, fixture);
  });

  const data = Array.from(merged.values());
  fixturesCache = { data, expiresAt: now + FIXTURE_CACHE_MS };
  return data;
}

async function warmSearchCaches(): Promise<void> {
  if (!warmCachesPromise) {
    warmCachesPromise = Promise.all([
      getCachedTeams(),
      getCachedLeagues(),
      getCachedSearchFixtures(),
    ])
      .then(() => undefined)
      .finally(() => {
        warmCachesPromise = null;
      });
  }

  return warmCachesPromise;
}

function buildLeagueSuggestions(leagues: LeagueDto[], query: string): ScoredSuggestion[] {
  const latestByLeague = new Map<number, LeagueDto>();

  leagues.forEach((league) => {
    const existing = latestByLeague.get(league.apiLeagueId);

    if (!existing || league.season > existing.season) {
      latestByLeague.set(league.apiLeagueId, league);
    }
  });

  const results: ScoredSuggestion[] = [];

  for (const league of latestByLeague.values()) {
    const score = scoreMatch(query, league.name, `${league.countryName} ${league.season}`);

    if (score === 0) {
      continue;
    }

    results.push({
      id: `league-${league.apiLeagueId}-${league.season}`,
      type: 'league',
      title: league.name,
      subtitle: joinParts([league.countryName, `Season ${league.season}`]),
      href: `/?leagueId=${league.apiLeagueId}&season=${league.season}`,
      badge: 'League',
      score,
    });
  }

  return results;
}

function buildTeamSuggestions(teams: TeamDto[], query: string): ScoredSuggestion[] {
  const results: ScoredSuggestion[] = [];

  for (const team of teams) {
    const score = scoreMatch(query, team.name, `${team.countryName ?? ''} ${team.code ?? ''}`);

    if (score === 0) {
      continue;
    }

    results.push({
      id: `team-${team.apiTeamId}`,
      type: 'team',
      title: team.name,
      subtitle: joinParts([team.countryName ?? 'Team', team.code]),
      href: buildTeamHref(team.apiTeamId, team.name),
      badge: 'Team',
      score,
    });
  }

  return results;
}

function buildFixtureSuggestions(fixtures: FixtureDto[], query: string): ScoredSuggestion[] {
  const normalizedQuery = normalizeText(query);
  const results: ScoredSuggestion[] = [];

  for (const fixture of fixtures) {
    const matchup = `${fixture.homeTeamName} ${fixture.awayTeamName}`;
    const competition = `${fixture.countryName} ${fixture.leagueName}`;
    let score = scoreMatch(query, matchup, competition);

    if (/^\d+$/.test(normalizedQuery) && normalizedQuery === String(fixture.apiFixtureId)) {
      score = 260;
    }

    if (score === 0) {
      continue;
    }

    results.push({
      id: `fixture-${fixture.apiFixtureId}`,
      type: 'fixture',
      title: `${fixture.homeTeamName} vs ${fixture.awayTeamName}`,
      subtitle: joinParts([fixture.countryName, fixture.leagueName, fixture.stateBucket]),
      href: `/football/fixtures/${fixture.apiFixtureId}`,
      badge: fixture.stateBucket,
      score,
    });
  }

  return results;
}

function stripScores(items: ScoredSuggestion[]): GlobalSearchSuggestion[] {
  return items.map(({ score: _score, ...item }) => item);
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('prefetch') === '1') {
    await Promise.allSettled([warmSearchCaches()]);
    return NextResponse.json({ items: [] } satisfies GlobalSearchResponse);
  }

  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ items: [] } satisfies GlobalSearchResponse);
  }

  try {
    const shouldSearchTeams = query.length >= 3;
    const shouldSearchLeagues = query.length >= 3;

    const [teams, leagues, fixtures] = await Promise.all([
      shouldSearchTeams ? getCachedTeams() : Promise.resolve([]),
      shouldSearchLeagues ? getCachedLeagues() : Promise.resolve([]),
      getCachedSearchFixtures(),
    ]);

    const suggestions = stripScores(
      [
        ...buildFixtureSuggestions(fixtures, query),
        ...buildTeamSuggestions(teams, query),
        ...buildLeagueSuggestions(leagues, query),
      ]
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, 10),
    );

    if (/^\d+$/.test(query) && !suggestions.some((item) => item.type === 'fixture' && item.id === `fixture-${query}`)) {
      try {
        const fixture = await getFixtureDetail(Number(query));

        suggestions.unshift({
          id: `fixture-${fixture.fixture.apiFixtureId}`,
          type: 'fixture',
          title: `${fixture.fixture.homeTeamName} vs ${fixture.fixture.awayTeamName}`,
          subtitle: joinParts([
            fixture.fixture.countryName,
            fixture.fixture.leagueName,
            fixture.fixture.stateBucket,
          ]),
          href: `/football/fixtures/${fixture.fixture.apiFixtureId}`,
          badge: fixture.fixture.stateBucket,
        });
      } catch {
        // Ignore exact fixture lookup failures for non-existing ids.
      }
    }

    return NextResponse.json({ items: suggestions.slice(0, 10) } satisfies GlobalSearchResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error), items: [] }, { status: 500 });
  }
}
