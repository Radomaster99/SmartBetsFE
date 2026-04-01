'use client';
import { useRouter } from 'next/navigation';
import type { FixtureDto } from '@/lib/types/api';
import { useBestOdds } from '@/lib/hooks/useOdds';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';

interface Props {
  fixture: FixtureDto;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function OddsBtn({ label, value }: { label: string; value?: number }) {
  return (
    <div className="odds-btn">
      <span className="odds-label">{label}</span>
      <span className={`odds-value${!value ? ' na' : ''}`}>
        {value ? value.toFixed(2) : '—'}
      </span>
    </div>
  );
}

export function FixtureRow({ fixture }: Props) {
  const router = useRouter();
  const { data: bestOdds } = useBestOdds(String(fixture.apiFixtureId));
  const isLive     = fixture.stateBucket === 'Live';
  const isFinished = fixture.stateBucket === 'Finished';
  const hasScore   = fixture.homeGoals !== null && fixture.awayGoals !== null;

  return (
    <tr
      onClick={() => router.push(`/football/fixtures/${fixture.apiFixtureId}`)}
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--t-border)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--t-surface-2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >
      {/* Time / status */}
      <td className="pl-3 pr-2 py-2.5 w-12 text-center">
        {isLive ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: '#7f1d1d', color: '#fca5a5' }}>LIVE</span>
            <span className="text-[11px] font-bold" style={{ color: '#fca5a5' }}>{fixture.status}</span>
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: isFinished ? 'var(--t-text-5)' : 'var(--t-text-3)' }}>
            {formatKickoff(fixture.kickoffAt)}
          </span>
        )}
      </td>

      {/* Home team */}
      <td className="px-2 py-2.5">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[13px] font-medium text-right" style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}>
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
        </div>
      </td>

      {/* Score / vs */}
      <td className="px-1 py-2.5 w-16 text-center">
        {hasScore ? (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[13px] font-bold odds-cell"
            style={{
              background: isLive ? 'rgba(239,83,80,0.15)' : 'var(--t-surface-2)',
              color: isLive ? '#fca5a5' : 'var(--t-text-2)',
            }}
          >
            <span>{fixture.homeGoals}</span>
            <span style={{ color: 'var(--t-text-5)' }}>–</span>
            <span>{fixture.awayGoals}</span>
          </div>
        ) : (
          <span className="text-[12px] font-medium" style={{ color: 'var(--t-text-6)' }}>vs</span>
        )}
      </td>

      {/* Away team */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={18} />
          <span className="text-[13px] font-medium" style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}>
            {fixture.awayTeamName}
          </span>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-2 py-2.5 w-12">
        <StatusBadge state={fixture.stateBucket} status={fixture.status} />
      </td>

      {/* Odds */}
      <td className="px-1 py-2.5">
        <div className="flex items-center gap-1">
          <OddsBtn label="1" value={bestOdds?.bestHomeOdd} />
          <OddsBtn label="X" value={bestOdds?.bestDrawOdd} />
          <OddsBtn label="2" value={bestOdds?.bestAwayOdd} />
        </div>
      </td>
    </tr>
  );
}
