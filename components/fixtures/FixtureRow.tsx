'use client';

import { useRouter } from 'next/navigation';
import type { BestOddsDto, FixtureDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  fixture: FixtureDto;
  bestOddsFallback?: BestOddsDto | null;
  oddsMovement?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
  isSaved?: boolean;
  onToggleSave?: (fixture: FixtureDto) => void;
}

function buildFixtureHref(apiFixtureId: number, tab?: 'odds') {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  const query = params.toString();
  return `/football/fixtures/${apiFixtureId}${query ? `?${query}` : ''}`;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function isTodayKickoff(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function formatLiveMinute(status: string, elapsed?: number | null, statusExtra?: number | null): string {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'HT') return 'HT';
  if (normalizedStatus === 'BT') return 'BT';
  if (normalizedStatus === 'P') return 'PEN';
  if (normalizedStatus === 'SUSP') return 'SUSP';
  if (normalizedStatus === 'INT') return 'INT';

  if (elapsed != null) {
    return statusExtra ? `${elapsed}+${statusExtra}'` : `${elapsed}'`;
  }

  return normalizedStatus;
}

function getLiveSourceMeta(source?: 'live' | 'prematch' | 'none' | null) {
  if (source === 'live') {
    return {
      label: 'Live prices',
      color: 'var(--t-accent)',
      background: 'rgba(0,230,118,0.14)',
      borderColor: 'rgba(0,230,118,0.28)',
    };
  }

  if (source === 'prematch') {
    return {
      label: 'Pre-match',
      color: '#fbbf24',
      background: 'rgba(245,158,11,0.14)',
      borderColor: 'rgba(245,158,11,0.28)',
    };
  }

  return {
    label: 'Waiting',
    color: 'var(--t-text-4)',
    background: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.2)',
  };
}

function renderTimeCell(
  iso: string,
  stateBucket: string,
  status: string,
  elapsed?: number | null,
  statusExtra?: number | null,
  liveSource?: 'live' | 'prematch' | 'none' | null,
  liveSaveControl?: React.ReactNode,
) {
  if (stateBucket === 'Live') {
    const liveLabel = formatLiveMinute(status, elapsed, statusExtra);
    const sourceMeta = getLiveSourceMeta(liveSource);
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span className="rounded px-1 py-0.5 text-[10px] font-black" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
            LIVE
          </span>
          {liveSaveControl}
        </div>
        <span className="max-w-[68px] text-center text-[10px] font-bold leading-tight" style={{ color: '#fca5a5' }}>
          {liveLabel}
        </span>
        <span
          className="rounded-full border px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{
            color: sourceMeta.color,
            background: sourceMeta.background,
            borderColor: sourceMeta.borderColor,
          }}
        >
          {sourceMeta.label}
        </span>
      </div>
    );
  }

  if (stateBucket === 'Finished') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--t-text-5)' }}>
          FT
        </span>
      </div>
    );
  }

  if (stateBucket === 'Postponed') {
    return (
      <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>
        PST
      </span>
    );
  }

  if (stateBucket === 'Cancelled') {
    return (
      <span className="text-[10px] font-semibold" style={{ color: 'var(--t-text-5)' }}>
        CANC
      </span>
    );
  }

  const todayKickoff = isTodayKickoff(iso);
  return (
    <div className="flex flex-col items-center gap-0.5 leading-tight">
      {!todayKickoff ? (
        <span className="text-[10px] font-medium" style={{ color: 'var(--t-text-5)' }}>
          {formatKickoffDate(iso)}
        </span>
      ) : null}
      <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>
        {formatKickoff(iso)}
      </span>
    </div>
  );
}

function truncateBookmaker(name: string, max = 11): string {
  return name.length > max ? `${name.slice(0, max - 3)}...` : name;
}

function resolveBookmakerForDisplay(name: string | null | undefined): string | null {
  return name?.trim() || null;
}

function OddsCell({
  label,
  value,
  bookmaker,
  fixtureId,
  outcomeKey,
  movement,
  onOddsClick,
}: {
  label: string;
  value?: number | null;
  bookmaker?: string | null;
  fixtureId: number;
  outcomeKey: 'home' | 'draw' | 'away';
  movement?: LiveOddsMovementDirection;
  onOddsClick: (event: React.MouseEvent) => void;
}) {
  const content = (
    <div className="odds-btn odds-btn-grid" style={{ position: 'relative' }}>
      {movement ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 text-[10px] font-bold leading-none"
          style={{ color: movement === 'up' ? 'var(--t-accent)' : '#f87171' }}
        >
          {movement === 'up' ? '\u2191' : '\u2193'}
        </span>
      ) : null}

      <span className={`odds-value${!value ? ' na' : ''}`}>{value ? value.toFixed(2) : '-'}</span>

      {value && bookmaker ? (
        <span className="odds-bk">
          {truncateBookmaker(bookmaker)}
        </span>
      ) : null}
    </div>
  );

  if (!value || !bookmaker) {
    return (
      <button
        type="button"
        onClick={onOddsClick}
        className="w-full cursor-pointer border-0 bg-transparent p-0"
        aria-label={`${label} odds`}
      >
        {content}
      </button>
    );
  }

  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId,
    outcome: outcomeKey,
    source: 'fixture-list',
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`${value.toFixed(2)} at ${bookmaker} - ${label}`}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      {content}
    </a>
  );
}

