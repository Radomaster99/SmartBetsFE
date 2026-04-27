import type { Metadata } from 'next';
import Link from 'next/link';
import { getLeagues } from '@/lib/api/leagues';
import { getFixtures } from '@/lib/api/fixtures';
import { buildStandingsPath } from '@/lib/league-links';
import { buildFixturePath } from '@/lib/seo/slug';
import FootballPageClient from './FootballPageClient';

export interface FootballLandingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

export function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseState(value: string | null): string {
  switch (value) {
    case 'Upcoming':
    case 'Live':
    case 'Finished':
    case 'Postponed':
    case 'Cancelled':
    case 'Other':
    case 'Unknown':
      return value;
    default:
      return 'All';
  }
}

export function parseUpcomingScope(value: string | null): 'today' | 'all' {
  return value === 'all' ? 'all' : 'today';
}

export function buildSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
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

function buildFootballCanonicalPath(searchParams: URLSearchParams, basePath: string): string {
  const state = parseState(searchParams.get('state'));
  const date = searchParams.get('date');
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const upcomingScope = parseUpcomingScope(searchParams.get('upcomingScope'));
  const view = searchParams.get('view');
  const next = new URLSearchParams();

  if (date) {
    next.set('date', date);
  }

  if (state !== 'All') {
    next.set('state', state);
  }

  if (leagueId) {
    next.set('leagueId', String(leagueId));
  }

  if (state === 'Upcoming' && leagueId && upcomingScope === 'all' && !date) {
    next.set('upcomingScope', 'all');
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    next.set('season', String(season));
  }

  const query = next.toString();
  if (view === 'standings') {
    return query ? `/football/standings?${query}` : '/football/standings';
  }

  return query ? `${basePath}?${query}` : basePath;
}

function buildFootballMetadataTitle(options: {
  view: string | null;
  state: string;
  leagueName: string | null;
}): string {
  const { view, state, leagueName } = options;

  if (view === 'standings') {
    return leagueName ? `${leagueName} Standings` : 'Football Standings';
  }

  const stateLabel =
    state === 'Live'
      ? 'Live Football Odds & Fixtures'
      : state === 'Upcoming'
        ? 'Upcoming Football Fixtures & Odds'
        : state === 'Finished'
          ? 'Finished Football Results & Odds'
          : 'Football Fixtures, Live Odds & Results';

  return leagueName ? `${leagueName} ${stateLabel}` : stateLabel;
}

function buildFootballMetadataDescription(options: {
  view: string | null;
  state: string;
  leagueName: string | null;
  season: number;
}): string {
  const { view, state, leagueName, season } = options;

  if (view === 'standings') {
    return leagueName
      ? `Follow the latest ${leagueName} standings, table positions, and club context for the ${season}/${season + 1} season on OddsDetector.`
      : `Browse football standings, league tables, and club positions for the ${season}/${season + 1} season on OddsDetector.`;
  }

  const stateDescription =
    state === 'Live'
      ? 'live football odds, in-play fixtures, and realtime match updates'
      : state === 'Upcoming'
        ? 'upcoming football fixtures and pre-match odds context'
        : state === 'Finished'
          ? 'finished football fixtures, results, and closing odds context'
          : 'football fixtures, live odds, and results';

  return leagueName
    ? `Track ${leagueName} ${stateDescription} on OddsDetector for the ${season}/${season + 1} season.`
    : `Track ${stateDescription} on OddsDetector across leagues and competitions.`;
}

async function resolveLeagueName(leagueId: number | null, season: number): Promise<string | null> {
  if (!leagueId) {
    return null;
  }

  const leagues = await getLeagues(season).catch(() => []);
  return leagues.find((league) => league.apiLeagueId === leagueId)?.name ?? null;
}

export async function generateFootballLandingMetadata(
  searchParamsPromise: FootballLandingPageProps['searchParams'],
  basePath: string,
): Promise<Metadata> {
  const resolvedSearchParams = buildSearchParams(await searchParamsPromise);
  const leagueId = parsePositiveInt(resolvedSearchParams.get('leagueId'));
  const season = parsePositiveInt(resolvedSearchParams.get('season')) ?? DEFAULT_SEASON;
  const view = resolvedSearchParams.get('view');
  const state = parseState(resolvedSearchParams.get('state'));
  const leagueName = await resolveLeagueName(leagueId, season);
  const canonicalPath =
    view === 'standings'
      ? buildStandingsPath(leagueId, season, leagueName)
      : buildFootballCanonicalPath(resolvedSearchParams, basePath);

  // Filtered/parameterised variants are not distinct indexable pages — noindex them
  // and let the canonical (clean base URL) accumulate all the ranking signal.
  const hasFilterParams =
    resolvedSearchParams.has('state') ||
    resolvedSearchParams.has('leagueId') ||
    resolvedSearchParams.has('date') ||
    resolvedSearchParams.has('season') ||
    resolvedSearchParams.has('view') ||
    resolvedSearchParams.has('upcomingScope');

  const title = buildFootballMetadataTitle({ view, state, leagueName });
  const description = buildFootballMetadataDescription({ view, state, leagueName, season });

  return {
    title,
    description,
    ...(hasFilterParams ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: canonicalPath,
      ...(!hasFilterParams && {
        languages: {
          'x-default': canonicalPath,
          'en': canonicalPath,
        },
      }),
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

export async function FootballLandingPage() {
  const today = new Date().toISOString().split('T')[0];
  const seeded = await getFixtures({
    page: 1,
    pageSize: 40,
    direction: 'asc',
    date: today,
  }).catch(() => null);

  const fixtures = seeded?.items ?? [];

  return (
    <>
      {fixtures.length > 0 && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          <ul>
            {fixtures.map((f) => (
              <li key={f.apiFixtureId}>
                <Link href={buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)}>
                  {f.homeTeamName} vs {f.awayTeamName} — {f.leagueName}
                  {f.liveOddsSummary?.bestHomeOdd != null && (
                    <> — Home {f.liveOddsSummary.bestHomeOdd} / Draw {f.liveOddsSummary.bestDrawOdd} / Away {f.liveOddsSummary.bestAwayOdd}</>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <FootballPageClient />
    </>
  );
}
