import type { FixtureDetailDto } from '@/lib/types/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';

interface Props {
  detail: FixtureDetailDto;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function minutesAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function FixtureDetailHeader({ detail }: Props) {
  const f          = detail.fixture;
  const isLive     = f.stateBucket === 'Live';
  const isFinished = f.stateBucket === 'Finished';
  const hasScore   = f.homeGoals !== null && f.awayGoals !== null;

  return (
    <div style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-page-bg)' }}
      >
        <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>{f.countryName}</span>
        <span style={{ color: 'var(--t-border-2)' }}>›</span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-4)' }}>{f.leagueName}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>{formatDateTime(f.kickoffAt)}</span>
          <StatusBadge state={f.stateBucket} status={f.status} />
        </div>
      </div>

      {/* Match header */}
      <div className="flex items-center px-6 py-6 gap-4">
        <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
          <TeamLogo src={f.homeTeamLogoUrl} alt={f.homeTeamName} size={56} />
          <span className="text-[15px] font-bold text-center leading-tight" style={{ color: 'var(--t-text-1)' }}>
            {f.homeTeamName}
          </span>
        </div>

        <div className="flex-shrink-0 flex flex-col items-center gap-1 px-6">
          {hasScore ? (
            <div
              className="flex items-center gap-3 odds-cell text-5xl font-black"
              style={{ color: isLive ? '#fca5a5' : 'var(--t-text-1)' }}
            >
              <span>{f.homeGoals}</span>
              <span style={{ color: 'var(--t-text-6)', fontSize: '2rem' }}>–</span>
              <span>{f.awayGoals}</span>
            </div>
          ) : (
            <div className="text-[28px] font-light tracking-[0.2em]" style={{ color: 'var(--t-text-6)' }}>vs</div>
          )}
          {isLive     && <span className="text-[11px] font-bold animate-pulse" style={{ color: '#fca5a5' }}>{f.status}</span>}
          {isFinished && <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>Full Time</span>}
        </div>

        <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
          <TeamLogo src={f.awayTeamLogoUrl} alt={f.awayTeamName} size={56} />
          <span className="text-[15px] font-bold text-center leading-tight" style={{ color: 'var(--t-text-1)' }}>
            {f.awayTeamName}
          </span>
        </div>
      </div>

      {/* Freshness */}
      <div className="flex items-center justify-end px-4 pb-3 gap-2">
        <span className="text-[10px]" style={{ color: 'var(--t-text-6)' }}>Odds updated:</span>
        <span className="text-[10px]" style={{ color: 'var(--t-text-4)' }}>{minutesAgo(detail.oddsLastSyncedAtUtc)}</span>
      </div>
    </div>
  );
}
