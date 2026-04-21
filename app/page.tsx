import type { Metadata } from 'next';
import {
  FootballLandingPage,
  generateFootballLandingMetadata,
  type FootballLandingPageProps,
} from '@/app/football/FootballLandingPage';

export async function generateMetadata({ searchParams }: FootballLandingPageProps): Promise<Metadata> {
  return generateFootballLandingMetadata(searchParams, '/');
}

export default function HomePage() {
  return <FootballLandingPage />;
}
