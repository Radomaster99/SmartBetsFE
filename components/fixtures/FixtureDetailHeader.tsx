import type { FixtureDetailDto } from '@/lib/types/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';

export interface SelectedFixtureTeam {
  side: 'home' | 'away';
  apiTeamId: number;
  name: string;
  logoUrl: string;
}

interface Props {
  detail: FixtureDetailDto;
  selectedTeamSide?: SelectedFixtureTeam['side'] | null;
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

function minutesAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function TeamCard({
  name,
  logoUrl,
  side,
  apiTeamId,
  isActive,
  onSelect,
}: {
  name: string;
  logoUrl: string;
  side: 'home' | 'away';
  apiTeamId: number;
  isActive: boolean;
  onSelect?: (team: SelectedFixtureTeam) => void;
}) {
  const isInteractive = Boolean(onSelect);

  const content = (
    <div className="flex flex-col items-center gap-3 min-w-0">
      <TeamLogo src={logoUrl} alt={name} size={56} />
      <span className="text-[15px] font-bold text-center leading-tight" style={{ color: 'var(--t-text-1)' }}>
        {name}
      </span>
      {isInteractive ? (
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isActive ? 'var(--t-accent)' : 'var(--t-text-5)' }}>
          {isActive ? 'Hide team details' : 'Show team details'}
        </span>
      ) : null}
    </div>
  );

  if (!isInteractive) {
    return <div className="flex-1 min-w-0">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ side, apiTeamId, name, logoUrl })}
      className="flex-1 min-w-0 rounded-xl px-4 py-4 transition-colors"
      style={{
        background: isActive ? 'rgba(0,230,118,0.06)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(0,230,118,0.35)' : 'transparent'}`,
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  );
}

export function FixtureDetailHeader({ detail, selectedTeamSide = null, onTeamSelect }: Props) {
  const f = detail.fixture;
  const isLive = f.stateBucket === 'Live';
  const isFinished = f.stateBucket === 'Finished';
  const hasScore = f.homeGoals !== null && f.awayGoals !== null;

  return (
    <div style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-page-bg)' }}
      >
        <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
          {f.countryName}
        </span>
        <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-4)' }}>
          {f.leagueName}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
            {formatDateTime(f.kickoffAt)}
          </span>
          <StatusBadge state={f.stateBucket} status={f.status} />
        </div>
      </div>

      <div className="flex items-center px-6 py-6 gap-4">
        <TeamCard
          name={f.homeTeamName}
          logoUrl={f.homeTeamLogoUrl}
          side="home"
          apiTeamId={f.homeTeamApiId}
          isActive={selectedTeamSide === 'home'}
          onSelect={onTeamSelect}
        />

        <div className="flex-shrink-0 flex flex-col items-center gap-1 px-6">
          {hasScore ? (
            <div
              className="flex items-center gap-3 odds-cell text-5xl font-black"
              style={{ color: isLive ? '#fca5a5' : 'var(--t-text-1)' }}
            >
              <span>{f.homeGoals}</span>
              <span style={{ color: 'var(--t-text-6)', fontSize: '2rem' }}>-</span>
              <span>{f.awayGoals}</span>
            </div>
          ) : (
            <div className="text-[28px] font-light tracking-[0.2em]" style={{ color: 'var(--t-text-6)' }}>
              vs
            </div>
          )}
          {isLive ? (
            <span className="text-[11px] font-bold animate-pulse" style={{ color: '#fca5a5' }}>
              {f.status}
            </span>
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
          isActive={selectedTeamSide === 'away'}
          onSelect={onTeamSelect}
        />
      </div>

      <div className="flex items-center justify-end px-4 pb-3 gap-2">
        <span className="text-[10px]" style={{ color: 'var(--t-text-6)' }}>
          Odds updated:
        </span>
        <span className="text-[10px]" style={{ color: 'var(--t-text-4)' }}>
          {minutesAgo(detail.oddsLastSyncedAtUtc)}
        </span>
      </div>
    </div>
  );
}
