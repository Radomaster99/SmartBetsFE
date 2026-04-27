import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLeagues } from '@/lib/api/leagues';
import { getFixtures } from '@/lib/api/fixtures';
import { buildStandingsPath } from '@/lib/league-links';
import { getTeam, getTeams } from '@/lib/api/teams';
import { buildAbsoluteUrl } from '@/lib/site';
import { appendSearchParams, buildTeamPath, teamNameToSlug } from '@/lib/team-links';
import { buildFixturePath, buildLeagueHubPath } from '@/lib/seo/slug';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildSportsEventSchema } from '@/lib/seo/structured-data';
import TeamPageClient from '../TeamPageClient';

interface TeamPageProps {
  params: Promise<{ teamId: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const teams = await getTeams().catch(() => []);
  return teams.slice(0, 300).map((t) => ({
    teamId: String(t.apiTeamId),
    slug: teamNameToSlug(t.name),
  }));
}

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function buildSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          next.append(key, entry);
        }
      }
      continue;
    }

    if (value) {
      next.set(key, value);
    }
  }

  return next;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function resolveTeam(teamIdValue: string) {
  const apiTeamId = Number(teamIdValue);

  if (!Number.isFinite(apiTeamId) || apiTeamId <= 0) {
    return null;
  }

  return getTeam(apiTeamId).catch(() => null);
}

async function resolveLeagueContext(leagueId: number | null, season: number) {
  if (!leagueId) {
    return null;
  }

  const leagues = await getLeagues(season).catch(() => []);
  return leagues.find((league) => league.apiLeagueId === leagueId) ?? null;
}

function buildCanonicalTeamSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams();
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;

  if (leagueId) {
    next.set('leagueId', String(leagueId));
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  return next;
}

function buildTeamMetadataDescription(
  team: Awaited<ReturnType<typeof resolveTeam>>,
  leagueName?: string | null,
) {
  if (!team) {
    return 'OddsDetector team page.';
  }

  const detailParts = [
    team.countryName,
    team.venueName,
    team.founded ? `Founded ${team.founded}` : null,
  ].filter(Boolean);

  const detailSuffix = detailParts.length > 0 ? ` ${detailParts.join(' · ')}.` : '';
  const leagueSuffix = leagueName
    ? ` Follow ${team.name} in ${leagueName} with fixtures, squad context, and recent form.`
    : ` Follow ${team.name} with fixtures, squad context, and recent form.`;

  return `Track ${team.name} odds context, team details, and club information on OddsDetector.${leagueSuffix}${detailSuffix}`;
}

