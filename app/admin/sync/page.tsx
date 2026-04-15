'use client';

import { Suspense, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BonusCodeCardEditor } from '@/components/admin/BonusCodeCardEditor';
import { HeroBannerSlotEditor } from '@/components/admin/HeroBannerSlotEditor';
import { SideAdSlotEditor } from '@/components/admin/SideAdSlotEditor';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  BONUS_CODES_STORAGE_KEY,
  createEmptyBonusCodeEntry,
  DEFAULT_BONUS_CODES_PAGE_CONFIG,
  readBonusCodesPageConfig,
  type BonusCodeEntry,
  type BonusCodesPageConfig,
  writeBonusCodesPageConfig,
} from '@/lib/bonus-codes';
import { useLiveViewersConfig } from '@/lib/hooks/useLiveViewersConfig';
import {
  DEFAULT_HERO_BANNER_FOCUS_PERCENT,
  DEFAULT_HERO_BANNER_HEIGHT_PX,
  DEFAULT_HERO_BANNER_IMAGE_ZOOM,
  DEFAULT_HERO_BANNER_LAYOUT,
  DEFAULT_HERO_BANNERS,
  HERO_BANNER_THEMES,
  MAX_HERO_BANNER_HEIGHT_PX,
  MIN_HERO_BANNER_HEIGHT_PX,
  normalizeHeroBannerFocusPercent,
  normalizeHeroBannerHeight,
  normalizeHeroBannerImageOpacity,
  normalizeHeroBannerImageZoom,
  readHeroBannerLayoutConfig,
  readHeroBannersConfig,
  type HeroBannerConfig,
  type HeroBannerLayoutConfig,
  type HeroBannerThemeId,
  writeHeroBannerLayoutConfig,
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
import type { FixtureDto } from '@/lib/types/api';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
const ADMIN_SECTION_IDS = ['quick', 'league', 'heartbeat', 'popular', 'bonus', 'hero', 'ads', 'result', 'snapshot', 'status'] as const;
const FIXTURE_SCOPE_OPTIONS = [
  { value: 'Live', label: 'Live only' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Finished', label: 'Finished' },
  { value: 'All', label: 'All fixtures' },
] as const;

type AdminSectionId = (typeof ADMIN_SECTION_IDS)[number];
type FixturePickerScope = (typeof FIXTURE_SCOPE_OPTIONS)[number]['value'];

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

function formatFixtureKickoffLabel(ts: string): string {
  const date = new Date(ts);

  if (Number.isNaN(date.getTime())) {
    return ts;
  }

  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatFixtureOptionLabel(fixture: FixtureDto): string {
  const liveBadge = fixture.stateBucket === 'Live' ? ` • ${fixture.elapsed != null ? `${fixture.elapsed}'` : fixture.status}` : '';
  return `${fixture.homeTeamName} vs ${fixture.awayTeamName} • ${formatFixtureKickoffLabel(fixture.kickoffAt)}${liveBadge}`;
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

function MetricCard({
  label,
  value,
  color,
  background,
  borderColor,
  labelColor,
}: {
  label: string;
  value: string;
  color: string;
  background?: string;
  borderColor?: string;
  labelColor?: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-3"
      style={{
        background: background ?? 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor ?? 'var(--t-border)'}`,
      }}
    >
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor ?? 'var(--t-text-6)' }}>
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
  const [theOddsFixtureId, setTheOddsFixtureId] = useState('');
  const [fixtureScope, setFixtureScope] = useState<FixturePickerScope>('Live');
  const [fixtureOptions, setFixtureOptions] = useState<FixtureDto[]>([]);
  const [fixtureOptionsLoading, setFixtureOptionsLoading] = useState(false);
  const [fixtureOptionsError, setFixtureOptionsError] = useState<string | null>(null);
  const [popularLeagueId, setPopularLeagueId] = useState('');
  const [popularStorageHydrated, setPopularStorageHydrated] = useState(false);
  const [adminPopularLeaguePresets, setAdminPopularLeaguePresets] = useState<PopularLeaguePreset[]>(DEFAULT_POPULAR_LEAGUES_PRESET);
  const [bonusCodesHydrated, setBonusCodesHydrated] = useState(false);
  const [bonusCodesConfig, setBonusCodesConfig] = useState<BonusCodesPageConfig>(DEFAULT_BONUS_CODES_PAGE_CONFIG);
  const [heroBannersHydrated, setHeroBannersHydrated] = useState(false);
  const [heroBannerLayoutHydrated, setHeroBannerLayoutHydrated] = useState(false);
  const [heroBanners, setHeroBanners] = useState<HeroBannerConfig[]>(DEFAULT_HERO_BANNERS);
  const [heroBannerLayout, setHeroBannerLayout] = useState<HeroBannerLayoutConfig>(DEFAULT_HERO_BANNER_LAYOUT);
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
    heartbeat: true,
    popular: false,
    bonus: false,
    hero: false,
    ads: false,
    result: false,
    snapshot: false,
    status: true,
  });

  const { data: status, isLoading: statusLoading, refetch } = useSyncStatus(season, false);
  const {
    data: liveViewersConfig,
    isLoading: liveViewersConfigLoading,
    refetch: refetchLiveViewersConfig,
  } = useLiveViewersConfig(true);
  const liveViewersConfigUnavailable = liveViewersConfig?.configAvailable === false;
  const liveHeartbeatEnabled = liveViewersConfig?.effectiveViewerDrivenRefreshEnabled === true;
  const adminHeartbeatDesiredEnabled =
    liveViewersConfig?.liveOddsHeartbeatEnabled ??
    liveViewersConfig?.viewerDrivenRefreshEnabled ??
    liveViewersConfig?.adminViewerDrivenRefreshEnabled ??
    liveHeartbeatEnabled;

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

  async function runHeartbeatToggle(nextEnabled: boolean) {
    setLoading('heartbeat-toggle');
    setResult(null);

    try {
      const res = await fetch('/api/admin/odds/live/the-odds/viewer-refresh', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liveOddsHeartbeatEnabled: nextEnabled,
        }),
      });
      const json = await res.json().catch(() => ({}));

      setResult({
        action: 'heartbeat-toggle',
        ok: res.ok,
        message: res.ok
          ? JSON.stringify(json, null, 2)
          : `Error ${res.status}: ${json.error ?? 'Unknown error'}`,
      });

      if (res.ok) {
        await refetchLiveViewersConfig();
        refetch();
      }
    } catch (error) {
      setResult({ action: 'heartbeat-toggle', ok: false, message: String(error) });
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

  const bonusCodeEntries = bonusCodesConfig.entries;
  const activeBonusCodesCount = bonusCodeEntries.filter((entry) => entry.isActive).length;
  const featuredBonusCodesCount = bonusCodeEntries.filter((entry) => entry.isActive && entry.isFeatured).length;
  const selectedPopularLeague = popularLeagueOptions.find((league) => league.key === popularLeagueId) ?? null;
  const singleLeagueSelected = Boolean(syncLeagueId && syncLeagueId !== ALL_LEAGUES_VALUE);
  const fixtureTargetId = theOddsFixtureId.trim();
  const fixtureSelectValue = fixtureOptions.some((fixture) => String(fixture.apiFixtureId) === fixtureTargetId) ? fixtureTargetId : '';
  const hasLeague = selectedLeagueIds.length > 0;
  const hasLeagueAndSeason = Boolean(selectedLeagueIds.length > 0 && syncSeason);
  const hasFixtureTargetId = Boolean(fixtureTargetId);

  useEffect(() => {
    if (!singleLeagueSelected || !syncSeason) {
      setFixtureOptions([]);
      setFixtureOptionsLoading(false);
      setFixtureOptionsError(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set('leagueId', syncLeagueId);
    params.set('season', syncSeason);
    params.set('page', '1');
    params.set('pageSize', '100');
    params.set('direction', fixtureScope === 'Finished' || fixtureScope === 'All' ? 'desc' : 'asc');

    if (fixtureScope !== 'All') {
      params.set('state', fixtureScope);
    }

    setFixtureOptionsLoading(true);
    setFixtureOptionsError(null);

    void fetch(`/api/fixtures/query?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(typeof json?.error === 'string' ? json.error : `Failed to fetch fixtures (${res.status})`);
        }

        return json;
      })
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }

        setFixtureOptions(Array.isArray(payload?.items) ? (payload.items as FixtureDto[]) : []);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setFixtureOptions([]);
        setFixtureOptionsError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFixtureOptionsLoading(false);
        }
      });

    return () => controller.abort();
  }, [fixtureScope, singleLeagueSelected, syncLeagueId, syncSeason]);

  const selectedFixture = useMemo(
    () => fixtureOptions.find((fixture) => String(fixture.apiFixtureId) === fixtureTargetId) ?? null,
    [fixtureOptions, fixtureTargetId],
  );

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

  const fixtureActionButtons: ActionBtn[] = [
    {
      id: 'fixture-corners',
      label: 'Sync Fixture Corners',
      runningLabel: 'Syncing...',
      description:
        'Refreshes only the selected fixture corners snapshot through fixture statistics. It stays scoped to one match and does not loop whole leagues.',
      requestPreview: [`POST /api/fixtures/${fixtureTargetId || '{apiFixtureId}'}/sync-corners${forceSync ? '?force=true' : ''}`],
      accent: true,
      onClick: () =>
        runAction(
          'fixture-corners',
          `/api/fixtures/${encodeURIComponent(fixtureTargetId)}/sync-corners${forceSync ? '?force=true' : ''}`,
        ),
      disabled: !hasFixtureTargetId,
      disabledReason: 'Choose a match or enter an API fixture id',
    },
  ];

  const theOddsFixtureRefreshButton: ActionBtn = {
    id: 'the-odds-refresh-fixture',
    label: 'The Odds API: Refresh One Fixture',
    runningLabel: 'Refreshing The Odds...',
    description:
      'Runs the manual The Odds API refresh for one live fixture. Use this when you want live odds from the new provider for a single match, not the API-Football importer.',
    requestPreview: [
      `POST /api/admin/odds/live/the-odds/refresh-fixture?apiFixtureId=${fixtureTargetId || '{apiFixtureId}'}${forceSync ? '&force=true' : ''}`,
    ],
    accent: true,
    onClick: () =>
      runAction(
        'the-odds-refresh-fixture',
        `/api/admin/odds/live/the-odds/refresh-fixture?apiFixtureId=${encodeURIComponent(fixtureTargetId)}${forceSync ? '&force=true' : ''}`,
      ),
    disabled: !hasFixtureTargetId,
    disabledReason: 'Choose a match or enter an API fixture id',
  };

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
      label: 'Sync Live Odds (API-Football)',
      runningLabel: 'Syncing...',
      description:
        'Imports currently available live odds from API-Football for the selected league. This is the older live odds flow, not the new The Odds API manual refresh.',
      requestPreview: [`POST /api/odds/live/sync?leagueId=${leagueTargetPreview}`],
      accent: true,
      onClick: () => runLeagueAction('live-odds', (leagueId) => `/api/odds/live/sync?leagueId=${leagueId}`),
      disabled: !hasLeague,
      disabledReason: 'Select a league group',
    },
  ];

  const theOddsRefreshButtons: ActionBtn[] = [
    {
      id: 'the-odds-refresh-league',
      label: 'The Odds API: Refresh League',
      runningLabel: 'Refreshing The Odds...',
      description:
        'Runs the manual The Odds API refresh for the selected league-season. Use this when you want live odds from the new provider across the chosen league.',
      requestPreview: [
        `POST /api/admin/odds/live/the-odds/refresh-league?leagueId=${leagueTargetPreview}&season=${syncSeason}${forceSync ? '&force=true' : ''}`,
      ],
      onClick: () =>
        runLeagueAction(
          'the-odds-refresh-league',
          (leagueId) =>
            `/api/admin/odds/live/the-odds/refresh-league?leagueId=${leagueId}&season=${syncSeason}${forceSync ? '&force=true' : ''}`,
        ),
      disabled: !hasLeagueAndSeason,
      disabledReason: 'Select a league group and season',
    },
  ];

  const quickSummary = includeOdds
    ? 'Core bootstrap with pre-match odds enabled plus targeted fixture tools below.'
    : 'Core bootstrap without pre-match odds plus targeted fixture tools below.';

  const leagueSummary =
    syncLeagueId === ALL_LEAGUES_VALUE
      ? `Bulk mode over ${selectedLeagueIds.length} tracked leagues.`
      : `Targeting ${leagueNameById.get(syncLeagueId) ?? 'one league'}${syncSeason ? ` for ${syncSeason}.` : '.'}`;
  const fixtureScopeLabel = FIXTURE_SCOPE_OPTIONS.find((option) => option.value === fixtureScope)?.label ?? fixtureScope;
  const fixtureTargetSummary = !singleLeagueSelected
    ? 'Choose one league first. Fixture-only actions never run in bulk mode.'
    : fixtureOptionsLoading
      ? `Loading ${fixtureScopeLabel.toLowerCase()} fixtures for the selected league-season.`
      : fixtureOptionsError
        ? `Could not load fixture options: ${fixtureOptionsError}`
        : selectedFixture
          ? `Targeting ${selectedFixture.homeTeamName} vs ${selectedFixture.awayTeamName} on ${formatFixtureKickoffLabel(selectedFixture.kickoffAt)}.`
          : fixtureOptions.length > 0
            ? `Loaded ${fixtureOptions.length} ${fixtureScopeLabel.toLowerCase()} fixture option${fixtureOptions.length === 1 ? '' : 's'}. Pick one match or keep typing an API fixture id manually.`
            : `No ${fixtureScopeLabel.toLowerCase()} fixtures found for the selected league-season yet.`;

  const popularSummary = `${adminPopularLeaguePresets.length} predefined leagues for new visitors in this browser profile.`;
  const bonusSummary = activeBonusCodesCount
    ? `${activeBonusCodesCount} active bonus code card${activeBonusCodesCount === 1 ? '' : 's'} with ${featuredBonusCodesCount} featured pick${featuredBonusCodesCount === 1 ? '' : 's'}.`
    : 'No active bonus code cards yet.';
  const heroSummary = `${heroBanners.filter((banner) => banner.isClickable && banner.href).length}/3 hero ads clickable • ${heroBannerLayout.heightPx}px tall.`;
  const configuredSideAdsCount = [sideAdsConfig.left, sideAdsConfig.right].filter(Boolean).length;
  const adsSummary = configuredSideAdsCount
    ? `${configuredSideAdsCount} side banner slot${configuredSideAdsCount === 1 ? '' : 's'} ready.`
    : 'No side banners configured yet.';
  const heartbeatSummary = liveViewersConfigLoading
    ? 'Checking the global live viewers heartbeat policy from the backend.'
    : liveViewersConfigUnavailable
      ? 'The global heartbeat status could not be loaded from the backend right now.'
    : adminHeartbeatDesiredEnabled
      ? liveHeartbeatEnabled
        ? 'Heartbeat is globally enabled and live pages can keep sending viewer keepalive pings.'
        : 'Heartbeat is globally armed, but another runtime guard is still keeping the effective refresh path disabled.'
      : 'Heartbeat is globally disabled and live pages will stop sending viewer keepalive pings.';
  const heartbeatStatusCards = [
    {
      label: 'Effective refresh',
      value: liveViewersConfigLoading ? 'Checking' : liveViewersConfigUnavailable ? 'Unknown' : liveHeartbeatEnabled ? 'Enabled' : 'Disabled',
      color: liveViewersConfigLoading ? '#fbbf24' : liveViewersConfigUnavailable ? '#fca5a5' : liveHeartbeatEnabled ? '#00e676' : '#f59e0b',
      background:
        liveViewersConfigLoading
          ? 'rgba(245,158,11,0.12)'
          : liveViewersConfigUnavailable
            ? 'rgba(239,68,68,0.12)'
            : liveHeartbeatEnabled
              ? 'rgba(0,230,118,0.12)'
              : 'rgba(245,158,11,0.12)',
      borderColor:
        liveViewersConfigLoading
          ? 'rgba(245,158,11,0.34)'
          : liveViewersConfigUnavailable
            ? 'rgba(239,68,68,0.3)'
            : liveHeartbeatEnabled
              ? 'rgba(0,230,118,0.28)'
              : 'rgba(245,158,11,0.3)',
      labelColor:
        liveHeartbeatEnabled && !liveViewersConfigUnavailable ? 'rgba(167,243,208,0.82)' : 'rgba(255,237,213,0.82)',
    },
    {
      label: 'Config toggle',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : adminHeartbeatDesiredEnabled == null
            ? 'Unknown'
            : adminHeartbeatDesiredEnabled
              ? 'Enabled'
              : 'Disabled',
      color:
        adminHeartbeatDesiredEnabled == null
          ? '#94a3b8'
          : adminHeartbeatDesiredEnabled
            ? '#00e676'
            : '#f59e0b',
      background:
        adminHeartbeatDesiredEnabled == null
          ? 'rgba(148,163,184,0.08)'
          : adminHeartbeatDesiredEnabled
            ? 'rgba(0,230,118,0.1)'
            : 'rgba(245,158,11,0.1)',
      borderColor:
        adminHeartbeatDesiredEnabled == null
          ? 'rgba(148,163,184,0.18)'
          : adminHeartbeatDesiredEnabled
            ? 'rgba(0,230,118,0.24)'
            : 'rgba(245,158,11,0.24)',
    },
    {
      label: 'Live heartbeat',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.liveOddsHeartbeatEnabled == null
            ? 'Unknown'
            : liveViewersConfig.liveOddsHeartbeatEnabled
              ? 'Enabled'
              : 'Disabled',
      color:
        liveViewersConfig?.liveOddsHeartbeatEnabled == null
          ? '#94a3b8'
          : liveViewersConfig.liveOddsHeartbeatEnabled
            ? '#00e676'
            : '#f59e0b',
      background:
        liveViewersConfig?.liveOddsHeartbeatEnabled == null
          ? 'rgba(148,163,184,0.08)'
          : liveViewersConfig.liveOddsHeartbeatEnabled
            ? 'rgba(0,230,118,0.1)'
            : 'rgba(245,158,11,0.1)',
      borderColor:
        liveViewersConfig?.liveOddsHeartbeatEnabled == null
          ? 'rgba(148,163,184,0.18)'
          : liveViewersConfig.liveOddsHeartbeatEnabled
            ? 'rgba(0,230,118,0.24)'
            : 'rgba(245,158,11,0.24)',
    },
    {
      label: 'The Odds provider',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.theOddsProviderEnabled == null
            ? 'Unknown'
            : liveViewersConfig.theOddsProviderEnabled
              ? 'Enabled'
              : 'Disabled',
      color:
        liveViewersConfig?.theOddsProviderEnabled == null
          ? '#94a3b8'
          : liveViewersConfig.theOddsProviderEnabled
            ? '#00e676'
            : '#f59e0b',
      background:
        liveViewersConfig?.theOddsProviderEnabled == null
          ? 'rgba(148,163,184,0.08)'
          : liveViewersConfig.theOddsProviderEnabled
            ? 'rgba(0,230,118,0.1)'
            : 'rgba(245,158,11,0.1)',
      borderColor:
        liveViewersConfig?.theOddsProviderEnabled == null
          ? 'rgba(148,163,184,0.18)'
          : liveViewersConfig.theOddsProviderEnabled
            ? 'rgba(0,230,118,0.24)'
            : 'rgba(245,158,11,0.24)',
    },
    {
      label: 'Provider configured',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.theOddsProviderConfigured == null
            ? 'Unknown'
            : liveViewersConfig.theOddsProviderConfigured
              ? 'Ready'
              : 'Missing',
      color:
        liveViewersConfig?.theOddsProviderConfigured == null
          ? '#94a3b8'
          : liveViewersConfig.theOddsProviderConfigured
            ? '#00e676'
            : '#fca5a5',
      background:
        liveViewersConfig?.theOddsProviderConfigured == null
          ? 'rgba(148,163,184,0.08)'
          : liveViewersConfig.theOddsProviderConfigured
            ? 'rgba(0,230,118,0.12)'
            : 'rgba(239,68,68,0.16)',
      borderColor:
        liveViewersConfig?.theOddsProviderConfigured == null
          ? 'rgba(148,163,184,0.18)'
          : liveViewersConfig.theOddsProviderConfigured
            ? 'rgba(0,230,118,0.24)'
            : 'rgba(239,68,68,0.34)',
      labelColor:
        liveViewersConfig?.theOddsProviderConfigured === false
          ? 'rgba(254,202,202,0.92)'
          : undefined,
    },
    {
      label: 'Read catch-up',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.readDrivenCatchUpEnabled == null
            ? 'Unknown'
            : liveViewersConfig.readDrivenCatchUpEnabled
              ? 'Enabled'
              : 'Disabled',
      color:
        liveViewersConfig?.readDrivenCatchUpEnabled == null
          ? '#94a3b8'
          : liveViewersConfig.readDrivenCatchUpEnabled
            ? '#7dd3fc'
            : '#f59e0b',
      background:
        liveViewersConfig?.readDrivenCatchUpEnabled == null
          ? 'rgba(148,163,184,0.08)'
          : liveViewersConfig.readDrivenCatchUpEnabled
            ? 'rgba(14,165,233,0.14)'
            : 'rgba(245,158,11,0.1)',
      borderColor:
        liveViewersConfig?.readDrivenCatchUpEnabled == null
          ? 'rgba(148,163,184,0.18)'
          : liveViewersConfig.readDrivenCatchUpEnabled
            ? 'rgba(56,189,248,0.3)'
            : 'rgba(245,158,11,0.24)',
      labelColor:
        liveViewersConfig?.readDrivenCatchUpEnabled === true
          ? 'rgba(186,230,253,0.9)'
          : undefined,
    },
    {
      label: 'Heartbeat TTL',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.viewerHeartbeatTtlSeconds == null
            ? 'Unknown'
          : `${liveViewersConfig.viewerHeartbeatTtlSeconds}s`,
      color: '#60a5fa',
      background: 'rgba(59,130,246,0.1)',
      borderColor: 'rgba(96,165,250,0.24)',
      labelColor: 'rgba(191,219,254,0.82)',
    },
    {
      label: 'Refresh interval',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.viewerRefreshIntervalSeconds == null
            ? 'Unknown'
          : `${liveViewersConfig.viewerRefreshIntervalSeconds}s`,
      color: '#a78bfa',
      background: 'rgba(139,92,246,0.1)',
      borderColor: 'rgba(167,139,250,0.24)',
      labelColor: 'rgba(221,214,254,0.82)',
    },
    {
      label: 'Updated at',
      value:
        liveViewersConfigLoading
          ? 'Checking'
          : liveViewersConfig?.updatedAtUtc
            ? fmtTs(liveViewersConfig.updatedAtUtc)
            : 'Not persisted',
      color: '#f9a8d4',
      background: 'rgba(236,72,153,0.08)',
      borderColor: 'rgba(249,168,212,0.22)',
      labelColor: 'rgba(251,207,232,0.82)',
    },
  ];
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
    setBonusCodesConfig(readBonusCodesPageConfig());
    setBonusCodesHydrated(true);
    setHeroBanners(readHeroBannersConfig());
    setHeroBannersHydrated(true);
    setHeroBannerLayout(readHeroBannerLayoutConfig());
    setHeroBannerLayoutHydrated(true);
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
    if (!bonusCodesHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeBonusCodesPageConfig(bonusCodesConfig);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bonusCodesConfig, bonusCodesHydrated]);

  useEffect(() => {
    if (!bonusCodesHydrated) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BONUS_CODES_STORAGE_KEY) {
        setBonusCodesConfig(readBonusCodesPageConfig());
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [bonusCodesHydrated]);

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
    if (!heroBannerLayoutHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeHeroBannerLayoutConfig(heroBannerLayout);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [heroBannerLayout, heroBannerLayoutHydrated]);

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

  function updateBonusCodesCopy(updates: Partial<BonusCodesPageConfig['copy']>) {
    setBonusCodesConfig((current) => ({
      ...current,
      copy: {
        ...current.copy,
        ...updates,
      },
    }));
  }

  function updateBonusCodeEntry(id: string, updates: Partial<BonusCodeEntry>) {
    setBonusCodesConfig((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...updates,
              updatedAtUtc: new Date().toISOString(),
            }
          : entry,
      ),
    }));
  }

  function addBonusCodeEntry() {
    const nextEntry = createEmptyBonusCodeEntry();
    setBonusCodesConfig((current) => ({
      ...current,
      entries: [...current.entries, nextEntry],
    }));
    setResult({
      action: 'bonus-code-add',
      ok: true,
      message: `Added a new bonus code card draft for ${nextEntry.bookmaker}.`,
    });
  }

  function duplicateBonusCodeEntry(id: string) {
    setBonusCodesConfig((current) => {
      const index = current.entries.findIndex((entry) => entry.id === id);

      if (index === -1) {
        return current;
      }

      const source = current.entries[index];
      const duplicate = {
        ...source,
        ...createEmptyBonusCodeEntry(),
        bookmaker: `${source.bookmaker} copy`,
        badge: source.badge,
        offer: source.offer,
        code: source.code,
        description: source.description,
        terms: source.terms,
        ctaLabel: source.ctaLabel,
        href: source.href,
        isActive: source.isActive,
        isFeatured: false,
        toneId: source.toneId,
        updatedAtUtc: new Date().toISOString(),
      };

      const nextEntries = [...current.entries];
      nextEntries.splice(index + 1, 0, duplicate);

      return {
        ...current,
        entries: nextEntries,
      };
    });

    setResult({
      action: 'bonus-code-duplicate',
      ok: true,
      message: 'Bonus code card duplicated. Review the copied code and bookmaker title before publishing it live.',
    });
  }

  function moveBonusCodeEntry(id: string, direction: 'up' | 'down') {
    setBonusCodesConfig((current) => {
      const index = current.entries.findIndex((entry) => entry.id === id);

      if (index === -1) {
        return current;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= current.entries.length) {
        return current;
      }

      const nextEntries = [...current.entries];
      const [entry] = nextEntries.splice(index, 1);
      nextEntries.splice(targetIndex, 0, {
        ...entry,
        updatedAtUtc: new Date().toISOString(),
      });

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  function removeBonusCodeEntry(id: string) {
    setBonusCodesConfig((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id),
    }));
    setResult({
      action: 'bonus-code-remove',
      ok: true,
      message: 'The selected bonus code card was removed.',
    });
  }

  function resetBonusCodesConfig() {
    setBonusCodesConfig(DEFAULT_BONUS_CODES_PAGE_CONFIG);
    setResult({
      action: 'bonus-codes-reset',
      ok: true,
      message: 'Bonus codes page content was reset to the default preset.',
    });
  }

  function updateHeroBanner(id: HeroBannerConfig['id'], updates: Partial<HeroBannerConfig>) {
    setHeroBanners((current) =>
      current.map((banner) =>
        banner.id === id
          ? (() => {
              const nextThemeId = (updates.themeId ?? banner.themeId ?? 'graphite') as HeroBannerThemeId;
              const nextTheme = HERO_BANNER_THEMES[nextThemeId];

              return {
                ...banner,
                ...updates,
                backgroundFrom:
                  'themeId' in updates
                    ? nextTheme.backgroundFrom
                    : 'backgroundFrom' in updates
                      ? updates.backgroundFrom
                      : banner.backgroundFrom,
                backgroundTo:
                  'themeId' in updates
                    ? nextTheme.backgroundTo
                    : 'backgroundTo' in updates
                      ? updates.backgroundTo
                      : banner.backgroundTo,
                borderColor:
                  'themeId' in updates
                    ? nextTheme.borderColor
                    : 'borderColor' in updates
                      ? updates.borderColor
                      : banner.borderColor,
                eyebrowColor:
                  'themeId' in updates
                    ? nextTheme.eyebrowColor
                    : 'eyebrowColor' in updates
                      ? updates.eyebrowColor
                      : banner.eyebrowColor,
                titleColor:
                  'themeId' in updates
                    ? nextTheme.titleColor
                    : 'titleColor' in updates
                      ? updates.titleColor
                      : banner.titleColor,
                offerColor:
                  'themeId' in updates
                    ? nextTheme.offerColor
                    : 'offerColor' in updates
                      ? updates.offerColor
                      : banner.offerColor,
                ctaBackground:
                  'themeId' in updates
                    ? nextTheme.buttonBackground
                    : 'ctaBackground' in updates
                      ? updates.ctaBackground
                      : banner.ctaBackground,
                ctaColor:
                  'themeId' in updates
                    ? nextTheme.buttonColor
                    : 'ctaColor' in updates
                      ? updates.ctaColor
                      : banner.ctaColor,
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
              };
            })()
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

  function resetHeroBannerLayout() {
    setHeroBannerLayout(DEFAULT_HERO_BANNER_LAYOUT);
    setResult({
      action: 'hero-banner-layout-reset',
      ok: true,
      message: 'Hero banner height was reset to the default size.',
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
      case 'heartbeat':
        return { title: 'Heartbeat kill switch', description: heartbeatSummary };
      case 'popular':
        return { title: 'Popular leagues', description: popularSummary };
      case 'bonus':
        return { title: 'Bonus codes', description: bonusSummary };
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
          badge={`${quickActionButtons.length + fixtureActionButtons.length} actions`}
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

            <div
              className="rounded-lg p-3"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--t-border)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold" style={{ color: 'var(--t-text-2)' }}>
                    Targeted Fixture Tools
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Choose one league, then one match. These fixture-only tools stay scoped to a single match and avoid syncing every match across every league.
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    background: 'rgba(0,230,118,0.08)',
                    border: '1px solid rgba(0,230,118,0.18)',
                    color: 'var(--t-accent)',
                  }}
                >
                  one match only
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    League
                  </label>
                  <select
                    value={syncLeagueId}
                    onChange={(e) => setSyncLeagueId(e.target.value)}
                    className="input-shell min-w-0 w-full px-3 py-1.5 text-[12px]"
                  >
                    <option value={ALL_LEAGUES_VALUE}>Choose one league</option>
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
                    className="input-shell w-full px-3 py-1.5 text-[12px]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Match list
                  </label>
                  <select
                    value={fixtureScope}
                    onChange={(e) => setFixtureScope(e.target.value as FixturePickerScope)}
                    className="input-shell w-full px-3 py-1.5 text-[12px]"
                  >
                    {FIXTURE_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-2">
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Match
                  </label>
                  <select
                    value={fixtureSelectValue}
                    onChange={(e) => setTheOddsFixtureId(e.target.value)}
                    disabled={!singleLeagueSelected || fixtureOptionsLoading || fixtureOptions.length === 0}
                    className="input-shell w-full px-3 py-1.5 text-[12px] disabled:opacity-50"
                  >
                    <option value="">
                      {!singleLeagueSelected
                        ? 'Choose one league first'
                        : fixtureOptionsLoading
                          ? 'Loading matches...'
                          : fixtureOptions.length === 0
                            ? 'No matches found for this filter'
                            : 'Choose a match'}
                    </option>
                    {fixtureOptions.map((fixture) => (
                      <option key={fixture.apiFixtureId} value={String(fixture.apiFixtureId)}>
                        {formatFixtureOptionLabel(fixture)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Fixture API id
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={theOddsFixtureId}
                    onChange={(e) => setTheOddsFixtureId(e.target.value)}
                    placeholder="1379288"
                    className="input-shell w-40 px-3 py-1.5 text-[12px]"
                  />
                </div>
              </div>

              <div
                className="mt-3 rounded-md px-3 py-2 text-[11px]"
                style={{
                  background: fixtureOptionsError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  border: fixtureOptionsError ? '1px solid rgba(239,68,68,0.22)' : '1px solid var(--t-border)',
                  color: fixtureOptionsError ? '#fecaca' : 'var(--t-text-4)',
                }}
              >
                {fixtureTargetSummary}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {fixtureActionButtons.map((btn) => (
                  <ActionCard key={btn.id} btn={btn} loading={loading} />
                ))}
              </div>
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

        {activeSection === 'heartbeat' ? (
        <AccordionSection
          title="Heartbeat Kill Switch"
          summary={heartbeatSummary}
          badge={liveViewersConfigLoading ? 'checking' : liveViewersConfigUnavailable ? 'unknown' : adminHeartbeatDesiredEnabled ? 'armed' : 'disarmed'}
          isOpen={openSections.heartbeat}
          onToggle={() => toggleSection('heartbeat')}
        >
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: liveHeartbeatEnabled
                  ? 'linear-gradient(135deg, rgba(127,29,29,0.84), rgba(59,7,7,0.96))'
                  : 'linear-gradient(135deg, rgba(120,53,15,0.92), rgba(67,20,7,0.96))',
                border: liveHeartbeatEnabled
                  ? '1px solid rgba(248,113,113,0.45)'
                  : '1px solid rgba(251,191,36,0.36)',
                boxShadow: liveHeartbeatEnabled
                  ? '0 18px 44px rgba(127,29,29,0.28)'
                  : '0 18px 44px rgba(120,53,15,0.22)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[10px] font-black uppercase tracking-[0.26em]"
                    style={{ color: adminHeartbeatDesiredEnabled ? '#fecaca' : '#fde68a' }}
                  >
                    Global backend control
                  </div>
                  <div className="mt-2 text-[18px] font-black uppercase tracking-[0.18em]" style={{ color: '#fff7ed' }}>
                    {liveViewersConfigLoading
                      ? 'Checking heartbeat state'
                      : liveViewersConfigUnavailable
                        ? 'Heartbeat state unavailable'
                        : adminHeartbeatDesiredEnabled
                          ? 'Heartbeat armed'
                          : 'Heartbeat disarmed'}
                  </div>
                  <p className="mt-2 max-w-2xl text-[12px] leading-5" style={{ color: 'rgba(255,245,245,0.88)' }}>
                    Heartbeat sends the visible live fixture ids to the backend every 25 seconds. This is the viewer keepalive
                    signal that tells the live odds system which matches are actively being watched.
                  </p>
                  <p className="mt-2 max-w-2xl text-[11px]" style={{ color: adminHeartbeatDesiredEnabled ? '#fecaca' : '#fde68a' }}>
                    Turning it off does not remove normal read access. It only stops every client from pushing automatic viewer
                    priority updates for live odds refresh until the global switch is enabled again.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{
                      background: adminHeartbeatDesiredEnabled ? 'rgba(254,202,202,0.12)' : 'rgba(253,230,138,0.12)',
                      border: adminHeartbeatDesiredEnabled
                        ? '1px solid rgba(248,113,113,0.38)'
                        : '1px solid rgba(251,191,36,0.34)',
                      color: adminHeartbeatDesiredEnabled ? '#fecaca' : '#fde68a',
                    }}
                  >
                    {liveViewersConfigLoading ? 'Checking' : liveViewersConfigUnavailable ? 'Unknown' : adminHeartbeatDesiredEnabled ? 'Enabled' : 'Disabled'}
                  </span>

                  <button
                    type="button"
                    onClick={() => void runHeartbeatToggle(!adminHeartbeatDesiredEnabled)}
                    disabled={Boolean(loading) || liveViewersConfigLoading}
                    className="rounded-xl px-5 py-3 text-[12px] font-black uppercase tracking-[0.22em] transition-transform hover:-translate-y-[1px]"
                    style={{
                      minWidth: '260px',
                      background: adminHeartbeatDesiredEnabled
                        ? 'linear-gradient(135deg, #ef4444, #7f1d1d)'
                        : 'linear-gradient(135deg, #f97316, #7c2d12)',
                      border: adminHeartbeatDesiredEnabled
                        ? '1px solid rgba(252,165,165,0.62)'
                        : '1px solid rgba(253,186,116,0.62)',
                      boxShadow: adminHeartbeatDesiredEnabled
                        ? '0 16px 36px rgba(127,29,29,0.42)'
                        : '0 16px 36px rgba(124,45,18,0.42)',
                      color: '#fff7ed',
                      opacity: loading === 'heartbeat-toggle' || liveViewersConfigLoading ? 0.72 : 1,
                    }}
                  >
                    {loading === 'heartbeat-toggle'
                      ? 'Updating switch'
                      : adminHeartbeatDesiredEnabled
                        ? 'Disable heartbeat'
                        : 'Re-arm heartbeat'}
                  </button>
                </div>
              </div>
            </div>

            <InfoStrip>
              Use this kill switch only for testing or debugging. With heartbeat disabled, the frontend still reads cached live odds,
              but it stops telling the backend which live fixtures are being actively viewed across the whole site.
            </InfoStrip>

            <InfoStrip>
              Manual admin refresh actions still work while heartbeat is disabled. This switch only controls the automatic browser
              keepalive signal.
            </InfoStrip>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--t-border)',
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold" style={{ color: 'var(--t-text-2)' }}>
                    The Odds API Manual Controls
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    All manual The Odds API testing actions live here. Use one fixture for a single live match test, or
                    refresh a whole league-season when you need broader coverage checks.
                  </div>
                </div>
                <label
                  className="flex cursor-pointer select-none items-center gap-2 text-[12px]"
                  style={{ color: 'var(--t-text-3)' }}
                >
                  <input
                    type="checkbox"
                    checked={forceSync}
                    onChange={(e) => setForceSync(e.target.checked)}
                    className="accent-green-400"
                  />
                  Force refresh
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    League
                  </label>
                  <select
                    value={syncLeagueId}
                    onChange={(e) => setSyncLeagueId(e.target.value)}
                    className="input-shell min-w-0 w-full px-3 py-1.5 text-[12px]"
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
                    className="input-shell w-full px-3 py-1.5 text-[12px]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Match list
                  </label>
                  <select
                    value={fixtureScope}
                    onChange={(e) => setFixtureScope(e.target.value as FixturePickerScope)}
                    className="input-shell w-full px-3 py-1.5 text-[12px]"
                  >
                    {FIXTURE_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="xl:col-span-2">
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Match
                  </label>
                  <select
                    value={fixtureSelectValue}
                    onChange={(e) => setTheOddsFixtureId(e.target.value)}
                    disabled={!singleLeagueSelected || fixtureOptionsLoading || fixtureOptions.length === 0}
                    className="input-shell w-full px-3 py-1.5 text-[12px] disabled:opacity-50"
                  >
                    <option value="">
                      {!singleLeagueSelected
                        ? 'Choose one league first'
                        : fixtureOptionsLoading
                          ? 'Loading matches...'
                          : fixtureOptions.length === 0
                            ? 'No matches found for this filter'
                            : 'Choose a match'}
                    </option>
                    {fixtureOptions.map((fixture) => (
                      <option key={fixture.apiFixtureId} value={String(fixture.apiFixtureId)}>
                        {formatFixtureOptionLabel(fixture)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    Fixture API id
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={theOddsFixtureId}
                    onChange={(e) => setTheOddsFixtureId(e.target.value)}
                    placeholder="1379288"
                    className="input-shell w-40 px-3 py-1.5 text-[12px]"
                  />
                </div>
              </div>

              <div
                className="mt-3 rounded-md px-3 py-2 text-[11px]"
                style={{
                  background: fixtureOptionsError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  border: fixtureOptionsError ? '1px solid rgba(239,68,68,0.22)' : '1px solid var(--t-border)',
                  color: fixtureOptionsError ? '#fecaca' : 'var(--t-text-4)',
                }}
              >
                {fixtureTargetSummary}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ActionCard btn={theOddsFixtureRefreshButton} loading={loading} />
                {theOddsRefreshButtons.map((btn) => (
                  <ActionCard key={btn.id} btn={btn} loading={loading} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {heartbeatStatusCards.map((card) => (
                <MetricCard key={card.label} label={card.label} value={card.value} color={card.color} />
              ))}
            </div>

            {liveViewersConfigUnavailable && liveViewersConfig?.error ? (
              <InfoStrip>
                Backend config endpoint error:
                {' '}
                <span className="font-mono">{liveViewersConfig.error}</span>
              </InfoStrip>
            ) : null}
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

        {activeSection === 'bonus' ? (
        <AccordionSection
          title="Bonus Codes"
          summary={bonusSummary}
          badge={`${activeBonusCodesCount} active`}
          isOpen={openSections.bonus}
          onToggle={() => toggleSection('bonus')}
        >
          <div className="space-y-3">
            <InfoStrip>
              Manage the content for the new <span className="font-semibold">Bonus codes</span> header tab. This follows the same frontend content model as hero banners and side ads, so changes are stored in this browser profile and reflected on <span className="font-mono">/bonus-codes</span>.
            </InfoStrip>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Active cards" value={String(activeBonusCodesCount)} color="#00e676" />
              <MetricCard label="Featured cards" value={String(featuredBonusCodesCount)} color="#fbbf24" />
              <MetricCard
                label="Total cards"
                value={String(bonusCodeEntries.length)}
                color="#93c5fd"
                background="rgba(59,130,246,0.08)"
                borderColor="rgba(96,165,250,0.24)"
                labelColor="rgba(191,219,254,0.82)"
              />
              <MetricCard
                label="Page route"
                value="/bonus-codes"
                color="#f9a8d4"
                background="rgba(236,72,153,0.08)"
                borderColor="rgba(249,168,212,0.22)"
                labelColor="rgba(251,207,232,0.82)"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Eyebrow
                </div>
                <input
                  value={bonusCodesConfig.copy.eyebrow}
                  onChange={(event) => updateBonusCodesCopy({ eyebrow: event.target.value })}
                  className="input-shell w-full px-3 py-1.5 text-[12px]"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Featured label
                </div>
                <input
                  value={bonusCodesConfig.copy.featuredLabel}
                  onChange={(event) => updateBonusCodesCopy({ featuredLabel: event.target.value })}
                  className="input-shell w-full px-3 py-1.5 text-[12px]"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Page title
                </div>
                <input
                  value={bonusCodesConfig.copy.title}
                  onChange={(event) => updateBonusCodesCopy({ title: event.target.value })}
                  className="input-shell w-full px-3 py-1.5 text-[12px]"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  Subtitle
                </div>
                <textarea
                  value={bonusCodesConfig.copy.subtitle}
                  onChange={(event) => updateBonusCodesCopy({ subtitle: event.target.value })}
                  className="input-shell min-h-[88px] w-full px-3 py-2 text-[12px]"
                />
              </label>

              <label className="block md:col-span-2">
                <div className="mb-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                  All cards label
                </div>
                <input
                  value={bonusCodesConfig.copy.allLabel}
                  onChange={(event) => updateBonusCodesCopy({ allLabel: event.target.value })}
                  className="input-shell w-full px-3 py-1.5 text-[12px]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addBonusCodeEntry}
                className="cta-btn rounded px-3 py-1.5 text-[12px] font-bold"
              >
                Add bonus code
              </button>
              <button
                type="button"
                onClick={resetBonusCodesConfig}
                className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all"
              >
                Restore default page
              </button>
            </div>

            <div className="grid gap-3">
              {bonusCodeEntries.map((entry, index) => (
                <BonusCodeCardEditor
                  key={entry.id}
                  entry={entry}
                  index={index}
                  total={bonusCodeEntries.length}
                  onChange={updateBonusCodeEntry}
                  onMove={moveBonusCodeEntry}
                  onDuplicate={duplicateBonusCodeEntry}
                  onRemove={removeBonusCodeEntry}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={addBonusCodeEntry}
                className="cta-btn rounded px-4 py-2 text-[12px] font-bold"
              >
                Add another bonus code
              </button>
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

            <div
              className="rounded-lg px-3 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--t-border)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
                    Hero strip height
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                    One shared controller for all 3 hero ad tiles. Lower values shrink the strip and the page immediately consumes the freed space.
                  </div>
                </div>
                <div className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'rgba(0,230,118,0.08)', color: 'var(--t-accent)', border: '1px solid rgba(0,230,118,0.16)' }}>
                  {heroBannerLayout.heightPx}px
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="range"
                  min={String(MIN_HERO_BANNER_HEIGHT_PX)}
                  max={String(MAX_HERO_BANNER_HEIGHT_PX)}
                  step="2"
                  value={heroBannerLayout.heightPx}
                  onChange={(event) =>
                    setHeroBannerLayout({
                      heightPx: normalizeHeroBannerHeight(
                        Number(event.target.value),
                        DEFAULT_HERO_BANNER_HEIGHT_PX,
                      ),
                    })
                  }
                  className="min-w-[220px] flex-1 accent-green-400"
                />

                <button
                  type="button"
                  onClick={resetHeroBannerLayout}
                  className="chrome-btn rounded px-3 py-1.5 text-[12px] font-bold transition-all"
                >
                  Reset Height
                </button>
              </div>
            </div>

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
                    heightPx={heroBannerLayout.heightPx}
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
