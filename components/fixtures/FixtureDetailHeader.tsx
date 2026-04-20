import { useState } from 'react';
import type { FixtureDetailDto } from '@/lib/types/api';
import type { FixtureQuickStatsSummary, FixtureStatPairSummary } from '@/lib/fixture-statistics';
import { formatFixtureStatusLabel } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';

export interface SelectedFixtureTeam {
  side: 'home' | 'away';
  apiTeamId: number;
  name: string;
  logoUrl: string;
}

interface Props {
  detail: FixtureDetailDto;
  onTeamSelect?: (team: SelectedFixtureTeam) => void;
  quickStats?: FixtureQuickStatsSummary | null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCenterKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' •');
}

function formatLiveMinute(status: string, elapsed?: number | null, statusExtra?: number | null): string | null {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === 'HT') return "45'";
  if (normalizedStatus === 'BT') return elapsed != null ? `${elapsed}'` : null;
  if (normalizedStatus === 'INT') return elapsed != null ? `${elapsed}'` : null;
  if (normalizedStatus === 'P') return 'PEN';
  if (normalizedStatus === 'SUSP') return 'SUSP';

  if (elapsed != null) {
    return statusExtra ? `${elapsed}+${statusExtra}'` : `${elapsed}'`;
  }

  return null;
}

function TeamCard({
  name,
  logoUrl,
  side,
  apiTeamId,
  onSelect,
}: {
  name: string;
  logoUrl: string;
  side: 'home' | 'away';
  apiTeamId: number;
  onSelect?: (team: SelectedFixtureTeam) => void;
}) {
  const isInteractive = Boolean(onSelect);
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <TeamLogo src={logoUrl} alt={name} size={32} />
      <span className="text-center text-[14px] font-bold leading-tight" style={{ color: 'var(--t-text-1)' }}>
        {name}
      </span>
    </div>
  );

  if (!isInteractive) {
    return <div className="min-w-0 flex-1">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ side, apiTeamId, name, logoUrl })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="min-w-0 flex-1 rounded-xl px-3 py-3 transition-all duration-150"
      style={{
        background: isHovered ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
        border: isHovered ? '1px solid rgba(0, 230, 118, 0.28)' : '1px solid transparent',
        boxShadow: isHovered ? '0 10px 22px rgba(0, 230, 118, 0.08)' : 'none',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  );
}

function QuickStatGlyph({ kind }: { kind: 'yellow' | 'red' | 'corners' | 'shots' }) {
  if (kind === 'yellow' || kind === 'red') {
    return (
      <span
        aria-hidden="true"
        style={{
          width: 9,
          height: 12,
          borderRadius: 2,
          background: kind === 'yellow' ? '#facc15' : '#ef4444',
          boxShadow:
            kind === 'yellow'
              ? '0 0 0 1px rgba(250,204,21,0.18)'
              : '0 0 0 1px rgba(239,68,68,0.18)',
          transform: 'rotate(-2deg)',
          flexShrink: 0,
        }}
      />
    );
  }

  if (kind === 'corners') {
    return (
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 11,
          height: 12,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 2,
            bottom: 0,
            width: 1.5,
            height: 12,
            background: 'rgba(226,232,240,0.85)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 3,
            top: 1,
            width: 6,
            height: 5,
            background: 'rgba(226,232,240,0.92)',
            clipPath: 'polygon(0 0, 100% 28%, 0 100%)',
          }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 12,
        height: 12,
        borderRadius: 999,
        border: '1.5px solid rgba(147,197,253,0.9)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 2.5,
          borderRadius: 999,
          background: 'rgba(147,197,253,0.9)',
        }}
      />
    </span>
  );
}

function formatStatPair(pair: FixtureStatPairSummary): string {
  return `${pair.home ?? '-'}-${pair.away ?? '-'}`;
}

function QuickStatChip({
  kind,
  label,
  pair,
}: {
  kind: 'yellow' | 'red' | 'corners' | 'shots';
  label: string;
  pair: FixtureStatPairSummary;
}) {
  return (
    <div
      title={label}
      aria-label={`${label}: ${pair.home ?? '-'} to ${pair.away ?? '-'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 56,
        padding: '4px 8px',
        borderRadius: 999,
        background: 'rgba(15,23,42,0.42)',
        border: '1px solid rgba(148,163,184,0.14)',
        color: 'var(--t-text-2)',
      }}
    >
      <QuickStatGlyph kind={kind} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '0.01em',
        }}
      >
        {formatStatPair(pair)}
      </span>
    </div>
  );
}

export function FixtureDetailHeader({ detail, onTeamSelect, quickStats }: Props) {
  const f = detail.fixture;
  const isLive = f.stateBucket === 'Live';
  const isFinished = f.stateBucket === 'Finished';
  const hasScore = f.homeGoals !== null && f.awayGoals !== null;
  const statusLabel = formatFixtureStatusLabel(f.stateBucket, f.status);
  const liveMinuteLabel = isLive ? formatLiveMinute(f.status ?? '', f.elapsed, f.statusExtra) : null;
  const quickStatItems = [
    quickStats?.redCards ? { kind: 'red' as const, label: 'Red cards', pair: quickStats.redCards } : null,
    quickStats?.yellowCards ? { kind: 'yellow' as const, label: 'Yellow cards', pair: quickStats.yellowCards } : null,
    quickStats?.corners ? { kind: 'corners' as const, label: 'Corners', pair: quickStats.corners } : null,
    quickStats?.shotsOnTarget ? { kind: 'shots' as const, label: 'Shots on target', pair: quickStats.shotsOnTarget } : null,
  ].filter(Boolean) as Array<{ kind: 'yellow' | 'red' | 'corners' | 'shots'; label: string; pair: FixtureStatPairSummary }>;

  return (
    <div style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
      <div className="flex items-center gap-4 px-4 py-3">
        <TeamCard
          name={f.homeTeamName}
          logoUrl={f.homeTeamLogoUrl}
          side="home"
          apiTeamId={f.homeTeamApiId}
          onSelect={onTeamSelect}
        />

        <div className="flex flex-shrink-0 flex-col items-center gap-1 px-4">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--t-text-5)' }}>
            {formatCenterKickoff(f.kickoffAt)}
          </span>
          {hasScore ? (
            <div className="odds-cell flex items-center gap-2 text-[2.5rem] font-black" style={{ color: isLive ? '#fca5a5' : 'var(--t-text-1)' }}>
              <span>{f.homeGoals}</span>
              <span style={{ color: 'var(--t-text-6)', fontSize: '1.5rem' }}>-</span>
              <span>{f.awayGoals}</span>
            </div>
          ) : (
            <div className="text-[22px] font-light tracking-[0.2em]" style={{ color: 'var(--t-text-6)' }}>
              vs
            </div>
          )}
          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-[11px] font-bold" style={{ color: '#fca5a5' }}>
                {statusLabel}
              </span>
              {liveMinuteLabel ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: 'rgba(239,83,80,0.14)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.2)' }}
                >
                  {liveMinuteLabel}
                </span>
              ) : null}
            </div>
          ) : null}
          {isFinished ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>
              Full Time
            </span>
          ) : null}
        </div>

        <TeamCard
          name={f.awayTeamName}
          logoUrl={f.awayTeamLogoUrl}
          side="away"
          apiTeamId={f.awayTeamApiId}
          onSelect={onTeamSelect}
        />
      </div>

      {quickStatItems.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 16px 12px',
          }}
        >
          {quickStatItems.map((item) => (
            <QuickStatChip key={item.label} kind={item.kind} label={item.label} pair={item.pair} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
