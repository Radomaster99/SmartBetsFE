'use client';

import { useRouter } from 'next/navigation';
import type { FixtureDto } from '@/lib/types/api';
import { useBestOdds } from '@/lib/hooks/useOdds';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  fixture: FixtureDto;
  oddsMovement?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
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

function renderTimeCell(
  iso: string,
  stateBucket: string,
  status: string,
  elapsed?: number | null,
  statusExtra?: number | null,
) {
  if (stateBucket === 'Live') {
    const liveLabel = formatLiveMinute(status, elapsed, statusExtra);
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="rounded px-1 py-0.5 text-[10px] font-black" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
          LIVE
        </span>
        <span className="max-w-[68px] text-center text-[10px] font-bold leading-tight" style={{ color: '#fca5a5' }}>
          {liveLabel}
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

function getMovementStyles(movement?: LiveOddsMovementDirection) {
  if (movement === 'up') {
    return {
      background: 'rgba(0, 230, 118, 0.14)',
      borderColor: 'rgba(0, 230, 118, 0.55)',
      boxShadow: '0 0 0 1px rgba(0, 230, 118, 0.18)',
    };
  }

  if (movement === 'down') {
    return {
      background: 'rgba(239, 83, 80, 0.14)',
      borderColor: 'rgba(239, 83, 80, 0.5)',
      boxShadow: '0 0 0 1px rgba(239, 83, 80, 0.14)',
    };
  }

  return undefined;
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
  const movementStyles = getMovementStyles(movement);

  const content = (
    <div className="odds-btn odds-btn-grid" style={{ position: 'relative', ...movementStyles }}>
      {movement ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 text-[10px] font-bold leading-none"
          style={{ color: movement === 'up' ? 'var(--t-accent)' : '#f87171' }}
        >
          {movement === 'up' ? '\u2191' : '\u2193'}
        </span>
      ) : null}

      <span className={`odds-value${!value || !bookmaker ? ' na' : ''}`}>{value && bookmaker ? value.toFixed(2) : '-'}</span>

      {value && bookmaker ? (
        <span
          style={{
            display: 'block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontSize: '10px',
            lineHeight: 1.2,
            color: 'var(--t-text-5)',
          }}
        >
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

export function FixtureRow({ fixture, oddsMovement }: Props) {
  const router = useRouter();
  const isLive = fixture.stateBucket === 'Live';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const needsPreMatchFallback =
    isLive &&
    (!liveSummary ||
      (liveSummary.source !== 'live' &&
        liveSummary.source !== 'prematch'));
  const { data: bestOdds } = useBestOdds(String(fixture.apiFixtureId), undefined, {
    enabled: !isLive || needsPreMatchFallback,
  });
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;

  const homeOdd = isLive
    ? liveSummary?.bestHomeOdd ?? bestOdds?.bestHomeOdd ?? null
    : bestOdds?.bestHomeOdd ?? null;
  const homeBookmaker = isLive
    ? liveSummary?.bestHomeBookmaker ?? bestOdds?.bestHomeBookmaker ?? null
    : bestOdds?.bestHomeBookmaker ?? null;
  const drawOdd = isLive
    ? liveSummary?.bestDrawOdd ?? bestOdds?.bestDrawOdd ?? null
    : bestOdds?.bestDrawOdd ?? null;
  const drawBookmaker = isLive
    ? liveSummary?.bestDrawBookmaker ?? bestOdds?.bestDrawBookmaker ?? null
    : bestOdds?.bestDrawBookmaker ?? null;
  const awayOdd = isLive
    ? liveSummary?.bestAwayOdd ?? bestOdds?.bestAwayOdd ?? null
    : bestOdds?.bestAwayOdd ?? null;
  const awayBookmaker = isLive
    ? liveSummary?.bestAwayBookmaker ?? bestOdds?.bestAwayBookmaker ?? null
    : bestOdds?.bestAwayBookmaker ?? null;

  const detailHref = buildFixtureHref(fixture.apiFixtureId);

  const openOddsTab = (event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(buildFixtureHref(fixture.apiFixtureId, 'odds'));
  };

  return (
    <tr
      onClick={() => router.push(detailHref)}
      className="cursor-pointer transition-colors"
      style={{
        borderBottom: '1px solid var(--t-border)',
        ...(isLive ? { boxShadow: 'inset 3px 0 0 rgba(239,83,80,0.65)', background: 'rgba(239,83,80,0.025)' } : null),
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = isLive ? 'rgba(239,83,80,0.06)' : 'var(--t-surface-2)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = isLive ? 'rgba(239,83,80,0.025)' : 'transparent';
      }}
    >
      <td className="w-[80px] px-2 py-2 pl-3 text-center">
        {renderTimeCell(fixture.kickoffAt, fixture.stateBucket, fixture.status ?? '', fixture.elapsed, fixture.statusExtra)}
      </td>

      <td className="px-2 py-2">
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span
            className="block min-w-0 flex-1 truncate text-right text-[13px] font-medium"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.homeTeamName}
          >
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={16} />
        </div>
      </td>

      <td className="w-14 px-1 py-2 text-center">
        {hasScore ? (
          <div
            className="odds-cell inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-bold"
            style={{
              background: isLive ? 'rgba(239,83,80,0.15)' : 'var(--t-surface-2)',
              color: isLive ? '#fca5a5' : 'var(--t-text-2)',
            }}
          >
            <span>{fixture.homeGoals}</span>
            <span style={{ color: 'var(--t-text-5)' }}>-</span>
            <span>{fixture.awayGoals}</span>
          </div>
        ) : (
          <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-6)' }}>
            vs
          </span>
        )}
      </td>

      <td className="px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={16} />
          <span
            className="block min-w-0 flex-1 truncate text-[13px] font-medium"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.awayTeamName}
          >
            {fixture.awayTeamName}
          </span>
        </div>
      </td>

      <td className="w-[210px] py-2 pl-1 pr-3">
        <div className="grid grid-cols-3 gap-1">
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
