import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildStandingsPath } from '@/lib/league-links';
import { buildAbsoluteUrl } from '@/lib/site';
import { getFixtures, getFixtureDetail, getFixtureBestOdds } from '@/lib/api/fixtures';
import type { BestOddsDto, FixtureDetailDto } from '@/lib/types/api';
import FixtureDetailPageClient from './FixtureDetailPageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildSportsEventSchema,
  type FixtureOfferInput,
} from '@/lib/seo/structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildFixturePath,
  buildFixtureSlug,
  parseFixtureSlugParam,
} from '@/lib/seo/slug';
import { buildTeamPath } from '@/lib/team-links';
import { FixtureSeoIntro } from '@/components/seo/FixtureSeoIntro';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const today = new Date().toISOString().slice(0, 10);
  const result = await getFixtures({
    date: today,
    page: 1,
    pageSize: 100,
    direction: 'asc',
  }).catch(() => null);

  return (result?.items ?? []).map((f) => ({
    fixtureId: buildFixtureSlug(f.homeTeamName, f.awayTeamName, f.apiFixtureId),
  }));
}

interface Props {
  params: Promise<{ fixtureId: string }>;
}

async function resolveFixtureDetail(apiFixtureId: number): Promise<FixtureDetailDto | null> {
  return getFixtureDetail(apiFixtureId).catch(() => null);
}

async function resolveBestOdds(apiFixtureId: number): Promise<BestOddsDto | null> {
  return getFixtureBestOdds(apiFixtureId).catch(() => null);
}

function buildTitle(detail: FixtureDetailDto): string {
  const home = detail.fixture.homeTeamName;
  const away = detail.fixture.awayTeamName;
  const league = detail.fixture.leagueName;

  switch (detail.fixture.stateBucket) {
    case 'Live':
      return `${home} vs ${away} Live Odds & Score`;
    case 'Finished': {
      const score =
        detail.fixture.homeGoals != null && detail.fixture.awayGoals != null
          ? `${detail.fixture.homeGoals}-${detail.fixture.awayGoals}`
          : null;
      return score
        ? `${home} ${score} ${away} — Result & Odds`
        : `${home} vs ${away} — Result & Odds`;
    }
    default:
      return `${home} vs ${away} Odds | ${league}`;
  }
}

function buildDescription(detail: FixtureDetailDto): string {
  const fixture = detail.fixture;
  const date = new Date(fixture.kickoffAt);
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  const scorePart =
    fixture.homeGoals != null && fixture.awayGoals != null
      ? ` Score: ${fixture.homeGoals}-${fixture.awayGoals}.`
      : '';
  const venuePart = fixture.venueName
    ? ` Venue: ${fixture.venueName}${fixture.venueCity ? `, ${fixture.venueCity}` : ''}.`
    : '';

  return `Compare ${fixture.homeTeamName} vs ${fixture.awayTeamName} odds for ${fixture.leagueName} — ${dateStr} ${timeStr} UTC. Best 1X2 prices across leading bookmakers on OddsDetector.${scorePart}${venuePart}`;
}

function toOffers(bestOdds: BestOddsDto | null, homeName: string, awayName: string): FixtureOfferInput[] {
  if (!bestOdds) return [];
  const offers: FixtureOfferInput[] = [];
  if (bestOdds.bestHomeOdd != null && bestOdds.bestHomeBookmaker) {
    offers.push({ name: `${homeName} to win`, bookmaker: bestOdds.bestHomeBookmaker, price: bestOdds.bestHomeOdd });
  }
  if (bestOdds.bestDrawOdd != null && bestOdds.bestDrawBookmaker) {
    offers.push({ name: 'Draw', bookmaker: bestOdds.bestDrawBookmaker, price: bestOdds.bestDrawOdd });
  }
  if (bestOdds.bestAwayOdd != null && bestOdds.bestAwayBookmaker) {
    offers.push({ name: `${awayName} to win`, bookmaker: bestOdds.bestAwayBookmaker, price: bestOdds.bestAwayOdd });
  }
  return offers;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fixtureId: param } = await params;
  const parsed = parseFixtureSlugParam(param);

  if (!parsed) {
    return buildPageMetadata({
      title: 'Match Details',
      description: 'OddsDetector fixture detail page.',
      canonicalPath: '/football/fixtures',
    });
  }

  const detail = await resolveFixtureDetail(parsed.apiFixtureId);

  if (!detail) {
    return buildPageMetadata({
      title: 'Match Details',
      description: 'OddsDetector fixture detail page.',
      canonicalPath: `/football/fixtures/${param}`,
      noindex: true,
    });
  }

  const canonicalPath = buildFixturePath(
    detail.fixture.homeTeamName,
    detail.fixture.awayTeamName,
    detail.fixture.apiFixtureId,
  );

  return buildPageMetadata({
    title: buildTitle(detail),
    description: buildDescription(detail),
    canonicalPath,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });
}

