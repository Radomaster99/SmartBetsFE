import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLeagues } from '@/lib/api/leagues';
import { getTeam } from '@/lib/api/teams';
import { buildAbsoluteUrl } from '@/lib/site';
import { appendSearchParams, buildTeamPath, teamNameToSlug } from '@/lib/team-links';
import TeamPageClient from '../TeamPageClient';

interface TeamPageProps {
  params: Promise<{ teamId: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
          item: buildAbsoluteUrl(`/football/standings?leagueId=${selectedLeague.apiLeagueId}&season=${seasonContext}`),
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
      <TeamPageClient
        teamId={team.apiTeamId}
        initialTeam={team}
        initialLeagueName={selectedLeague?.name ?? null}
        seasonContext={seasonContext}
      />
    </>
  );
}
