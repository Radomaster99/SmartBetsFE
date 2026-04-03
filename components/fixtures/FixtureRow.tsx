'use client';
import { useRouter } from 'next/navigation';
import type { FixtureDto } from '@/lib/types/api';
import { useBestOdds } from '@/lib/hooks/useOdds';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  fixture: FixtureDto;
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

/**
 * Formats a live match's current minute into a bettor-meaningful label.
 * Prefers elapsed minutes ("67'") over raw API status codes ("1H").
 * Falls back to well-known short labels for HT, PEN, ET, etc.
 */
function formatLiveMinute(status: string, elapsed?: number | null, statusExtra?: number | null): string {
  const s = status.toUpperCase();
  if (s === 'HT') return 'HT';
  if (s === 'BT') return 'BT';      // Break before extra time
  if (s === 'P')  return 'PEN';
  if (s === 'SUSP') return 'SUSP';
  if (s === 'INT')  return 'INT';
  if (elapsed != null) {
    return statusExtra ? `${elapsed}+${statusExtra}'` : `${elapsed}'`;
  }
  return s;
}

function renderTimeCell(iso: string, stateBucket: string, status: string, elapsed?: number | null, statusExtra?: number | null) {
  if (stateBucket === 'Live') {
    const liveLabel = formatLiveMinute(status, elapsed, statusExtra);
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-black px-1 py-0.5 rounded" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
          LIVE
        </span>
        <span className="text-[10px] font-bold leading-tight text-center" style={{ color: '#fca5a5', maxWidth: '68px' }}>
          {liveLabel}
        </span>
      </div>
    );
  }

  if (stateBucket === 'Finished') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--t-text-5)' }}>FT</span>
      </div>
    );
  }

  if (stateBucket === 'Postponed') {
    return <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>PST</span>;
  }

  if (stateBucket === 'Cancelled') {
    return <span className="text-[10px] font-semibold" style={{ color: 'var(--t-text-5)' }}>CANC</span>;
  }

  const todayKickoff = isTodayKickoff(iso);
  return (
    <div className="flex flex-col items-center gap-0.5 leading-tight">
      {!todayKickoff && (
        <span className="text-[10px] font-medium" style={{ color: 'var(--t-text-5)' }}>
          {formatKickoffDate(iso)}
        </span>
      )}
      <span className="text-[12px]" style={{ color: 'var(--t-text-3)' }}>
        {formatKickoff(iso)}
      </span>
    </div>
  );
}

function truncateBookmaker(name: string, max = 9): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function OddsCell({
  label,
  value,
  bookmaker,
  fixtureId,
  outcomeKey,
  onOddsClick,
}: {
  label: string;
  value?: number;
  bookmaker?: string;
  fixtureId: number;
  outcomeKey: 'home' | 'draw' | 'away';
  onOddsClick: (e: React.MouseEvent) => void;
}) {
  if (!value || !bookmaker) {
    return (
      <button
        type="button"
        onClick={onOddsClick}
        className="bg-transparent border-0 p-0 cursor-pointer w-full"
        aria-label={`${label} odds`}
      >
        <div className="odds-btn odds-btn-grid">
          <span className="odds-value na">–</span>
        </div>
      </button>
    );
  }

  const href = buildBookmakerHref(bookmaker, { fixture: fixtureId, outcome: outcomeKey, source: 'fixture-list' });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`${value.toFixed(2)} at ${bookmaker} — ${label}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="odds-btn odds-btn-grid">
        <span className="odds-value">{value.toFixed(2)}</span>
        <span style={{
          fontSize: '10px',
          color: 'var(--t-text-5)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          display: 'block',
          textAlign: 'center',
        }}>
          {truncateBookmaker(bookmaker)}
        </span>
      </div>
    </a>
  );
}

export function FixtureRow({ fixture }: Props) {
  const router = useRouter();
  const { data: bestOdds } = useBestOdds(String(fixture.apiFixtureId));
  const isLive = fixture.stateBucket === 'Live';
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;

  const detailHref = buildFixtureHref(fixture.apiFixtureId);

  const openOddsTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(buildFixtureHref(fixture.apiFixtureId, 'odds'));
  };

  return (
    <tr
      onClick={() => router.push(detailHref)}
      className="cursor-pointer transition-colors"
      style={{
        borderBottom: '1px solid var(--t-border)',
        ...(isLive && { boxShadow: 'inset 3px 0 0 rgba(239,83,80,0.65)', background: 'rgba(239,83,80,0.025)' }),
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isLive
          ? 'rgba(239,83,80,0.06)'
          : 'var(--t-surface-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = isLive
          ? 'rgba(239,83,80,0.025)'
          : 'transparent';
      }}
    >
      {/* Time / Status */}
      <td className="pl-3 pr-2 py-2 w-[80px] text-center">
        {renderTimeCell(fixture.kickoffAt, fixture.stateBucket, fixture.status ?? '', fixture.elapsed, fixture.statusExtra)}
      </td>

      {/* Home team */}
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span
            className="block min-w-0 flex-1 truncate text-[13px] font-medium text-right"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.homeTeamName}
          >
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={16} />
        </div>
      </td>

      {/* Score / VS */}
      <td className="px-1 py-2 w-14 text-center">
        {hasScore ? (
          <div
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12px] font-bold odds-cell"
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
          <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-6)' }}>vs</span>
        )}
      </td>

      {/* Away team */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
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

      {/* Best odds + bookmaker */}
      <td className="pl-1 pr-3 py-2 w-[210px]">
        <div className="grid grid-cols-3 gap-1">
          <OddsCell
            label="Home"
            value={bestOdds?.bestHomeOdd}
            bookmaker={bestOdds?.bestHomeBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="home"
            onOddsClick={openOddsTab}
          />
          <OddsCell
            label="Draw"
            value={bestOdds?.bestDrawOdd}
            bookmaker={bestOdds?.bestDrawBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="draw"
            onOddsClick={openOddsTab}
          />
          <OddsCell
            label="Away"
            value={bestOdds?.bestAwayOdd}
            bookmaker={bestOdds?.bestAwayBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="away"
            onOddsClick={openOddsTab}
          />
        </div>
      </td>
    </tr>
  );
}
