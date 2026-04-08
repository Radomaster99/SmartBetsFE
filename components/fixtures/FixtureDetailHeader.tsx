import { useState } from 'react';
import type { FixtureDetailDto } from '@/lib/types/api';
import { StatusBadge, formatFixtureStatusLabel } from '@/components/shared/StatusBadge';
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

export function FixtureDetailHeader({ detail, onTeamSelect }: Props) {
  const f = detail.fixture;
  const isLive = f.stateBucket === 'Live';
  const isFinished = f.stateBucket === 'Finished';
  const hasScore = f.homeGoals !== null && f.awayGoals !== null;
  const statusLabel = formatFixtureStatusLabel(f.stateBucket, f.status);
  const liveMinuteLabel = isLive ? formatLiveMinute(f.status ?? '', f.elapsed, f.statusExtra) : null;

  return (
    <div style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-page-bg)' }}
      >
        <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
          {f.countryName}
        </span>
        <span style={{ color: 'var(--t-border-2)' }}>/</span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-4)' }}>
          {f.leagueName}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge state={f.stateBucket} status={f.status} />
        </div>
      </div>

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
    </div>
  );
}
