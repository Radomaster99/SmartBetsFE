import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLeagues } from '@/lib/api/leagues';
import { buildStandingsPath } from '@/lib/league-links';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildLeagueHubPath } from '@/lib/seo/slug';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildItemListSchema } from '@/lib/seo/structured-data';
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
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  return buildStandingsPath(null, season);
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
  const canonicalPath = selectedLeague
    ? buildStandingsPath(selectedLeague.apiLeagueId, season, selectedLeague.name)
    : buildStandingsCanonicalPath(resolvedSearchParams);
  const title = selectedLeague ? `${selectedLeague.name} Standings` : 'Football Standings';
  const description = selectedLeague
    ? `Browse the latest ${selectedLeague.name} standings, club positions, and table context for the ${season}/${season + 1} season on OddsDetector.`
    : `Browse football standings, league tables, and club positions across competitions on OddsDetector.`;

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

  if (selectedLeague) {
    redirect(buildStandingsPath(selectedLeague.apiLeagueId, season, selectedLeague.name));
  }

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
    ],
  };

  const collectionStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Football standings',
    url: buildAbsoluteUrl(canonicalPath),
    about: {
      '@type': 'SportsOrganization',
      name: 'Football standings',
    },
  };

  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);

  const leagueItemList = buildItemListSchema(
    'Football leagues with standings',
    leagues.slice(0, 100).map((l) => ({
      name: `${l.name} standings`,
      path: buildStandingsPath(l.apiLeagueId, l.season, l.name),
    })),
  );

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
      {leagues.length > 0 && <JsonLd data={[leagueItemList]} />}
      {leagues.length > 0 && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          <h1>Football Standings</h1>
          <p>Browse football league tables, standings, and club positions across all major competitions on OddsDetector.</p>
          <ul>
            {leagues.map((league) => (
              <li key={league.apiLeagueId}>
                <Link href={buildLeagueHubPath(league.name)}>{league.name}</Link>
                {' — '}
                <Link href={buildStandingsPath(league.apiLeagueId, league.season, league.name)}>
                  {league.name} standings
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <StandingsPageClient />
    </>
  );
}
