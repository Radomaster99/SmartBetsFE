import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { deserializeBonusCodesDocument } from '@/lib/content-documents';
import { EMPTY_BONUS_CODES_PAGE_CONFIG } from '@/lib/bonus-codes';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/structured-data';
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site';
import { BonusCodesClient } from './BonusCodesClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Bookmaker Bonus Codes & Free Bet Offers',
  description:
    'Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses curated for football bettors on OddsDetector.',
  alternates: { canonical: '/bonus-codes' },
  openGraph: {
    title: 'Bookmaker Bonus Codes & Free Bet Offers | OddsDetector',
    description:
      'Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses curated for football bettors on OddsDetector.',
    url: buildAbsoluteUrl('/bonus-codes'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookmaker Bonus Codes & Free Bet Offers | OddsDetector',
    description: 'Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses on OddsDetector.',
  },
};

async function getBonusCodes() {
  try {
    const raw = await apiFetch<unknown[]>('/api/content/bonus-codes');
    return deserializeBonusCodesDocument(raw, EMPTY_BONUS_CODES_PAGE_CONFIG);
  } catch {
    return EMPTY_BONUS_CODES_PAGE_CONFIG;
  }
}

export default async function BonusCodesPage() {
  const config = await getBonusCodes();
  const activeEntries = config.entries.filter((e) => e.isActive);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: 'OddsDetector', path: '/' },
            { name: 'Bonus Codes', path: '/bonus-codes' },
          ]),
          ...(activeEntries.length > 0 ? [{
            '@context': 'https://schema.org',
            '@type': 'OfferCatalog',
            name: 'Bookmaker Bonus Codes & Free Bet Offers',
            url: buildAbsoluteUrl('/bonus-codes'),
            provider: { '@type': 'Organization', name: 'OddsDetector', url: getSiteUrl() },
            numberOfItems: activeEntries.length,
            itemListElement: activeEntries.map((entry, i) => ({
              '@type': 'Offer',
              position: i + 1,
              name: entry.offer,
              description: entry.description || entry.offer,
              seller: { '@type': 'Organization', name: entry.bookmaker },
              url: entry.href ?? buildAbsoluteUrl('/bonus-codes'),
              availability: 'https://schema.org/InStock',
              category: 'Sports Betting Bonus',
            })),
          }] : []),
        ]}
      />
      {activeEntries.length > 0 && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          <h1>Bookmaker Bonus Codes &amp; Free Bet Offers</h1>
          <p>Find the latest bookmaker bonus codes, free bet offers, and welcome bonuses curated for football bettors on OddsDetector.</p>
          <ul>
            {activeEntries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.bookmaker}</strong> — {entry.offer}
                {entry.href ? <Link href={entry.href}> Claim offer</Link> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <BonusCodesClient />
    </>
  );
}
