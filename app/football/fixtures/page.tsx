import type { Metadata } from 'next';
import Link from 'next/link';
import { getFixtures } from '@/lib/api/fixtures';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from '@/lib/seo/structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildFixturePath } from '@/lib/seo/slug';
import { buildAbsoluteUrl } from '@/lib/site';
import { FootballLandingPage } from '@/app/football/FootballLandingPage';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Football Fixtures & Odds — Today, Live & Upcoming',
    description:
      "Browse today's football fixtures with live and pre-match odds across leading bookmakers. Compare 1X2, BTTS, and over/under prices on every upcoming match.",
    canonicalPath: '/football/fixtures',
  });
}

export default async function FootballFixturesPage() {
  const todayPaged = await getFixtures({
    page: 1,
    pageSize: 60,
    direction: 'asc',
  }).catch(() => null);

  const fixtures = todayPaged?.items ?? [];
  const upcomingItems = fixtures.filter(
    (f) => f.stateBucket === 'Upcoming' || f.stateBucket === 'Live',
  );
  const itemList = buildItemListSchema(
    'Today’s football fixtures',
    upcomingItems.slice(0, 50).map((f) => ({
      name: `${f.homeTeamName} vs ${f.awayTeamName}`,
      path: buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId),
    })),
  );

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'Football', path: '/football' },
            { name: 'Fixtures', path: '/football/fixtures' },
          ]),
          buildCollectionPageSchema({
            name: 'Football Fixtures & Odds',
            description: 'Live and upcoming football fixtures with odds across top bookmakers.',
            url: buildAbsoluteUrl('/football/fixtures'),
          }),
          itemList,
        ]}
      />
      <section
        aria-label="Football fixtures overview"
        style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--t-border)',
          background: 'var(--t-surface)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--t-text-1)',
          }}
        >
          Football Fixtures & Odds
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            maxWidth: '78ch',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--t-text-4)',
          }}
        >
          Browse today’s football fixtures with live and pre-match odds across leading bookmakers. Compare 1X2,
          both-teams-to-score, and over/under prices on every upcoming match — and route each bet to the bookmaker
          offering the best value on OddsDetector.
        </p>
        {upcomingItems.length > 0 ? (
          <ul
            style={{
              margin: '10px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 12px',
              fontSize: 11,
            }}
          >
            <li style={{ color: 'var(--t-text-5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Today:
            </li>
            {upcomingItems.slice(0, 8).map((f) => (
              <li key={f.apiFixtureId}>
                <Link
                  href={buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)}
                  style={{ color: 'var(--t-accent)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {f.homeTeamName} vs {f.awayTeamName}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <FootballLandingPage />
    </>
  );
}
