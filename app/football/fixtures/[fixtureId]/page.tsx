import type { Metadata } from 'next';
import { buildStandingsPath } from '@/lib/league-links';
import { buildAbsoluteUrl } from '@/lib/site';
import { getFixtureDetail } from '@/lib/api/fixtures';
import FixtureDetailPageClient from './FixtureDetailPageClient';

interface Props {
  params: Promise<{ fixtureId: string }>;
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function resolveFixtureDetail(fixtureIdValue: string) {
  const fixtureId = parsePositiveInt(fixtureIdValue);

  if (!fixtureId) {
    return null;
  }

  return getFixtureDetail(fixtureId).catch(() => null);
}

function buildFixtureMetadataTitle(detail: Awaited<ReturnType<typeof resolveFixtureDetail>>) {
  if (!detail) {
    return 'Match Details';
  }

  return `${detail.fixture.homeTeamName} vs ${detail.fixture.awayTeamName} Odds & Match Details`;
}

function buildFixtureMetadataDescription(detail: Awaited<ReturnType<typeof resolveFixtureDetail>>) {
  if (!detail) {
    return 'OddsDetector fixture detail page.';
  }

  const fixture = detail.fixture;
  const scorePart =
    fixture.homeGoals != null && fixture.awayGoals != null
      ? ` Current score ${fixture.homeGoals}-${fixture.awayGoals}.`
      : '';
  const venuePart = fixture.venueName
    ? ` Venue: ${fixture.venueName}${fixture.venueCity ? `, ${fixture.venueCity}` : ''}.`
    : '';
  const roundPart = fixture.round ? ` ${fixture.round}.` : '';

  return `Follow ${fixture.homeTeamName} vs ${fixture.awayTeamName} in ${fixture.leagueName} with live odds, match center context, and H2H data on OddsDetector.${roundPart}${scorePart}${venuePart}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fixtureId } = await params;
  const detail = await resolveFixtureDetail(fixtureId);
  const canonicalPath = `/football/fixtures/${fixtureId}`;
  const title = buildFixtureMetadataTitle(detail);
  const description = buildFixtureMetadataDescription(detail);

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

export default async function FixtureDetailPage({ params }: Props) {
  const { fixtureId } = await params;
  const detail = await resolveFixtureDetail(fixtureId);

  const fixtureStructuredData = detail
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${detail.fixture.homeTeamName} vs ${detail.fixture.awayTeamName}`,
        sport: 'Soccer',
        startDate: detail.fixture.kickoffAt,
        url: buildAbsoluteUrl(`/football/fixtures/${detail.fixture.apiFixtureId}`),
        eventStatus: detail.fixture.stateBucket,
        location: detail.fixture.venueName
          ? {
              '@type': 'Place',
              name: detail.fixture.venueName,
              address: detail.fixture.venueCity || undefined,
            }
          : undefined,
        homeTeam: {
          '@type': 'SportsTeam',
          name: detail.fixture.homeTeamName,
        },
        awayTeam: {
          '@type': 'SportsTeam',
          name: detail.fixture.awayTeamName,
        },
        competitor: [
          {
            '@type': 'SportsTeam',
            name: detail.fixture.homeTeamName,
          },
          {
            '@type': 'SportsTeam',
            name: detail.fixture.awayTeamName,
          },
        ],
      }
    : null;

  const breadcrumbStructuredData = detail
    ? {
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
            name: detail.fixture.leagueName,
            item: buildAbsoluteUrl(
              buildStandingsPath(
                detail.fixture.leagueApiId,
                detail.fixture.season,
                detail.fixture.leagueName,
              ),
            ),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${detail.fixture.homeTeamName} vs ${detail.fixture.awayTeamName}`,
            item: buildAbsoluteUrl(`/football/fixtures/${detail.fixture.apiFixtureId}`),
          },
        ],
      }
    : null;

  return (
    <>
      {fixtureStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fixtureStructuredData) }}
        />
      ) : null}
      {breadcrumbStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
      ) : null}
      <FixtureDetailPageClient params={params} />
    </>
  );
}
