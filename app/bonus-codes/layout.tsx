import type { Metadata } from 'next';
import { buildAbsoluteUrl } from '@/lib/site';

const title = 'Bookmaker Bonus Codes & Free Bet Offers';
const description =
  'Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses curated for football bettors on OddsDetector.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/bonus-codes',
  },
  openGraph: {
    title: `${title} | OddsDetector`,
    description,
    url: '/bonus-codes',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | OddsDetector`,
    description,
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: buildAbsoluteUrl('/'),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Bonus Codes',
      item: buildAbsoluteUrl('/bonus-codes'),
    },
  ],
};

export default function BonusCodesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
