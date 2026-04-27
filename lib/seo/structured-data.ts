import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site';

export interface JsonLdObject {
  '@context': string;
  '@type': string | string[];
  [key: string]: unknown;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildWebSiteSchema(): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'OddsDetector',
    alternateName: ['Odds Detector', 'OddsDetector.com'],
    url: siteUrl,
    description:
      'Compare football odds across the top bookmakers. Live and pre-match odds, fixtures, standings, and bookmaker bonus codes.',
    inLanguage: 'en',
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema(): JsonLdObject {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'OddsDetector',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/icon`,
    },
    sameAs: [],
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function buildFaqPageSchema(entries: FaqEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

export interface FixtureOfferInput {
  name: string;
  bookmaker: string;
  price: number;
}

export interface SportsEventInput {
  url: string;
  name: string;
  description: string;
  startDateIso: string;
  stateBucket?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  leagueName?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  offers?: FixtureOfferInput[];
}

function eventStatusFromBucket(bucket?: string): string | undefined {
  switch (bucket) {
    case 'Live':
    case 'Upcoming':
      return 'https://schema.org/EventScheduled';
    case 'Finished':
      return 'https://schema.org/EventCompleted';
    case 'Postponed':
      return 'https://schema.org/EventPostponed';
    case 'Cancelled':
      return 'https://schema.org/EventCancelled';
    default:
      return undefined;
  }
}

export function buildSportsEventSchema(input: SportsEventInput): JsonLdObject {
  const event: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: input.name,
    description: input.description,
    sport: 'Soccer',
    startDate: input.startDateIso,
    url: input.url,
    eventStatus: eventStatusFromBucket(input.stateBucket),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: input.venueName
      ? {
          '@type': 'Place',
          name: input.venueName,
          address: input.venueCity
            ? {
                '@type': 'PostalAddress',
                addressLocality: input.venueCity,
              }
            : undefined,
        }
      : undefined,
    organizer: input.leagueName
      ? {
          '@type': 'SportsOrganization',
          name: input.leagueName,
        }
      : undefined,
    homeTeam: {
      '@type': 'SportsTeam',
      name: input.homeTeamName,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: input.awayTeamName,
    },
    competitor: [
      { '@type': 'SportsTeam', name: input.homeTeamName },
      { '@type': 'SportsTeam', name: input.awayTeamName },
    ],
  };

  if (input.homeScore != null && input.awayScore != null) {
    event.homeTeamScore = input.homeScore;
    event.awayTeamScore = input.awayScore;
  }

  if (input.offers && input.offers.length > 0) {
    event.offers = input.offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: 'USD',
      seller: {
        '@type': 'Organization',
        name: offer.bookmaker,
      },
      url: input.url,
      availability: 'https://schema.org/InStock',
    }));
  }

  return event;
}

export interface SportsTeamInput {
  url: string;
  name: string;
  logoUrl?: string | null;
  founded?: number | null;
  countryName?: string | null;
  venueCity?: string | null;
  venueName?: string | null;
}

export function buildSportsTeamSchema(input: SportsTeamInput): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: input.name,
    sport: 'Football',
    url: input.url,
    logo: input.logoUrl || undefined,
    foundingDate: input.founded ? String(input.founded) : undefined,
    homeLocation: input.countryName || undefined,
    location: input.venueCity || undefined,
    stadiumOrArena: input.venueName || undefined,
  };
}

export interface SportsOrganizationInput {
  name: string;
  url: string;
  countryName?: string | null;
}

export function buildSportsOrganizationSchema(input: SportsOrganizationInput): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: input.name,
    url: input.url,
    sport: 'Soccer',
    location: input.countryName || undefined,
  };
}

export interface ItemListEntry {
  name: string;
  path: string;
  description?: string;
}

export function buildItemListSchema(name: string, entries: ItemListEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: buildAbsoluteUrl(entry.path),
      name: entry.name,
    })),
  };
}

export interface CollectionPageInput {
  name: string;
  description: string;
  url: string;
}

export function buildCollectionPageSchema(input: CollectionPageInput): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: 'en',
  };
}
