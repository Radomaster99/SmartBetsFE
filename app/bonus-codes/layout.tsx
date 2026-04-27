import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqPageSchema,
  type FaqEntry,
} from '@/lib/seo/structured-data';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildAbsoluteUrl } from '@/lib/site';

const FAQ: FaqEntry[] = [
  {
    question: 'Are these bonus codes free to use?',
    answer:
      'Yes. Every bonus code on OddsDetector is free to claim. Most are welcome offers for new accounts at the listed bookmakers — terms and minimum deposits vary by offer.',
  },
  {
    question: 'Do bonus codes expire?',
    answer:
      'Some offers are time-limited and others are evergreen. We refresh listings regularly and remove offers once they end, but always check the bookmaker’s page for the current terms.',
  },
  {
    question: 'Are there wagering requirements?',
    answer:
      'Most welcome bonuses carry minimum-odds and rollover requirements. Tap an offer to see the bookmaker’s full terms and conditions before claiming.',
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: 'Bookmaker Bonus Codes & Free Bet Offers',
  description:
    'Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses curated for football bettors on OddsDetector.',
  canonicalPath: '/bonus-codes',
});

export default function BonusCodesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'OddsDetector', path: '/' },
            { name: 'Bonus Codes', path: '/bonus-codes' },
          ]),
          buildCollectionPageSchema({
            name: 'Bookmaker Bonus Codes & Free Bet Offers',
            description: 'Curated football betting bonus codes and welcome offers.',
            url: buildAbsoluteUrl('/bonus-codes'),
          }),
          buildFaqPageSchema(FAQ),
        ]}
      />
      {children}
    </>
  );
}
