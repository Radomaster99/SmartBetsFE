import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLeagues } from '@/lib/api/leagues';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildStandingsPath, leagueNameToSlug } from '@/lib/league-links';
import StandingsPageClient from '../../../StandingsPageClient';

interface StandingsLeaguePageProps {
  params: Promise<{ leagueId: string; season: string; slug: string }>;
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function resolveLeagueContext(leagueIdValue: string, seasonValue: string) {
  const leagueId = parsePositiveInt(leagueIdValue);
  const season = parsePositiveInt(seasonValue);

  if (!leagueId || !season) {
    return null;
  }

  const leagues = await getLeagues(season).catch(() => []);
  const selectedLeague = leagues.find((league) => league.apiLeagueId === leagueId) ?? null;

  if (!selectedLeague) {
    return null;
  }

  return { league: selectedLeague, season };
}

function buildDescription(leagueName: string, season: number) {
  return `Browse the latest ${leagueName} standings, club positions, and table context for the ${season}/${season + 1} season on OddsDetector.`;
}

export async function generateMetadata({ params }: StandingsLeaguePageProps): Promise<Metadata> {
  const { leagueId, season } = await params;
  const resolved = await resolveLeagueContext(leagueId, season);

  if (!resolved) {
    return {
      title: 'Football Standings',
      description: 'Browse football standings, league tables, and club positions across competitions on OddsDetector.',
    };
  }

  const canonicalPath = buildStandingsPath(resolved.league.apiLeagueId, resolved.season, resolved.league.name);
  const title = `${resolved.league.name} Standings`;
  const description = buildDescription(resolved.league.name, resolved.season);

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
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | OddsDetector`,
      description,
    },
  };
}

export default async function StandingsLeaguePage({ params }: StandingsLeaguePageProps) {
  const { leagueId, season, slug } = await params;
  const resolved = await resolveLeagueContext(leagueId, season);

  if (!resolved) {
    notFound();
  }

  const canonicalSlug = leagueNameToSlug(resolved.league.name);
  const canonicalPath = buildStandingsPath(resolved.league.apiLeagueId, resolved.season, resolved.league.name);

  if (slug !== canonicalSlug) {
    redirect(canonicalPath);
  }

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Football',
        item: buildAbsoluteUrl('/football'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Standings',
        item: buildAbsoluteUrl('/football/standings'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: resolved.league.name,
        item: buildAbsoluteUrl(canonicalPath),
      },
    ],
  };

  const collectionStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${resolved.league.name} standings`,
    url: buildAbsoluteUrl(canonicalPath),
    about: {
      '@type': 'SportsOrganization',
      name: resolved.league.name,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData) }}
      />
      <StandingsPageClient
        initialLeagueId={resolved.league.apiLeagueId}
        initialSeason={resolved.season}
        initialLeagueName={resolved.league.name}
      />
    </>
  );
}
