import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeagues } from '@/lib/api/leagues';
import { getFixtures } from '@/lib/api/fixtures';
import { buildAbsoluteUrl } from '@/lib/site';
import { buildStandingsPath, leagueNameToSlug } from '@/lib/league-links';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildItemListSchema,
  buildSportsEventSchema,
  buildSportsOrganizationSchema,
  type FaqEntry,
} from '@/lib/seo/structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildFixturePath, buildLeagueHubPath } from '@/lib/seo/slug';
import { buildTeamPath } from '@/lib/team-links';
import type { LeagueDto } from '@/lib/types/api';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

const TOP_LEAGUE_SLUGS = [
  'premier-league',
  'la-liga',
  'bundesliga',
  'serie-a',
  'ligue-1',
  'uefa-champions-league',
  'uefa-europa-league',
  'uefa-conference-league',
  'world-cup',
  'euro-championship',
];

export async function generateStaticParams() {
  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);
  const fromApi = leagues.map((l) => ({ slug: leagueNameToSlug(l.name) })).filter((s) => s.slug);
  const seen = new Set(fromApi.map((s) => s.slug));
  const extra = TOP_LEAGUE_SLUGS.filter((s) => !seen.has(s)).map((s) => ({ slug: s }));
  return [...fromApi, ...extra];
}

export const dynamicParams = true;
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveLeagueBySlug(slug: string): Promise<LeagueDto | null> {
  const leagues = await getLeagues(DEFAULT_SEASON).catch(() => []);
  return leagues.find((l) => leagueNameToSlug(l.name) === slug) ?? null;
}

function buildLeagueIntro(name: string, season: number): string {
  return `Compare ${name} odds, fixtures, and standings on OddsDetector. Every match in the ${season}/${season + 1} ${name} season is tracked with live and pre-match prices across leading bookmakers — from kickoff to final whistle. Find the best 1X2, both-teams-to-score, over/under, and Asian handicap odds, and follow the standings as the season unfolds.`;
}

