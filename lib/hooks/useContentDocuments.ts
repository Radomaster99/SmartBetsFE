'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_BONUS_CODES_PAGE_CONFIG,
  readBonusCodesPageConfig,
  type BonusCodesPageConfig,
} from '@/lib/bonus-codes';
import {
  DEFAULT_HERO_BANNER_LAYOUT,
  DEFAULT_HERO_BANNERS,
  readHeroBannerLayoutConfig,
  readHeroBannersConfig,
  type HeroBannerConfig,
  type HeroBannerLayoutConfig,
} from '@/lib/hero-banners';
import {
  DEFAULT_POPULAR_LEAGUES_PRESET,
  readPopularLeaguePresets,
  ADMIN_POPULAR_LEAGUES_STORAGE_KEY,
  type PopularLeaguePreset,
} from '@/lib/popular-leagues';
import { EMPTY_SIDE_ADS_CONFIG, readSideAdsConfig, type SideAdsConfig } from '@/lib/side-ads';
import {
  deserializeBonusCodesDocument,
  deserializeHeroBannersDocument,
  deserializePopularLeaguesDocument,
  deserializeSideAdsDocument,
  serializeBonusCodesDocument,
  serializeHeroBannersDocument,
  serializePopularLeaguesDocument,
  serializeSideAdsDocument,
  type ContentDocumentId,
  type HeroBannersContentDocument,
} from '@/lib/content-documents';

export const CONTENT_QUERY_KEYS = {
  bonusCodes: ['content', 'bonus-codes'] as const,
  heroBanners: ['content', 'hero-banners'] as const,
  sideAds: ['content', 'side-ads'] as const,
  popularLeagues: ['content', 'popular-leagues'] as const,
  adminBonusCodes: ['admin-content', 'bonus-codes'] as const,
  adminHeroBanners: ['admin-content', 'hero-banners'] as const,
  adminSideAds: ['admin-content', 'side-ads'] as const,
  adminPopularLeagues: ['admin-content', 'popular-leagues'] as const,
};

async function fetchContentArray(path: string): Promise<unknown[]> {
  const response = await fetch(path, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status}: ${text}`);
  }

  const payload = (await response.json().catch(() => [])) as unknown;
  return Array.isArray(payload) ? payload : [];
}

async function putContentArray(path: string, payload: unknown[]): Promise<void> {
  const response = await fetch(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status}: ${text}`);
  }
}

export function useBonusCodesContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.bonusCodes,
    queryFn: async (): Promise<BonusCodesPageConfig> =>
      deserializeBonusCodesDocument(await fetchContentArray('/api/content/bonus-codes')),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useHeroBannersContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.heroBanners,
    queryFn: async (): Promise<HeroBannersContentDocument> =>
      deserializeHeroBannersDocument(await fetchContentArray('/api/content/hero-banners')),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useSideAdsContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.sideAds,
    queryFn: async (): Promise<SideAdsConfig> =>
      deserializeSideAdsDocument(await fetchContentArray('/api/content/side-ads')),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });
}

export function usePopularLeaguesContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.popularLeagues,
    queryFn: async (): Promise<PopularLeaguePreset[]> =>
      deserializePopularLeaguesDocument(await fetchContentArray('/api/content/popular-leagues')),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData ?? DEFAULT_POPULAR_LEAGUES_PRESET,
  });
}

export function useAdminBonusCodesContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.adminBonusCodes,
    queryFn: async (): Promise<BonusCodesPageConfig> => {
      const localFallback =
        typeof window !== 'undefined' ? readBonusCodesPageConfig() : DEFAULT_BONUS_CODES_PAGE_CONFIG;
      return deserializeBonusCodesDocument(await fetchContentArray('/api/admin/content/bonus-codes'), localFallback);
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminHeroBannersContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.adminHeroBanners,
    queryFn: async (): Promise<HeroBannersContentDocument> => {
      const localFallback: HeroBannersContentDocument =
        typeof window !== 'undefined'
          ? {
              banners: readHeroBannersConfig(),
              layout: readHeroBannerLayoutConfig(),
            }
          : {
              banners: DEFAULT_HERO_BANNERS,
              layout: DEFAULT_HERO_BANNER_LAYOUT,
            };

      return deserializeHeroBannersDocument(await fetchContentArray('/api/admin/content/hero-banners'), localFallback);
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminSideAdsContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.adminSideAds,
    queryFn: async (): Promise<SideAdsConfig> => {
      const localFallback = typeof window !== 'undefined' ? readSideAdsConfig() : EMPTY_SIDE_ADS_CONFIG;
      return deserializeSideAdsDocument(await fetchContentArray('/api/admin/content/side-ads'), localFallback);
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminPopularLeaguesContent() {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.adminPopularLeagues,
    queryFn: async (): Promise<PopularLeaguePreset[]> => {
      const localFallback =
        typeof window !== 'undefined'
          ? readPopularLeaguePresets(ADMIN_POPULAR_LEAGUES_STORAGE_KEY, DEFAULT_POPULAR_LEAGUES_PRESET)
          : DEFAULT_POPULAR_LEAGUES_PRESET;

      return deserializePopularLeaguesDocument(
        await fetchContentArray('/api/admin/content/popular-leagues'),
        localFallback,
      );
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });
}

export async function saveAdminBonusCodesContent(config: BonusCodesPageConfig) {
  await putContentArray('/api/admin/content/bonus-codes', serializeBonusCodesDocument(config));
}

export async function saveAdminHeroBannersContent(content: HeroBannersContentDocument) {
  await putContentArray('/api/admin/content/hero-banners', serializeHeroBannersDocument(content));
}

export async function saveAdminSideAdsContent(config: SideAdsConfig) {
  await putContentArray('/api/admin/content/side-ads', serializeSideAdsDocument(config));
}

export async function saveAdminPopularLeaguesContent(items: PopularLeaguePreset[]) {
  await putContentArray('/api/admin/content/popular-leagues', serializePopularLeaguesDocument(items));
}

export function getPublicContentBackendPath(documentId: ContentDocumentId): string {
  return `/api/content/${documentId}`;
}

export function getAdminContentBackendPath(documentId: ContentDocumentId): string {
  return `/api/admin/content/${documentId}`;
}