function SaveButton({
  saved,
  onClick,
}: {
  saved: boolean;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black transition-colors"
      style={{
        background: saved ? 'rgba(0,230,118,0.12)' : 'var(--t-surface-2)',
        borderColor: saved ? 'rgba(0,230,118,0.28)' : 'var(--t-border-2)',
        color: saved ? 'var(--t-accent)' : 'var(--t-text-5)',
        cursor: 'pointer',
      }}
      aria-label={saved ? 'Remove fixture from watchlist' : 'Save fixture to watchlist'}
      title={saved ? 'Saved to watchlist' : 'Save to watchlist'}
    >
      {saved ? '\u2605' : '\u2606'}
    </button>
  );
}

export function FixtureRow({ fixture, bestOddsFallback, oddsMovement, isSaved = false, onToggleSave }: Props) {
  const router = useRouter();
  const isLive = fixture.stateBucket === 'Live';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const liveSource = liveSummary?.source ?? 'none';
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;

  // Use liveOddsSummary for both live and upcoming (backend populates it via includeLiveOddsSummary).
  // Fall back to bestOddsFallback (batch call) when the summary is absent.
  const homeOdd = liveSummary?.bestHomeOdd ?? bestOddsFallback?.bestHomeOdd ?? null;
  const homeBookmaker = resolveBookmakerForDisplay(liveSummary?.bestHomeBookmaker ?? bestOddsFallback?.bestHomeBookmaker);
  const drawOdd = liveSummary?.bestDrawOdd ?? bestOddsFallback?.bestDrawOdd ?? null;
  const drawBookmaker = resolveBookmakerForDisplay(liveSummary?.bestDrawBookmaker ?? bestOddsFallback?.bestDrawBookmaker);
  const awayOdd = liveSummary?.bestAwayOdd ?? bestOddsFallback?.bestAwayOdd ?? null;
  const awayBookmaker = resolveBookmakerForDisplay(liveSummary?.bestAwayBookmaker ?? bestOddsFallback?.bestAwayBookmaker);

  const detailHref = buildFixtureHref(fixture.apiFixtureId);

  const openOddsTab = (event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(buildFixtureHref(fixture.apiFixtureId, 'odds'));
  };

  const toggleSave = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleSave?.(fixture);
  };

  return (
    <tr
      onClick={() => router.push(detailHref)}
      className="cursor-pointer"
      data-live={isLive ? 'true' : 'false'}
    >
      <td className="w-[80px] px-2 py-1.5 pl-3 text-center">
        <div className="flex flex-col items-center gap-1">
          {renderTimeCell(
            fixture.kickoffAt,
            fixture.stateBucket,
            fixture.status ?? '',
            fixture.elapsed,
            fixture.statusExtra,
            liveSource,
            isLive ? <SaveButton saved={isSaved} onClick={toggleSave} /> : undefined,
          )}
          {!isLive ? <SaveButton saved={isSaved} onClick={toggleSave} /> : null}
        </div>
      </td>

      <td className="px-2 py-1.5">
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span
            className="block min-w-0 flex-1 truncate text-right text-[12px] font-semibold"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.homeTeamName}
          >
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={16} />
        </div>
      </td>

      <td className="w-16 px-1 py-1.5 text-center">
        {hasScore ? (
          <div
            className="odds-cell inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold"
            style={{
              background: isLive ? 'rgba(239,83,80,0.15)' : 'var(--t-surface-2)',
              color: isLive ? '#fca5a5' : 'var(--t-text-2)',
              border: isLive ? '1px solid rgba(239,83,80,0.25)' : '1px solid var(--t-border-2)',
            }}
          >
            <span>{fixture.homeGoals}</span>
            <span style={{ color: 'var(--t-text-5)' }}>-</span>
            <span>{fixture.awayGoals}</span>
          </div>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-6)' }}>
            vs
          </span>
        )}
      </td>

      <td className="px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={16} />
          <span
            className="block min-w-0 flex-1 truncate text-[12px] font-semibold"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.awayTeamName}
          >
            {fixture.awayTeamName}
          </span>
        </div>
      </td>

      <td className="w-[228px] py-1.5 pl-1 pr-3">
        <div className="grid grid-cols-3 gap-1.5">
          <OddsCell
            label="Home"
            value={homeOdd}
            bookmaker={homeBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="home"
            movement={oddsMovement?.home}
            onOddsClick={openOddsTab}
          />
          <OddsCell
            label="Draw"
            value={drawOdd}
            bookmaker={drawBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="draw"
            movement={oddsMovement?.draw}
            onOddsClick={openOddsTab}
          />
          <OddsCell
            label="Away"
            value={awayOdd}
            bookmaker={awayBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="away"
            movement={oddsMovement?.away}
            onOddsClick={openOddsTab}
          />
        </div>
      </td>
    </tr>
  );
}