export default async function FixtureDetailPage({ params }: Props) {
  const { fixtureId: param } = await params;
  const parsed = parseFixtureSlugParam(param);

  if (!parsed) {
    redirect('/football/fixtures');
  }

  const [detail, bestOdds] = await Promise.all([
    resolveFixtureDetail(parsed.apiFixtureId),
    resolveBestOdds(parsed.apiFixtureId),
  ]);

  if (detail) {
    const canonicalSlug = buildFixtureSlug(
      detail.fixture.homeTeamName,
      detail.fixture.awayTeamName,
      detail.fixture.apiFixtureId,
    );
    if (param !== canonicalSlug) {
      redirect(`/football/fixtures/${canonicalSlug}`);
    }
  }

  // Re-wrap params for the existing client component, providing it the numeric ID
  const numericParams: Promise<{ fixtureId: string }> = Promise.resolve({
    fixtureId: String(parsed.apiFixtureId),
  });

  if (!detail) {
    return <FixtureDetailPageClient params={numericParams} />;
  }

  const canonicalPath = buildFixturePath(
    detail.fixture.homeTeamName,
    detail.fixture.awayTeamName,
    detail.fixture.apiFixtureId,
  );
  const offers = toOffers(bestOdds, detail.fixture.homeTeamName, detail.fixture.awayTeamName);

  const sportsEventSchema = buildSportsEventSchema({
    url: buildAbsoluteUrl(canonicalPath),
    name: `${detail.fixture.homeTeamName} vs ${detail.fixture.awayTeamName}`,
    description: buildDescription(detail),
    startDateIso: detail.fixture.kickoffAt,
    stateBucket: detail.fixture.stateBucket,
    homeTeamName: detail.fixture.homeTeamName,
    awayTeamName: detail.fixture.awayTeamName,
    homeScore: detail.fixture.homeGoals,
    awayScore: detail.fixture.awayGoals,
    leagueName: detail.fixture.leagueName,
    venueName: detail.fixture.venueName,
    venueCity: detail.fixture.venueCity,
    offers,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Football', path: '/football' },
    {
      name: detail.fixture.leagueName,
      path: buildStandingsPath(
        detail.fixture.leagueApiId,
        detail.fixture.season,
        detail.fixture.leagueName,
      ),
    },
    {
      name: `${detail.fixture.homeTeamName} vs ${detail.fixture.awayTeamName}`,
      path: canonicalPath,
    },
  ]);

  return (
    <>
      <JsonLd data={[sportsEventSchema, breadcrumbSchema]} />
      <FixtureSeoIntro
        homeName={detail.fixture.homeTeamName}
        awayName={detail.fixture.awayTeamName}
        leagueName={detail.fixture.leagueName}
        kickoffIso={detail.fixture.kickoffAt}
        venueName={detail.fixture.venueName}
        venueCity={detail.fixture.venueCity}
        round={detail.fixture.round}
        stateBucket={detail.fixture.stateBucket}
        homeGoals={detail.fixture.homeGoals}
        awayGoals={detail.fixture.awayGoals}
        bestOdds={bestOdds}
        homeTeamPath={buildTeamPath(detail.fixture.homeTeamApiId, detail.fixture.homeTeamName)}
        awayTeamPath={buildTeamPath(detail.fixture.awayTeamApiId, detail.fixture.awayTeamName)}
        leaguePath={buildStandingsPath(
          detail.fixture.leagueApiId,
          detail.fixture.season,
          detail.fixture.leagueName,
        )}
      />
      <FixtureDetailPageClient params={numericParams} />
    </>
  );
}
