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
  type FaqEntry,
} from '@/lib/seo/structured-data';

const HOME_FAQ: FaqEntry[] = [
  {
    question: 'What is OddsDetector?',
    answer:
      'OddsDetector is a free football odds comparison tool. We track live and pre-match odds across the top regulated bookmakers and highlight the best price for every market on every match.',
  },
  {
    question: 'Are the odds updated in real time?',
    answer:
      'Yes. Live football odds on OddsDetector update in real time during matches via our live data feed, so the prices you see reflect the current market state as the match unfolds.',
  },
  {
    question: 'Which sports does OddsDetector cover?',
    answer:
      'OddsDetector currently focuses on football (soccer), covering every major league and competition including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League, and international tournaments such as the World Cup and the Euros.',
  },
  {
    question: 'Is OddsDetector free to use?',
    answer:
      'Yes — browsing odds, fixtures, standings, and bonus codes on OddsDetector is completely free. We earn through affiliate partnerships with bookmakers when you click through to claim an offer.',
  },
  {
    question: 'How do I find the best odds for a match?',
    answer:
      'Open any match page on OddsDetector to see the best 1X2 prices highlighted at the top, alongside a full odds comparison across all tracked bookmakers. The bookmaker offering the strongest price for each outcome is shown with a single click to that bookmaker.',
  },
];

export async function generateMetadata({ searchParams }: FootballLandingPageProps): Promise<Metadata> {
  return generateFootballLandingMetadata(searchParams, '/');
}

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([{ name: 'OddsDetector', path: '/' }]),
          buildFaqPageSchema(HOME_FAQ),
        ]}
      />
      <BrandIntro variant="home" />
      <FootballLandingPage />
    </>
  );
}
