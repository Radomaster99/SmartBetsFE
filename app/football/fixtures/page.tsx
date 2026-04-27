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

export const revalidate = 300;

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
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
      >
        <h1>Football Fixtures &amp; Odds</h1>
        <p>
          Browse today&apos;s football fixtures with live and pre-match odds across leading bookmakers. Compare 1X2,
          both-teams-to-score, and over/under prices on every upcoming match.
        </p>
        {upcomingItems.length > 0 && (
          <ul>
            {upcomingItems.slice(0, 8).map((f) => (
              <li key={f.apiFixtureId}>
                <Link href={buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId)}>
                  {f.homeTeamName} vs {f.awayTeamName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <FootballLandingPage />
    </>
  );
}