export async function generateMetadata({ params, searchParams }: TeamPageProps): Promise<Metadata> {
  const { teamId } = await params;
  const team = await resolveTeam(teamId);

  if (!team) {
    return {
      title: 'Team',
      description: 'OddsDetector team page.',
    };
  }

  const resolvedSearchParams = buildSearchParams(await searchParams);
  const canonicalSearchParams = buildCanonicalTeamSearchParams(resolvedSearchParams);
  const seasonContext = parsePositiveInt(canonicalSearchParams.get('season')) ?? DEFAULT_SEASON;
  const selectedLeague = await resolveLeagueContext(
    parsePositiveInt(canonicalSearchParams.get('leagueId')),
    seasonContext,
  );
  const canonicalPath = appendSearchParams(buildTeamPath(team.apiTeamId, team.name), canonicalSearchParams);
  const title = `${team.name} Odds, Fixtures & Stats`;
  const description = buildTeamMetadataDescription(team, selectedLeague?.name ?? null);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: { 'x-default': canonicalPath, 'en': canonicalPath },
    },
    openGraph: {
      title: `${title} | OddsDetector`,
      description,
      url: canonicalPath,
      type: 'website',
      images: team.logoUrl ? [{ url: team.logoUrl, alt: team.name }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: `${title} | OddsDetector`,
      description,
      images: team.logoUrl ? [team.logoUrl] : undefined,
    },
  };
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { teamId, slug } = await params;
  const team = await resolveTeam(teamId);

  if (!team) {
    notFound();
  }

  const resolvedSearchParams = buildSearchParams(await searchParams);
  const canonicalSearchParams = buildCanonicalTeamSearchParams(resolvedSearchParams);
  const leagueId = parsePositiveInt(canonicalSearchParams.get('leagueId'));
  const seasonContext = parsePositiveInt(canonicalSearchParams.get('season')) ?? DEFAULT_SEASON;
  const selectedLeague = await resolveLeagueContext(leagueId, seasonContext);
  const canonicalPath = appendSearchParams(buildTeamPath(team.apiTeamId, team.name), canonicalSearchParams);
  const canonicalSlug = teamNameToSlug(team.name);

  if (slug !== canonicalSlug) {
    redirect(canonicalPath);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    sport: 'Football',
    url: buildAbsoluteUrl(canonicalPath),
    logo: team.logoUrl || undefined,
    foundingDate: team.founded ? String(team.founded) : undefined,
    homeLocation: team.countryName || undefined,
    location: team.venueCity || undefined,
    stadiumOrArena: team.venueName || undefined,
  };

  const breadcrumbItems = [
    { name: 'Football', item: buildAbsoluteUrl('/football') },
    selectedLeague
      ? {
          name: selectedLeague.name,
          item: buildAbsoluteUrl(
            buildStandingsPath(selectedLeague.apiLeagueId, seasonContext, selectedLeague.name),
          ),
        }
      : {
          name: 'Standings',
          item: buildAbsoluteUrl('/football/standings'),
        },
    { name: team.name, item: buildAbsoluteUrl(canonicalPath) },
  ];

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  const recentFixtures = await getFixtures({
    teamId: team.apiTeamId,
    season: seasonContext,
    state: 'Finished',
    page: 1,
    pageSize: 8,
    direction: 'desc',
  }).catch(() => null);

  const upcomingFixtures = await getFixtures({
    teamId: team.apiTeamId,
    season: seasonContext,
    state: 'Upcoming',
    page: 1,
    pageSize: 5,
    direction: 'asc',
  }).catch(() => null);

  const recentItems = recentFixtures?.items ?? [];
  const upcomingItems = upcomingFixtures?.items ?? [];

  const upcomingEventSchemas = upcomingItems.slice(0, 5).map((f) =>
    buildSportsEventSchema({
      url: buildAbsoluteUrl(buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)),
      name: `${f.homeTeamName} vs ${f.awayTeamName}`,
      description: `${f.homeTeamName} vs ${f.awayTeamName} — ${f.leagueName} odds on OddsDetector.`,
      startDateIso: f.kickoffAt,
      stateBucket: f.stateBucket,
      homeTeamName: f.homeTeamName,
      awayTeamName: f.awayTeamName,
      leagueName: f.leagueName,
      venueName: f.venueName,
      venueCity: f.venueCity,
    }),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      {upcomingEventSchemas.length > 0 && (
        <JsonLd data={upcomingEventSchemas} />
      )}
      {(recentItems.length > 0 || upcomingItems.length > 0) && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          <h1>{team.name} Odds, Fixtures &amp; Stats</h1>
          {selectedLeague && (
            <p>
              <Link href={buildLeagueHubPath(selectedLeague.name)}>{selectedLeague.name}</Link>
              {' '}&mdash; {team.countryName}
            </p>
          )}
          {upcomingItems.length > 0 && (
            <>
              <h2>Upcoming {team.name} fixtures</h2>
              <ul>
                {upcomingItems.map((f) => (
                  <li key={f.apiFixtureId}>
                    <Link href={buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)}>
                      {f.homeTeamName} vs {f.awayTeamName} — {f.leagueName}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {recentItems.length > 0 && (
            <>
              <h2>Recent {team.name} results</h2>
              <ul>
                {recentItems.map((f) => (
                  <li key={f.apiFixtureId}>
                    <Link href={buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)}>
                      {f.homeTeamName} {f.homeGoals ?? '?'}-{f.awayGoals ?? '?'} {f.awayTeamName}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <TeamPageClient
        teamId={team.apiTeamId}
        initialTeam={team}
        initialLeagueName={selectedLeague?.name ?? null}
        seasonContext={seasonContext}
      />
    </>
  );
}