function buildLeagueFaq(name: string): FaqEntry[] {
  return [
    {
      question: `Where can I find the best ${name} odds?`,
      answer: `OddsDetector compares ${name} odds across the top regulated bookmakers in real time. The best price for each market is highlighted on every match page so you can route to the bookmaker offering the strongest value.`,
    },
    {
      question: `Are ${name} live odds updated in real time?`,
      answer: `Yes. ${name} live odds refresh in real time during matches via OddsDetector's live data feed, so the prices you see reflect the current market state as the match unfolds.`,
    },
    {
      question: `Which markets are tracked for ${name} matches?`,
      answer: `Every ${name} match on OddsDetector tracks 1X2 (match winner), both teams to score, over/under goals, and Asian handicap markets, with live updates during play.`,
    },
    {
      question: `Is OddsDetector free to use?`,
      answer: `Yes — browsing odds, fixtures, standings, and bonus codes on OddsDetector is completely free. We earn through affiliate partnerships with bookmakers when you click through to claim an offer.`,
    },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const league = await resolveLeagueBySlug(slug);

  if (!league) {
    return buildPageMetadata({
      title: 'League Hub',
      description: 'OddsDetector league hub.',
      canonicalPath: `/football/leagues/${slug}`,
      noindex: true,
    });
  }

  return buildPageMetadata({
    title: `${league.name} Odds, Fixtures & Standings`,
    description: `Compare ${league.name} odds, follow upcoming fixtures, and track standings for the ${league.season}/${league.season + 1} season on OddsDetector. Live and pre-match prices across top bookmakers.`,
    canonicalPath: buildLeagueHubPath(league.name),
  });
}

export default async function LeagueHubPage({ params }: PageProps) {
  const { slug } = await params;
  const league = await resolveLeagueBySlug(slug);

  if (!league) {
    notFound();
  }

  const canonicalPath = buildLeagueHubPath(league.name);
  const standingsPath = buildStandingsPath(league.apiLeagueId, league.season, league.name);

  const [upcomingPaged, recentPaged] = await Promise.all([
    getFixtures({
      leagueId: league.apiLeagueId,
      season: league.season,
      state: 'Upcoming',
      page: 1,
      pageSize: 12,
      direction: 'asc',
    }).catch(() => null),
    getFixtures({
      leagueId: league.apiLeagueId,
      season: league.season,
      state: 'Finished',
      page: 1,
      pageSize: 8,
      direction: 'desc',
    }).catch(() => null),
  ]);

  const upcoming = upcomingPaged?.items ?? [];
  const recent = recentPaged?.items ?? [];

  // Unique teams appearing in this league's fixtures — for internal linking
  const teamMap = new Map<number, { name: string; apiTeamId: number }>();
  for (const f of [...upcoming, ...recent]) {
    if (!teamMap.has(f.homeTeamApiId)) teamMap.set(f.homeTeamApiId, { name: f.homeTeamName, apiTeamId: f.homeTeamApiId });
    if (!teamMap.has(f.awayTeamApiId)) teamMap.set(f.awayTeamApiId, { name: f.awayTeamName, apiTeamId: f.awayTeamApiId });
  }
  const leagueTeams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Football', path: '/football' },
    { name: 'Leagues', path: '/football/leagues' },
    { name: league.name, path: canonicalPath },
  ]);

  const orgSchema = {
    ...buildSportsOrganizationSchema({
      name: league.name,
      url: buildAbsoluteUrl(canonicalPath),
      countryName: league.countryName,
    }),
    dateModified: upcoming[0]?.kickoffAt ?? recent[0]?.kickoffAt ?? new Date().toISOString(),
  };

  const itemList = buildItemListSchema(
    `${league.name} upcoming fixtures`,
    upcoming.map((f) => ({
      name: `${f.homeTeamName} vs ${f.awayTeamName}`,
      path: buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId),
    })),
  );

  const faq = buildFaqPageSchema(buildLeagueFaq(league.name));

  const teamItemList = leagueTeams.length > 0
    ? buildItemListSchema(
        `${league.name} teams`,
        leagueTeams.map((t) => ({
          name: t.name,
          path: buildTeamPath(t.apiTeamId, t.name),
        })),
      )
    : null;

  const upcomingEventSchemas = upcoming.slice(0, 6).map((f) =>
    buildSportsEventSchema({
      url: buildAbsoluteUrl(buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)),
      name: `${f.homeTeamName} vs ${f.awayTeamName}`,
      description: `${f.homeTeamName} vs ${f.awayTeamName} — ${league.name} odds on OddsDetector.`,
      startDateIso: f.kickoffAt,
      stateBucket: f.stateBucket,
      homeTeamName: f.homeTeamName,
      awayTeamName: f.awayTeamName,
      leagueName: league.name,
      venueName: f.venueName,
      venueCity: f.venueCity,
    }),
  );

  return (
    <>
      <JsonLd data={[breadcrumbs, orgSchema, itemList, faq, ...(teamItemList ? [teamItemList] : []), ...upcomingEventSchemas]} />
      <main style={{ padding: '20px 18px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <nav
          aria-label="Breadcrumb"
          style={{ fontSize: 11, color: 'var(--t-text-5)', marginBottom: 8 }}
        >
          <Link href="/football" style={{ color: 'inherit' }}>Football</Link>
          {' › '}
          <Link href="/football/leagues" style={{ color: 'inherit' }}>Leagues</Link>
          {' › '}
          <span style={{ color: 'var(--t-text-3)' }}>{league.name}</span>
        </nav>

        <header style={{ marginBottom: 16 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--t-text-1)',
            }}
          >
            {league.name} Odds, Fixtures & Standings
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              maxWidth: '70ch',
              fontSize: 13.5,
              lineHeight: 1.65,
              color: 'var(--t-text-4)',
            }}
          >
            {buildLeagueIntro(league.name, league.season)}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
            <Link
              href={standingsPath}
              style={{
                color: 'var(--t-accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              View {league.name} standings →
            </Link>
            <Link
              href={`/football?leagueId=${league.apiLeagueId}&season=${league.season}`}
              style={{
                color: 'var(--t-accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              All {league.name} fixtures →
            </Link>
          </div>
        </header>

        <section style={{ marginTop: 24 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--t-text-1)',
              borderBottom: '1px solid var(--t-border)',
              paddingBottom: 8,
            }}
          >
            Upcoming {league.name} fixtures
          </h2>
          {upcoming.length === 0 ? (
            <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--t-text-5)' }}>
              No upcoming fixtures right now. Check back soon — the {league.season}/{league.season + 1} season schedule
              updates as new rounds are confirmed.
            </p>
          ) : (
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
              {upcoming.map((fixture) => {
                const dt = new Date(fixture.kickoffAt);
                const dateStr = dt.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                });
                const timeStr = dt.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC',
                });
                return (
                  <li
                    key={fixture.apiFixtureId}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--t-border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ width: 110, color: 'var(--t-text-5)', fontSize: 11 }}>
                      {dateStr} {timeStr}
                    </span>
                    <Link
                      href={buildFixturePath(fixture.homeTeamName, fixture.awayTeamName, fixture.apiFixtureId)}
                      style={{
                        color: 'var(--t-text-2)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {fixture.homeTeamName} vs {fixture.awayTeamName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {recent.length > 0 ? (
          <section style={{ marginTop: 28 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--t-text-1)',
                borderBottom: '1px solid var(--t-border)',
                paddingBottom: 8,
              }}
            >
              Recent {league.name} results
            </h2>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
              {recent.map((fixture) => {
                const dt = new Date(fixture.kickoffAt);
                const dateStr = dt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                });
                const score =
                  fixture.homeGoals != null && fixture.awayGoals != null
                    ? `${fixture.homeGoals}-${fixture.awayGoals}`
                    : '—';
                return (
                  <li
                    key={fixture.apiFixtureId}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--t-border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ width: 70, color: 'var(--t-text-5)', fontSize: 11 }}>{dateStr}</span>
                    <Link
                      href={buildFixturePath(fixture.homeTeamName, fixture.awayTeamName, fixture.apiFixtureId)}
                      style={{
                        color: 'var(--t-text-2)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      {fixture.homeTeamName} {score} {fixture.awayTeamName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {leagueTeams.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--t-text-1)',
                borderBottom: '1px solid var(--t-border)',
                paddingBottom: 8,
              }}
            >
              {league.name} teams
            </h2>
            <ul
              style={{
                margin: '12px 0 0',
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 10px',
              }}
            >
              {leagueTeams.map((team) => (
                <li key={team.apiTeamId}>
                  <Link
                    href={buildTeamPath(team.apiTeamId, team.name)}
                    style={{
                      fontSize: 12,
                      color: 'var(--t-text-3)',
                      textDecoration: 'none',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--t-surface)',
                      border: '1px solid var(--t-border)',
                      display: 'inline-block',
                    }}
                  >
                    {team.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginTop: 28 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--t-text-1)',
              borderBottom: '1px solid var(--t-border)',
              paddingBottom: 8,
            }}
          >
            {league.name} betting FAQ
          </h2>
          <div style={{ marginTop: 12 }}>
            {buildLeagueFaq(league.name).map((entry) => (
              <details
                key={entry.question}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--t-border)',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--t-text-2)',
                  }}
                >
                  {entry.question}
                </summary>
                <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--t-text-4)' }}>
                  {entry.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
