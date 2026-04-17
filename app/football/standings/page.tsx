import type { Metadata } from 'next';
import { getLeagues } from '@/lib/api/leagues';
import { buildAbsoluteUrl } from '@/lib/site';
import StandingsPageClient from './StandingsPageClient';

interface StandingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          next.append(key, item);
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

function buildStandingsCanonicalPath(searchParams: URLSearchParams): string {
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const next = new URLSearchParams();

  if (leagueId) {
    next.set('leagueId', String(leagueId));
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  const query = next.toString();
  return query ? `/football/standings?${query}` : '/football/standings';
}

async function resolveLeagueContext(leagueId: number | null, season: number) {
  if (!leagueId) {
    return null;
  }

  const leagues = await getLeagues(season).catch(() => []);
  return leagues.find((league) => league.apiLeagueId === leagueId) ?? null;
}

export async function generateMetadata({ searchParams }: StandingsPageProps): Promise<Metadata> {
  const resolvedSearchParams = buildSearchParams(await searchParams);
  const leagueId = parsePositiveInt(resolvedSearchParams.get('leagueId'));
  const season = parsePositiveInt(resolvedSearchParams.get('season')) ?? DEFAULT_SEASON;
  const selectedLeague = await resolveLeagueContext(leagueId, season);
  const canonicalPath = buildStandingsCanonicalPath(resolvedSearchParams);
  const title = selectedLeague ? `${selectedLeague.name} Standings` : 'Football Standings';
  const description = selectedLeague
    ? `Browse the latest ${selectedLeague.name} standings, club positions, and table context for the ${season}/${season + 1} season on OddsDetector.`
    : `Browse football standings, league tables, and club positions across competitions on OddsDetector.`;

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

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const resolvedSearchParams = buildSearchParams(await searchParams);
  const leagueId = parsePositiveInt(resolvedSearchParams.get('leagueId'));
  const season = parsePositiveInt(resolvedSearchParams.get('season')) ?? DEFAULT_SEASON;
  const selectedLeague = await resolveLeagueContext(leagueId, season);
  const canonicalPath = buildStandingsCanonicalPath(resolvedSearchParams);

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
      ...(selectedLeague
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: selectedLeague.name,
              item: buildAbsoluteUrl(canonicalPath),
            },
          ]
        : []),
    ],
  };

  const collectionStructuredData = selectedLeague
    ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${selectedLeague.name} standings`,
        url: buildAbsoluteUrl(canonicalPath),
        about: {
          '@type': 'SportsOrganization',
          name: selectedLeague.name,
        },
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      {collectionStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionStructuredData) }}
        />
      ) : null}
      <StandingsPageClient />
    </>
  );
}
