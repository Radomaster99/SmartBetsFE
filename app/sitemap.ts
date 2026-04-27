import type { MetadataRoute } from 'next';
import { getLeagues } from '@/lib/api/leagues';
import { getTeams } from '@/lib/api/teams';
import { buildStandingsPath, leagueNameToSlug } from '@/lib/league-links';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildTeamPath } from '@/lib/team-links';
import { buildLeagueHubPath } from '@/lib/seo/slug';
import { getFixtures } from '@/lib/api/fixtures';
import { buildFixturePath } from '@/lib/seo/slug';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/football', changeFrequency: 'hourly', priority: 0.95 },
  { path: '/football/fixtures', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/football/leagues', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/football/standings', changeFrequency: 'daily', priority: 0.85 },
  { path: '/bonus-codes', changeFrequency: 'daily', priority: 0.75 },
];

async function buildFixtureEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const past = new Date(now);
  past.setDate(past.getDate() - 30);
  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const fromDate = past.toISOString().slice(0, 10);
  const toDate = future.toISOString().slice(0, 10);

  const allItems: Awaited<ReturnType<typeof getFixtures>>['items'] = [];
  let page = 1;
  while (true) {
    const batch = await getFixtures({
      from: fromDate,
      to: toDate,
      page,
      pageSize: 500,
      direction: 'asc',
    }).catch(() => null);
    if (!batch) break;
    allItems.push(...batch.items);
    if (!batch.hasNextPage) break;
    page++;
  }

  if (allItems.length === 0) {
    return [];
  }

  return allItems.map((fixture) => {
    const isUpcomingOrLive =
      fixture.stateBucket === 'Upcoming' || fixture.stateBucket === 'Live';
    const isFinished = fixture.stateBucket === 'Finished';
    const fixtureDate = fixture.kickoffAt.slice(0, 10);
    const isFuture = fixtureDate >= today;
    // Finished matches: odds and scores are final — use kickoff + 2h as last-modified
    // Live/upcoming: treat as recently modified so Googlebot recrawls promptly
    const kickoffMs = new Date(fixture.kickoffAt).getTime();
    // Finished: content is final — kickoff + 2h
    // Live: odds change every few seconds — use now so Googlebot recrawls promptly
    // Upcoming: pre-match odds update until kickoff — use kickoffAt as a stable anchor
    const lastModified = isFinished
      ? new Date(kickoffMs + 2 * 60 * 60 * 1000)
      : fixture.stateBucket === 'Live'
        ? now
        : new Date(fixture.kickoffAt);

    return {
      url: buildAbsoluteUrl(
        buildFixturePath(fixture.homeTeamName, fixture.awayTeamName, fixture.apiFixtureId),
      ),
      lastModified,
      changeFrequency: (isUpcomingOrLive ? 'hourly' : 'weekly') as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: isFuture ? 0.85 : isFinished ? 0.6 : 0.5,
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: buildAbsoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [teams, leagues, fixtureEntries] = await Promise.all([
    getTeams().catch(() => []),
    getLeagues(DEFAULT_SEASON).catch(() => []),
    buildFixtureEntries(),
  ]);

  const teamEntries: MetadataRoute.Sitemap = teams.map((team) => ({
    url: buildAbsoluteUrl(buildTeamPath(team.apiTeamId, team.name)),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Use a recent cutoff so standings entries reflect the last time they could have changed
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const standingsEntries: MetadataRoute.Sitemap = leagues.map((league) => ({
    url: buildAbsoluteUrl(buildStandingsPath(league.apiLeagueId, league.season, league.name)),
    lastModified: yesterday,
    changeFrequency: 'daily' as const,
    priority: 0.78,
  }));

  const seenLeagueSlugs = new Set<string>();
  const leagueHubEntries: MetadataRoute.Sitemap = [];
  for (const league of leagues) {
    const slug = leagueNameToSlug(league.name);
    if (!slug || seenLeagueSlugs.has(slug)) continue;
    seenLeagueSlugs.add(slug);
    leagueHubEntries.push({
      url: buildAbsoluteUrl(buildLeagueHubPath(league.name)),
      lastModified: yesterday,
      changeFrequency: 'daily' as const,
      priority: 0.82,
    });
  }

  return [
    ...staticEntries,
    ...leagueHubEntries,
    ...standingsEntries,
    ...teamEntries,
    ...fixtureEntries,
  ];
}
