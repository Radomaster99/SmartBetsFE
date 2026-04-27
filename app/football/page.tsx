import type { Metadata } from 'next';
import {
  FootballLandingPage,
  generateFootballLandingMetadata,
  type FootballLandingPageProps,
} from '@/app/football/FootballLandingPage';
import { BrandIntro } from '@/components/seo/BrandIntro';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildItemListSchema,
  type FaqEntry,
} from '@/lib/seo/structured-data';
import { getFixtures } from '@/lib/api/fixtures';
import { buildFixturePath } from '@/lib/seo/slug';

const FOOTBALL_FAQ: FaqEntry[] = [
  {
    question: 'How does OddsDetector compare football odds?',
    answer:
      'OddsDetector pulls live and pre-match prices from leading regulated bookmakers and surfaces the best available price for each market. Every match page shows the highest 1X2, BTTS, and over/under prices alongside the full bookmaker comparison.',
  },
  {
    question: 'Can I see live in-play football odds?',
    answer:
      'Yes. Live football odds update in real time during every tracked match. Open any match in the Live state to see the current bookmaker prices and how they have moved since kick-off.',
  },
  {
    question: 'Which football leagues are covered?',
    answer:
      'OddsDetector covers every major league and cup competition, including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League, Conference League, and international tournaments.',
  },
  {
    question: 'Why do bookmakers offer different odds on the same match?',
    answer:
      "Each bookmaker prices markets independently based on their own model, betting volume, and risk tolerance. That's why comparing prices across bookmakers — and routing each bet to the one offering the best value — is the single biggest edge a bettor has.",
  },
];

export async function generateMetadata({ searchParams }: FootballLandingPageProps): Promise<Metadata> {
  return generateFootballLandingMetadata(searchParams, '/football');
}

export default async function FootballPage() {
  const today = new Date().toISOString().split('T')[0];
  const todayFixtures = await getFixtures({
    page: 1,
    pageSize: 50,
    direction: 'asc',
    date: today,
  }).catch(() => null);

  const upcomingItems = (todayFixtures?.items ?? []).filter(
    (f) => f.stateBucket === 'Upcoming' || f.stateBucket === 'Live',
  );

  const itemList = buildItemListSchema(
    "Today's football fixtures & odds",
    upcomingItems.slice(0, 50).map((f) => ({
      name: `${f.homeTeamName} vs ${f.awayTeamName} — ${f.leagueName}`,
      path: buildFixturePath(f.homeTeamName, f.awayTeamName, f.apiFixtureId),
    })),
  );

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'OddsDetector', path: '/' },
            { name: 'Football', path: '/football' },
          ]),
          buildFaqPageSchema(FOOTBALL_FAQ),
          ...(upcomingItems.length > 0 ? [itemList] : []),
        ]}
      />
      <BrandIntro variant="football" />
      <FootballLandingPage />
    </>
  );
}
