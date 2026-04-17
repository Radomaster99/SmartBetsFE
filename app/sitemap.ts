import type { MetadataRoute } from 'next';
import { getLeagues } from '@/lib/api/leagues';
import { getTeams } from '@/lib/api/teams';
import { buildStandingsPath } from '@/lib/league-links';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildTeamPath } from '@/lib/team-links';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/football', changeFrequency: 'hourly', priority: 0.95 },
  { path: '/football/leagues', changeFrequency: 'daily', priority: 0.8 },
  { path: '/football/standings', changeFrequency: 'daily', priority: 0.85 },
  { path: '/football/fixtures', changeFrequency: 'daily', priority: 0.75 },
  { path: '/bonus-codes', changeFrequency: 'daily', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: buildAbsoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const teams = await getTeams().catch(() => []);
  const teamEntries: MetadataRoute.Sitemap = teams.map((team) => ({
    url: buildAbsoluteUrl(buildTeamPath(team.apiTeamId, team.name)),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);
  const standingsEntries: MetadataRoute.Sitemap = leagues.map((league) => ({
    url: buildAbsoluteUrl(buildStandingsPath(league.apiLeagueId, league.season, league.name)),
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.78,
  }));

  return [...staticEntries, ...teamEntries, ...standingsEntries];
}
