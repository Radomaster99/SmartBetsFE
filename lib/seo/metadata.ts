import type { Metadata } from 'next';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

export function clampTitle(title: string): string {
  if (title.length <= TITLE_MAX) return title;
  return title.slice(0, TITLE_MAX - 1).trimEnd() + '…';
}

export function clampDescription(description: string): string {
  if (description.length <= DESCRIPTION_MAX) return description;
  return description.slice(0, DESCRIPTION_MAX - 1).trimEnd() + '…';
}

export interface PageMetadataInput {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  ogImages?: Array<{ url: string; alt?: string }>;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const title = clampTitle(input.title);
  const description = clampDescription(input.description);

  return {
    title,
    description,
    alternates: {
      canonical: input.canonicalPath,
      ...(!input.noindex && {
        languages: {
          'x-default': input.canonicalPath,
          'en': input.canonicalPath,
        },
      }),
    },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${title} | OddsDetector`,
      description,
      url: input.canonicalPath,
      type: input.ogType ?? 'website',
      siteName: 'OddsDetector',
      images: input.ogImages,
    },
    twitter: {
      card: input.twitterCard ?? 'summary_large_image',
      title: `${title} | OddsDetector`,
      description,
      images: input.ogImages?.map((img) => img.url),
    },
  };
}
