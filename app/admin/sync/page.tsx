'use client';

import { Suspense, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeroBannerSlotEditor } from '@/components/admin/HeroBannerSlotEditor';
import { SideAdSlotEditor } from '@/components/admin/SideAdSlotEditor';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  DEFAULT_HERO_BANNER_IMAGE_ZOOM,
  DEFAULT_HERO_BANNERS,
  normalizeHeroBannerFocusPercent,
  normalizeHeroBannerImageOpacity,
  normalizeHeroBannerImageZoom,
  readHeroBannersConfig,
  type HeroBannerConfig,
  writeHeroBannersConfig,
} from '@/lib/hero-banners';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import {
  ADMIN_POPULAR_LEAGUES_STORAGE_KEY,
  DEFAULT_POPULAR_LEAGUES_PRESET,
  USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY,
  getPopularLeagueKey,
  readPopularLeaguePresets,
  type PopularLeaguePreset,
  writePopularLeagueKeys,
  writePopularLeaguePresets,
} from '@/lib/popular-leagues';
import {
  DEFAULT_SIDE_AD_FOCUS_PERCENT,
  DEFAULT_SIDE_AD_ZOOM,
  EMPTY_SIDE_ADS_CONFIG,
  normalizeSideAdFocusPercent,
  normalizeSideAdZoom,
  readSideAdsConfig,
  type SideAdSlotConfig,
  type SideAdSlotId,
  type SideAdsConfig,
  writeSideAdsConfig,
} from '@/lib/side-ads';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
const ADMIN_SECTION_IDS = ['quick', 'league', 'popular', 'hero', 'ads', 'result', 'snapshot', 'status'] as const;

type AdminSectionId = (typeof ADMIN_SECTION_IDS)[number];

function freshnessColor(ts: string | null): string {
  if (!ts) return '#ef5350';
  const age = Date.now() - new Date(ts).getTime();
  if (age < 60 * 60 * 1000) return '#00e676';
  if (age < 6 * 60 * 60 * 1000) return '#f59e0b';
  return '#ef5350';
}

function fmtTs(ts: string | null): string {
  if (!ts) return '-';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

type ActionBtn = {
  id: string;
  label: string;
  runningLabel: string;
  description: string;
  requestPreview: string[];
  accent?: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

function ActionButton({ btn, loading }: { btn: ActionBtn; loading: string | null }) {
  const isRunning = loading === btn.id;
  const isDisabled = Boolean(loading) || btn.disabled;

  return (
    <button
      type="button"
      title={isDisabled && btn.disabledReason && !loading ? btn.disabledReason : undefined}
      onClick={btn.onClick}
      disabled={isDisabled}
      className={`${btn.accent ? 'cta-btn' : 'chrome-btn'} rounded px-3 py-1.5 text-[12px] font-bold transition-all disabled:opacity-40`}
      style={btn.accent ? {} : { color: 'var(--t-text-2)' }}
    >
      {isRunning ? btn.runningLabel : btn.label}
    </button>
  );
}

function ActionCard({ btn, loading }: { btn: ActionBtn; loading: string | null }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--t-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold" style={{ color: 'var(--t-text-2)' }}>
            {btn.label}
          </div>
          <div className="mt-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            {btn.description}
          </div>
        </div>
        <ActionButton btn={btn} loading={loading} />
      </div>

      <div className="mt-3 space-y-1">
        {btn.requestPreview.map((requestLine) => (
          <div
            key={requestLine}
            className="rounded px-2 py-1 font-mono text-[10px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text-4)',
            }}
          >
            {requestLine}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoStrip({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-md px-3 py-2 text-[11px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--t-border)',
        color: 'var(--t-text-4)',
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--t-border)' }}>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
        {label}
      </div>
      <div className="text-[13px] font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Image upload failed.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Selected image could not be processed.'));
    image.src = source;
  });
}

async function optimizeSideBannerImage(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file);

  if (file.type === 'image/svg+xml') {
    return source;
  }

  const image = await loadImage(source);
  const maxWidth = 1200;
  const maxHeight = 3600;
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return source;
  }

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/webp', 0.985);
}

async function optimizeHeroBannerImage(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file);

  if (file.type === 'image/svg+xml') {
    return source;
  }

  const image = await loadImage(source);
  const maxWidth = 2200;
  const maxHeight = 1200;
  const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return source;
  }

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/webp', 0.98);
}

