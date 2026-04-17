import type { MetadataRoute } from 'next';
import { getTeams } from '@/lib/api/teams';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildTeamPath } from '@/lib/team-links';

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

  return [...staticEntries, ...teamEntries];
}