type AccordionSectionProps = {
  title: string;
  summary?: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function AccordionSection({ title, summary, badge, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <section className="panel-shell overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: isOpen ? 'rgba(255,255,255,0.025)' : 'transparent' }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-3)' }}>
              {title}
            </h2>
            {badge ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--t-text-5)' }}
              >
                {badge}
              </span>
            ) : null}
          </div>
          {summary ? (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
              {summary}
            </p>
          ) : null}
        </div>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] font-semibold"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--t-border)',
            color: 'var(--t-text-3)',
          }}
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen ? (
        <div className="border-t p-4" style={{ borderColor: 'var(--t-border)' }}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function AdminSyncPageContent() {
  const ALL_LEAGUES_VALUE = '__all__';
  const searchParams = useSearchParams();
  const [season, setSeason] = useState(DEFAULT_SEASON);
  const [syncLeagueId, setSyncLeagueId] = useState(ALL_LEAGUES_VALUE);
  const [syncSeason, setSyncSeason] = useState(String(DEFAULT_SEASON));
  const [popularLeagueId, setPopularLeagueId] = useState('');
  const [popularStorageHydrated, setPopularStorageHydrated] = useState(false);
  const [adminPopularLeaguePresets, setAdminPopularLeaguePresets] = useState<PopularLeaguePreset[]>(DEFAULT_POPULAR_LEAGUES_PRESET);
  const [heroBannersHydrated, setHeroBannersHydrated] = useState(false);
  const [heroBanners, setHeroBanners] = useState<HeroBannerConfig[]>(DEFAULT_HERO_BANNERS);
  const [sideAdsHydrated, setSideAdsHydrated] = useState(false);
  const [sideAdsConfig, setSideAdsConfig] = useState<SideAdsConfig>(EMPTY_SIDE_ADS_CONFIG);
  const [includeOdds, setIncludeOdds] = useState(false);
  const [forceSync, setForceSync] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [uploadingHeroBannerId, setUploadingHeroBannerId] = useState<HeroBannerConfig['id'] | null>(null);
  const [uploadingSideAdSlot, setUploadingSideAdSlot] = useState<SideAdSlotId | null>(null);
  const [result, setResult] = useState<{ action: string; ok: boolean; message: string } | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quick: true,
    league: true,
    popular: false,
    hero: false,
    ads: false,
    result: false,
    snapshot: false,
    status: true,
  });

  const { data: status, isLoading: statusLoading, refetch } = useSyncStatus(season, false);

  async function runAction(action: string, url: string) {
    setLoading(action);
    setResult(null);

    try {
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      setResult({
        action,
        ok: res.ok,
        message: res.ok
          ? JSON.stringify(json, null, 2)
          : `Error ${res.status}: ${json.error ?? 'Unknown error'}`,
      });
      if (res.ok) {
        refetch();
      }
    } catch (e) {
      setResult({ action, ok: false, message: String(e) });
    } finally {
      setLoading(null);
    }
  }

  async function runSequence(action: string, steps: Array<{ label: string; url: string }>) {
    setLoading(action);
    setResult(null);

    const messages: string[] = [];

    try {
      for (const step of steps) {
        const res = await fetch(step.url, { method: 'POST' });
        const json = await res.json().catch(() => ({}));
        messages.push(`${step.label}: ${res.ok ? 'OK' : `ERR ${res.status}`}`);
        messages.push(JSON.stringify(json, null, 2));

        if (!res.ok) {
          setResult({
            action,
            ok: false,
            message: messages.join('\n\n'),
          });
          return;
        }
      }

      setResult({
        action,
        ok: true,
        message: messages.join('\n\n'),
      });
      refetch();
    } catch (e) {
      setResult({ action, ok: false, message: `${messages.join('\n\n')}\n\n${String(e)}`.trim() });
    } finally {
      setLoading(null);
    }
  }

  const syncLeagues = Array.isArray(status?.leagues) ? status.leagues : [];
  const globalStates = Array.isArray(status?.global) ? status.global : [];
  const countriesState = globalStates.find((g) => g.entityType === 'countries');
  const leaguesState = globalStates.find((g) => g.entityType === 'leagues');
  const liveBetTypesState = globalStates.find((g) => g.entityType === 'live_bet_types');

  const leagueNameById = useMemo(
    () => new Map(syncLeagues.map((league) => [String(league.leagueApiId), `${league.countryName} - ${league.leagueName}`])),
    [syncLeagues],
  );

  const selectedLeagueIds =
    syncLeagueId === ALL_LEAGUES_VALUE
      ? Array.from(new Set(syncLeagues.map((league) => String(league.leagueApiId))))
      : syncLeagueId
        ? [syncLeagueId]
        : [];

  const adminPopularLeagueKeys = useMemo(
    () => new Set(adminPopularLeaguePresets.map((item) => getPopularLeagueKey(item.leagueId, item.season))),
    [adminPopularLeaguePresets],
  );

  const popularLeagueMetaByKey = useMemo(
    () =>
      new Map(
        syncLeagues.map((league) => [
          getPopularLeagueKey(league.leagueApiId, league.season),
          {
            countryName: league.countryName,
            season: league.season,
          },
        ]),
      ),
    [syncLeagues],
  );

  const popularLeagueOptions = useMemo(
    () =>
      syncLeagues
        .filter((league) => !adminPopularLeagueKeys.has(getPopularLeagueKey(league.leagueApiId, league.season)))
        .map((league) => ({
          key: `${league.leagueApiId}:${league.season}`,
          leagueApiId: league.leagueApiId,
          leagueName: league.leagueName,
          countryName: league.countryName,
          season: league.season,
        })),
    [adminPopularLeagueKeys, syncLeagues],
  );

  const selectedPopularLeague = popularLeagueOptions.find((league) => league.key === popularLeagueId) ?? null;
  const hasLeague = selectedLeagueIds.length > 0;
  const hasLeagueAndSeason = Boolean(selectedLeagueIds.length > 0 && syncSeason);

  const availableStatusSeasons = useMemo(
    () =>
      Array.from(new Set([DEFAULT_SEASON, season, ...syncLeagues.map((league) => league.season)]))
        .sort((a, b) => b - a),
    [season, syncLeagues],
  );

  const quickActionButtons: ActionBtn[] = [
    {
      id: 'core-data',
      label: 'Sync Core Data',
      runningLabel: 'Running...',
      description:
        'Runs the main preload bootstrap for core football data. It covers catalogs, teams, fixtures, and optionally pre-match odds.',
      requestPreview: [`POST ${buildCoreDataUrl()}`],
      accent: true,
      onClick: () => runAction('core-data', buildCoreDataUrl()),
    },
    {
      id: 'startup-pack',
      label: 'Startup Pack',
      runningLabel: 'Running...',
      description:
        'Runs the core bootstrap first and then refreshes the live bet type catalog, so the system is ready for both pre-match and live odds flows.',
      requestPreview: [`POST ${buildCoreDataUrl()}`, 'POST /api/odds/live-bets/sync'],
      onClick: () =>
        runSequence('startup-pack', [
          { label: 'Core data', url: buildCoreDataUrl() },
          { label: 'Live bet types', url: '/api/odds/live-bets/sync' },
        ]),
    },
    {
      id: 'live-bets',
      label: 'Sync Live Bet Types',
      runningLabel: 'Syncing...',
      description:
        'Refreshes the live odds bet id reference list used by the live odds importer and widgets.',
      requestPreview: ['POST /api/odds/live-bets/sync'],
      onClick: () => runAction('live-bets', '/api/odds/live-bets/sync'),
    },
  ];

  const leagueTargetPreview = syncLeagueId === ALL_LEAGUES_VALUE ? '{leagueId}' : syncLeagueId;
  const perLeagueButtons: ActionBtn[] = [
    {
      id: 'upcoming',
      label: 'Sync Upcoming Fixtures',
      runningLabel: 'Syncing...',
      description:
        'Pulls only upcoming fixtures for the selected league-season. In bulk mode it runs once per tracked league.',
      requestPreview: [`POST /api/fixtures/sync-upcoming?leagueId=${leagueTargetPreview}&season=${syncSeason}`],
      onClick: () => runLeagueAction('upcoming', (leagueId) => `/api/fixtures/sync-upcoming?leagueId=${leagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league group and season',
    },
    {
      id: 'fixtures-full',
      label: 'Sync Full Fixtures',
      runningLabel: 'Syncing...',
      description:
        'Runs the full fixture sync for the selected league-season. In bulk mode it loops through each tracked league sequentially.',
      requestPreview: [`POST /api/fixtures/sync?leagueId=${leagueTargetPreview}&season=${syncSeason}`],
      onClick: () => runLeagueAction('fixtures-full', (leagueId) => `/api/fixtures/sync?leagueId=${leagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league group and season',
    },
    {
      id: 'odds',
      label: 'Sync Pre-match Odds',
      runningLabel: 'Syncing...',
      description:
        'Imports the latest pre-match Match Winner odds for the selected league-season. In bulk mode it runs once per tracked league.',
      requestPreview: [`POST /api/odds/sync?leagueId=${leagueTargetPreview}&season=${syncSeason}`],
      onClick: () => runLeagueAction('odds', (leagueId) => `/api/odds/sync?leagueId=${leagueId}&season=${syncSeason}`),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league group and season',
    },
    {
      id: 'live-odds',
      label: 'Sync Live Odds',
      runningLabel: 'Syncing...',
      description:
        'Imports currently available live odds for the selected league. In bulk mode it runs per tracked league without a season parameter.',
      requestPreview: [`POST /api/odds/live/sync?leagueId=${leagueTargetPreview}`],
      accent: true,
      onClick: () => runLeagueAction('live-odds', (leagueId) => `/api/odds/live/sync?leagueId=${leagueId}`),
      disabled: !hasLeague,
      disabledReason: 'Select a league group',
    },
  ];

  const quickSummary = includeOdds
    ? 'Core bootstrap with pre-match odds enabled.'
    : 'Core bootstrap without pre-match odds.';

  const leagueSummary =
    syncLeagueId === ALL_LEAGUES_VALUE
      ? `Bulk mode over ${selectedLeagueIds.length} tracked leagues.`
      : `Targeting ${leagueNameById.get(syncLeagueId) ?? 'one league'}${syncSeason ? ` for ${syncSeason}.` : '.'}`;

  const popularSummary = `${adminPopularLeaguePresets.length} predefined leagues for new visitors in this browser profile.`;
  const heroSummary = `${heroBanners.filter((banner) => banner.isClickable && banner.href).length}/3 hero ads clickable.`;
  const configuredSideAdsCount = [sideAdsConfig.left, sideAdsConfig.right].filter(Boolean).length;
  const adsSummary = configuredSideAdsCount
    ? `${configuredSideAdsCount} side banner slot${configuredSideAdsCount === 1 ? '' : 's'} ready.`
    : 'No side banners configured yet.';
  const snapshotSummary = status ? `Latest snapshot ${fmtTs(status.generatedAtUtc)}.` : 'No sync snapshot loaded yet.';
  const statusSummary = `${syncLeagues.length} league-season rows for ${season}.`;
  const rawSection = searchParams.get('section');
  const activeSection = ADMIN_SECTION_IDS.includes(rawSection as AdminSectionId)
    ? (rawSection as AdminSectionId)
    : null;

  useEffect(() => {
    setAdminPopularLeaguePresets(
      readPopularLeaguePresets(ADMIN_POPULAR_LEAGUES_STORAGE_KEY, DEFAULT_POPULAR_LEAGUES_PRESET),
    );
    setPopularStorageHydrated(true);
    setHeroBanners(readHeroBannersConfig());
    setHeroBannersHydrated(true);
    setSideAdsConfig(readSideAdsConfig());
    setSideAdsHydrated(true);
  }, []);

  useEffect(() => {
    if (!popularStorageHydrated) {
      return;
    }

    writePopularLeaguePresets(ADMIN_POPULAR_LEAGUES_STORAGE_KEY, adminPopularLeaguePresets);
  }, [adminPopularLeaguePresets, popularStorageHydrated]);

  useEffect(() => {
    if (!heroBannersHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeHeroBannersConfig(heroBanners);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [heroBanners, heroBannersHydrated]);

  useEffect(() => {
    if (!sideAdsHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeSideAdsConfig(sideAdsConfig);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sideAdsConfig, sideAdsHydrated]);

  useEffect(() => {
    if (!popularLeagueOptions.length) {
      setPopularLeagueId('');
      return;
    }

    setPopularLeagueId((current) =>
      popularLeagueOptions.some((league) => league.key === current) ? current : popularLeagueOptions[0].key,
    );
  }, [popularLeagueOptions]);

  useEffect(() => {
    if (!result) {
      return;
    }

    setOpenSections((current) => (current.result ? current : { ...current, result: true }));
  }, [result]);

  useEffect(() => {
    if (!activeSection) {
      return;
    }

    setOpenSections((current) =>
      current[activeSection]
        ? current
        : {
            ...current,
            [activeSection]: true,
          },
    );
  }, [activeSection]);

  function toggleSection(sectionId: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function addAdminPopularLeague() {
    if (!selectedPopularLeague) {
      return;
    }

    const candidate: PopularLeaguePreset = {
      leagueId: selectedPopularLeague.leagueApiId,
      displayName: selectedPopularLeague.leagueName,
      season: selectedPopularLeague.season,
    };
    const candidateKey = getPopularLeagueKey(candidate.leagueId, candidate.season);

    setAdminPopularLeaguePresets((current) =>
      current.some((item) => getPopularLeagueKey(item.leagueId, item.season) === candidateKey)
        ? current
        : [...current, candidate],
    );
  }

  function removeAdminPopularLeague(item: PopularLeaguePreset) {
    const candidateKey = getPopularLeagueKey(item.leagueId, item.season);
    setAdminPopularLeaguePresets((current) =>
      current.filter((entry) => getPopularLeagueKey(entry.leagueId, entry.season) !== candidateKey),
    );
  }

  function restoreAdminPopularLeagues() {
    writePopularLeagueKeys(USER_HIDDEN_POPULAR_LEAGUES_STORAGE_KEY, []);
    setResult({
      action: 'popular-refresh',
      ok: true,
      message: 'Admin popular leagues were restored for this browser profile. Hidden user overrides were cleared.',
    });
  }

  function updateHeroBanner(id: HeroBannerConfig['id'], updates: Partial<HeroBannerConfig>) {
    setHeroBanners((current) =>
      current.map((banner) =>
        banner.id === id
          ? {
              ...banner,
              ...updates,
              backgroundImageOpacity:
                'backgroundImageOpacity' in updates
                  ? normalizeHeroBannerImageOpacity(updates.backgroundImageOpacity, banner.backgroundImageOpacity ?? 0.42)
                  : banner.backgroundImageOpacity,
              imageFocusXPercent:
                'imageFocusXPercent' in updates
                  ? normalizeHeroBannerFocusPercent(
                      updates.imageFocusXPercent,
                      banner.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                    )
                  : banner.imageFocusXPercent,
              imageFocusYPercent:
                'imageFocusYPercent' in updates
                  ? normalizeHeroBannerFocusPercent(
                      updates.imageFocusYPercent,
                      banner.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                    )
                  : banner.imageFocusYPercent,
              imageZoom:
                'imageZoom' in updates
                  ? normalizeHeroBannerImageZoom(
                      updates.imageZoom,
                      banner.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM,
                    )
                  : banner.imageZoom,
              updatedAtUtc: new Date().toISOString(),
            }
          : banner,
      ),
    );
  }

  function resetHeroBanners() {
    setHeroBanners(DEFAULT_HERO_BANNERS);
    setResult({
      action: 'hero-banners-reset',
      ok: true,
      message: 'Hero banner slots were reset to the default preset.',
    });
  }

  async function handleHeroBannerFileChange(id: HeroBannerConfig['id'], file: File) {
    setUploadingHeroBannerId(id);

    try {
      const backgroundImageSrc = await optimizeHeroBannerImage(file);
      const prettyId = id.replace('slot-', 'Hero slot ');

      setHeroBanners((current) =>
        current.map((banner) =>
          banner.id === id
            ? {
                ...banner,
                backgroundImageSrc,
                backgroundImageOpacity: banner.backgroundImageOpacity ?? 0.42,
                imageFocusXPercent: banner.imageFocusXPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                imageFocusYPercent: banner.imageFocusYPercent ?? DEFAULT_HERO_BANNER_FOCUS_PERCENT,
                imageZoom: banner.imageZoom ?? DEFAULT_HERO_BANNER_IMAGE_ZOOM,
                updatedAtUtc: new Date().toISOString(),
              }
            : banner,
        ),
      );

      setResult({
        action: `${id}-hero-image`,
        ok: true,
        message: `${prettyId} background image uploaded successfully.`,
      });
    } catch (error) {
      setResult({
        action: `${id}-hero-image`,
        ok: false,
        message: String(error),
      });
    } finally {
      setUploadingHeroBannerId(null);
    }
  }

  function clearHeroBannerImage(id: HeroBannerConfig['id']) {
    setHeroBanners((current) =>
      current.map((banner) =>
        banner.id === id
          ? {
              ...banner,
              backgroundImageSrc: '',
              imageFocusXPercent: DEFAULT_HERO_BANNER_FOCUS_PERCENT,
              imageFocusYPercent: DEFAULT_HERO_BANNER_FOCUS_PERCENT,
              imageZoom: DEFAULT_HERO_BANNER_IMAGE_ZOOM,
              updatedAtUtc: new Date().toISOString(),
            }
          : banner,
      ),
    );

    setResult({
      action: `${id}-hero-image`,
      ok: true,
      message: `${id.replace('slot-', 'Hero slot ')} background image was cleared.`,
    });
  }

  async function handleSideAdFileChange(slotId: SideAdSlotId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingSideAdSlot(slotId);

    try {
      const imageSrc = await optimizeSideBannerImage(file);
      const defaultAlt = file.name.replace(/\.[^.]+$/, '').trim() || `${slotId} side banner`;

      setSideAdsConfig((current) => ({
        ...current,
        [slotId]: {
          ...(current[slotId] ?? {}),
          imageSrc,
          alt: current[slotId]?.alt || defaultAlt,
          focusXPercent: current[slotId]?.focusXPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT,
          focusYPercent: current[slotId]?.focusYPercent ?? DEFAULT_SIDE_AD_FOCUS_PERCENT,
          zoom: current[slotId]?.zoom ?? DEFAULT_SIDE_AD_ZOOM,
          updatedAtUtc: new Date().toISOString(),
        },
      }));

      setResult({
        action: `${slotId}-side-ad`,
        ok: true,
        message: `${slotId === 'left' ? 'Left' : 'Right'} side banner uploaded successfully.`,
      });
    } catch (error) {
      setResult({
        action: `${slotId}-side-ad`,
        ok: false,
        message: String(error),
      });
    } finally {
      setUploadingSideAdSlot(null);
    }
  }

  function updateSideAdSlot(slotId: SideAdSlotId, updates: Partial<SideAdSlotConfig>) {
    setSideAdsConfig((current) => {
      const existing = current[slotId];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [slotId]: {
          ...existing,
          ...updates,
          focusXPercent:
            'focusXPercent' in updates
              ? normalizeSideAdFocusPercent(updates.focusXPercent)
              : existing.focusXPercent,
          focusYPercent:
            'focusYPercent' in updates
              ? normalizeSideAdFocusPercent(updates.focusYPercent)
              : existing.focusYPercent,
          zoom: 'zoom' in updates ? normalizeSideAdZoom(updates.zoom) : existing.zoom,
          updatedAtUtc: new Date().toISOString(),
        },
      };
    });
  }

  function clearSideAdSlot(slotId: SideAdSlotId) {
    setSideAdsConfig((current) => ({
      ...current,
      [slotId]: null,
    }));

    setResult({
      action: `${slotId}-side-ad`,
      ok: true,
      message: `${slotId === 'left' ? 'Left' : 'Right'} side banner was cleared.`,
    });
  }

  function buildCoreDataUrl() {
    const params = new URLSearchParams();
    if (includeOdds) {
      params.set('includeOdds', 'true');
    }
    if (forceSync) {
      params.set('force', 'true');
    }
    const query = params.toString();
    return `/api/preload/run${query ? `?${query}` : ''}`;
  }

  function runLeagueAction(action: string, buildUrl: (leagueId: string) => string) {
    if (syncLeagueId === ALL_LEAGUES_VALUE) {
      return runSequence(
        action,
        selectedLeagueIds.map((leagueId) => ({
          label: `${action} - ${leagueNameById.get(leagueId) ?? leagueId}`,
          url: buildUrl(leagueId),
        })),
      );
    }

    if (!syncLeagueId) {
      return;
    }

    return runAction(action, buildUrl(syncLeagueId));
  }

  const sectionHeader = (() => {
    switch (activeSection) {
      case 'quick':
        return { title: 'Quick sync', description: quickSummary };
      case 'league':
        return { title: 'League actions', description: leagueSummary };
      case 'popular':
        return { title: 'Popular leagues', description: popularSummary };
      case 'hero':
        return { title: 'Hero banners', description: heroSummary };
      case 'ads':
        return { title: 'Side ads', description: adsSummary };
      case 'result':
        return {
          title: 'Last run',
          description: result
            ? `Latest action "${result.action}" ${result.ok ? 'completed successfully' : 'returned an error'}.`
            : 'No admin action has been executed yet in this session.',
        };
      case 'snapshot':
        return { title: 'Freshness snapshot', description: snapshotSummary };
      case 'status':
        return { title: 'League sync status', description: statusSummary };
      default:
        return null;
    }
  })();

  return (
    <div className="max-w-5xl p-5">
      <div className="mb-5">
        <h1 className="mb-0.5 text-[18px] font-bold" style={{ color: 'var(--t-text-1)' }}>
          {sectionHeader?.title ?? 'Admin control panel page'}
        </h1>
        <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
          {sectionHeader?.description ?? 'Choose a category from the left menu to open the admin tools for that area.'}
        </p>
      </div>

      {activeSection ? (
      <div className="space-y-3">
        {activeSection === 'quick' ? (
        <AccordionSection
          title="Quick Sync"
          summary={quickSummary}
          badge="3 actions"
          isOpen={openSections.quick}
          onToggle={() => toggleSection('quick')}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-5">
              <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
                <input
                  type="checkbox"
                  checked={includeOdds}
                  onChange={(e) => setIncludeOdds(e.target.checked)}
                  className="accent-green-400"
                />
                Include pre-match odds
              </label>
              <label className="flex cursor-pointer select-none items-center gap-2 text-[12px]" style={{ color: 'var(--t-text-3)' }}>
                <input
                  type="checkbox"
                  checked={forceSync}
                  onChange={(e) => setForceSync(e.target.checked)}
                  className="accent-green-400"
                />
                Force refresh
              </label>
            </div>

            <InfoStrip>
              Core sync covers countries, leagues, bookmaker catalog, teams, and fixtures. Live odds still run separately.
            </InfoStrip>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickActionButtons.map((btn) => (
                <ActionCard key={btn.id} btn={btn} loading={loading} />
              ))}
            </div>
          </div>
        </AccordionSection>
        ) : null}

        {activeSection === 'league' ? (
        <AccordionSection
          title="League Actions"
          summary={leagueSummary}
          badge={syncLeagueId === ALL_LEAGUES_VALUE ? `${selectedLeagueIds.length} tracked` : 'manual target'}
          isOpen={openSections.league}
          onToggle={() => toggleSection('league')}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  League
                </label>
                <select
                  value={syncLeagueId}
                  onChange={(e) => setSyncLeagueId(e.target.value)}
                  className="input-shell min-w-[240px] px-3 py-1.5 text-[12px]"
                >
                  <option value={ALL_LEAGUES_VALUE}>All tracked leagues ({selectedLeagueIds.length})</option>
                  {syncLeagues.map((league) => (
                    <option key={`${league.leagueApiId}-${league.season}`} value={String(league.leagueApiId)}>
                      {league.countryName} - {league.leagueName} ({league.season})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Season
                </label>
                <input
                  type="number"
                  value={syncSeason}
                  onChange={(e) => setSyncSeason(e.target.value)}
                  className="input-shell w-24 px-3 py-1.5 text-[12px]"
                />
              </div>
            </div>

              <InfoStrip>
              {syncLeagueId === ALL_LEAGUES_VALUE
                ? `Bulk mode will run sequentially across ${selectedLeagueIds.length} tracked leagues.`
                : `Only ${leagueNameById.get(syncLeagueId) ?? 'the selected league'} will be touched.`}
            </InfoStrip>

            <div className="grid gap-3 md:grid-cols-2">
              {perLeagueButtons.map((btn) => (
                <ActionCard key={btn.id} btn={btn} loading={loading} />
              ))}
            </div>
          </div>
        </AccordionSection>
        ) : null}

        {activeSection === 'popular' ? (
        <AccordionSection
          title="Popular Leagues"
          summary={popularSummary}
          badge={`${adminPopularLeaguePresets.length} leagues`}
          isOpen={openSections.popular}
          onToggle={() => toggleSection('popular')}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  League
                </label>
                <select
                  value={popularLeagueId}
                  onChange={(e) => setPopularLeagueId(e.target.value)}
                  className="input-shell min-w-[280px] px-3 py-1.5 text-[12px]"
                >
                  {popularLeagueOptions.length ? (
                    popularLeagueOptions.map((league) => (
                      <option key={league.key} value={league.key}>
                        {league.countryName} - {league.leagueName} ({league.season})
                      </option>
                    ))
                  ) : (
                    <option value="">No more leagues available for this season</option>
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={addAdminPopularLeague}
                disabled={!selectedPopularLeague}
                className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all disabled:opacity-40"
              >
                Add To Popular
              </button>

              <button
                type="button"
                onClick={restoreAdminPopularLeagues}
                className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all"
              >
                Restore All Admin Leagues
              </button>
            </div>

            <InfoStrip>
              Admin presets seed the default popular list. Users can still add or hide any league from the sidebar without changing this preset.
            </InfoStrip>

            <div className="grid gap-2">
              {adminPopularLeaguePresets.map((item) => {
                const itemKey = getPopularLeagueKey(item.leagueId, item.season);
                const meta = popularLeagueMetaByKey.get(itemKey);

                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-2 rounded-md px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--t-border)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
                        {item.displayName}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                        {meta?.countryName ?? 'Unknown country'} / Season {meta?.season ?? item.season ?? DEFAULT_SEASON}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdminPopularLeague(item)}
                      className="chrome-btn rounded px-2 py-1 text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </AccordionSection>
        ) : null}

        {activeSection === 'hero' ? (
        <AccordionSection
          title="Hero Banners"
          summary={heroSummary}
          badge="3 slots"
          isOpen={openSections.hero}
          onToggle={() => toggleSection('hero')}
        >
          <div className="space-y-3">
              <InfoStrip>
                Control the three promo cards at the top of the football board: text, theme, font family, font scale, alignment, color palette, CTA, destination URL, and whether each slot is clickable.
              </InfoStrip>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetHeroBanners}
                className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all"
              >
                Reset Hero Banners
              </button>
            </div>

              <div className="grid gap-3">
                {heroBanners.map((banner) => (
                  <HeroBannerSlotEditor
                    key={banner.id}
                    banner={banner}
                    onChange={updateHeroBanner}
                    onUploadImage={handleHeroBannerFileChange}
                    onClearImage={clearHeroBannerImage}
                    isUploadingImage={uploadingHeroBannerId === banner.id}
                  />
                ))}
              </div>
          </div>
        </AccordionSection>
        ) : null}

        {activeSection === 'ads' ? (
        <AccordionSection
          title="Side Ads"
          summary={adsSummary}
          badge={`${configuredSideAdsCount}/2 live`}
          isOpen={openSections.ads}
          onToggle={() => toggleSection('ads')}
        >
          <div className="space-y-3">
            <InfoStrip>
              Upload vertical banner images for the left and right shell gutters. These ads are currently stored in frontend local storage for this browser profile.
            </InfoStrip>

            <div className="grid gap-3 md:grid-cols-2">
              {(['left', 'right'] as const).map((slotId) => {
                return (
                  <SideAdSlotEditor
                    key={slotId}
                    slotId={slotId}
                    slot={sideAdsConfig[slotId]}
                    uploading={uploadingSideAdSlot === slotId}
                    onFileChange={(nextSlotId, event) => void handleSideAdFileChange(nextSlotId, event)}
                    onChange={updateSideAdSlot}
                    onClear={clearSideAdSlot}
                  />
                );
              })}
            </div>
          </div>
        </AccordionSection>
        ) : null}

        {activeSection === 'result' ? (
          <AccordionSection
            title="Last Run"
            summary={result ? (result.ok ? `Latest action "${result.action}" completed successfully.` : `Latest action "${result.action}" returned an error.`) : 'No admin action has been executed yet in this session.'}
            badge={result ? (result.ok ? 'OK' : 'ERR') : 'empty'}
            isOpen={openSections.result}
            onToggle={() => toggleSection('result')}
          >
            {result ? (
              <div
                className="rounded p-3 font-mono text-[12px]"
                style={{
                  background: result.ok ? 'rgba(0,230,118,0.06)' : 'rgba(239,83,80,0.06)',
                  border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(239,83,80,0.2)'}`,
                  color: result.ok ? '#00e676' : '#fca5a5',
                }}
              >
                <div className="mb-1 font-bold">
                  {result.ok ? 'OK' : 'ERR'} {result.action}
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px]">{result.message}</pre>
              </div>
            ) : (
              <InfoStrip>No action result yet. Run any admin action to populate this section.</InfoStrip>
            )}
          </AccordionSection>
        ) : null}

        {activeSection === 'snapshot' ? (
        <AccordionSection
          title="Freshness Snapshot"
          summary={snapshotSummary}
          badge={status ? 'live data' : 'empty'}
          isOpen={openSections.snapshot}
          onToggle={() => toggleSection('snapshot')}
        >
          {status ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: 'Countries', ts: countriesState?.lastSyncedAtUtc ?? null },
                { label: 'Leagues', ts: leaguesState?.lastSyncedAtUtc ?? null },
                { label: 'Live Bet Types', ts: liveBetTypesState?.lastSyncedAtUtc ?? null },
                { label: 'Status At', ts: status.generatedAtUtc },
              ].map(({ label, ts }) => (
                <MetricCard key={label} label={label} value={fmtTs(ts)} color={freshnessColor(ts)} />
              ))}
            </div>
          ) : (
            <InfoStrip>No status snapshot has been loaded yet for this season.</InfoStrip>
          )}
        </AccordionSection>
        ) : null}

        {activeSection === 'status' ? (
        <AccordionSection
          title="League Sync Status"
          summary={statusSummary}
          badge={`${syncLeagues.length} rows`}
          isOpen={openSections.status}
          onToggle={() => toggleSection('status')}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value))}
                  className="input-shell px-3 py-1.5 text-[12px]"
                >
                  {availableStatusSeasons.map((year) => (
                    <option key={year} value={year}>
                      {year}/{year + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button type="button" onClick={() => refetch()} className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold">
                Refresh
              </button>
            </div>

            {statusLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--t-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ background: 'var(--t-page-bg)', borderBottom: '1px solid var(--t-border)' }}>
                        {['League', 'Country', 'Teams', 'Fix Upcoming', 'Fix Full', 'Standings', 'Pre-match Odds', 'Bookmakers', 'Live Odds'].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--t-text-6)' }}
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {syncLeagues.map((league) => (
                        <tr key={`${league.leagueApiId}-${league.season}`} style={{ borderBottom: '1px solid var(--t-border)' }}>
                          <td className="px-3 py-2">
                            <span style={{ color: 'var(--t-text-2)' }}>{league.leagueName}</span>
                            {league.isActive ? (
                              <span
                                className="ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold"
                                style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676' }}
                              >
                                Active
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2" style={{ color: 'var(--t-text-4)' }}>
                            {league.countryName}
                          </td>
                          {[
                            league.teamsLastSyncedAtUtc,
                            league.fixturesUpcomingLastSyncedAtUtc,
                            league.fixturesFullLastSyncedAtUtc,
                            league.standingsLastSyncedAtUtc,
                            league.oddsLastSyncedAtUtc,
                            league.bookmakersLastSyncedAtUtc,
                            league.liveOddsLastSyncedAtUtc ?? null,
                          ].map((ts, index) => (
                            <td key={index} className="px-3 py-2 font-mono" style={{ color: freshnessColor(ts) }}>
                              {fmtTs(ts)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>
        ) : null}
      </div>
      ) : (
        <section
          className="panel-shell rounded-xl px-6 py-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--t-text-5)' }}>
              Admin
            </div>
            <h2 className="mt-2 text-[22px] font-black" style={{ color: 'var(--t-text-1)' }}>
              Control panel page
            </h2>
            <p className="mt-3 text-[13px]" style={{ color: 'var(--t-text-4)' }}>
              Select a category from the left menu to open sync actions, popular league presets, hero banners, side ads, freshness snapshots, or league status tools.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default function AdminSyncPage() {
  return (
    <Suspense fallback={<div className="p-5"><LoadingSpinner /></div>}>
      <AdminSyncPageContent />
    </Suspense>
  );
}
