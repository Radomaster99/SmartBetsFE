'use client';
import { useRouter } from 'next/navigation';
import type { FixtureDto } from '@/lib/types/api';
import { useBestOdds } from '@/lib/hooks/useOdds';
import { StatusBadge, formatFixtureStatusLabel } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';

interface Props {
  fixture: FixtureDto;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function OddsBtn({ label, value }: { label: string; value?: number }) {
  return (
    <div className="odds-btn odds-btn-grid" aria-label={`${label} odds`}>
      <span className={`odds-value${!value ? ' na' : ''}`}>
        {value ? value.toFixed(2) : '-'}
      </span>
    </div>
  );
}

export function FixtureRow({ fixture }: Props) {
  const router = useRouter();
  const { data: bestOdds } = useBestOdds(String(fixture.apiFixtureId));
  const isLive = fixture.stateBucket === 'Live';
  const isFinished = fixture.stateBucket === 'Finished';
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;
  const statusLabel = formatFixtureStatusLabel(fixture.stateBucket, fixture.status);
  const openOddsTab = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    router.push(`/football/fixtures/${fixture.apiFixtureId}?tab=odds`);
  };

  return (
    <tr
      onClick={() => router.push(`/football/fixtures/${fixture.apiFixtureId}`)}
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--t-border)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = 'var(--t-surface-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
      }}
    >
      <td className="pl-3 pr-2 py-2.5 w-[84px] text-center">
        {isLive ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-black px-1 py-0.5 rounded" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
              Live
            </span>
            <span className="text-[10px] font-bold leading-tight" style={{ color: '#fca5a5', maxWidth: '72px' }}>
              {statusLabel}
            </span>
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: isFinished ? 'var(--t-text-5)' : 'var(--t-text-3)' }}>
            {formatKickoff(fixture.kickoffAt)}
          </span>
        )}
      </td>

      <td className="px-2 py-2.5">
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span
            className="block min-w-0 flex-1 truncate text-[13px] font-medium text-right"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.homeTeamName}
          >
            {fixture.homeTeamName}
          </span>
          <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
        </div>
      </td>

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
            <span style={{ color: 'var(--t-text-5)' }}>-</span>
            <span>{fixture.awayGoals}</span>
          </div>
        ) : (
          <span className="text-[12px] font-medium" style={{ color: 'var(--t-text-6)' }}>
            vs
          </span>
        )}
      </td>

      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={18} />
          <span
            className="block min-w-0 flex-1 truncate text-[13px] font-medium"
            style={{ color: isLive ? 'var(--t-text-1)' : 'var(--t-text-2)' }}
            title={fixture.awayTeamName}
          >
            {fixture.awayTeamName}
          </span>
        </div>
      </td>

      <td className="px-2 py-2.5 w-[112px]">
        <StatusBadge state={fixture.stateBucket} status={fixture.status} />
      </td>

      <td className="pl-1 pr-4 py-2.5 w-[176px]">
        <div className="grid grid-cols-3 gap-1" style={{ columnGap: '5px' }}>
          {[
            { label: '1', value: bestOdds?.bestHomeOdd },
            { label: 'X', value: bestOdds?.bestDrawOdd },
            { label: '2', value: bestOdds?.bestAwayOdd },
          ].map((odd) => (
            <button
              key={odd.label}
              type="button"
              onClick={openOddsTab}
              className="bg-transparent border-0 p-0 text-left cursor-pointer"
              aria-label={`Open ${fixture.homeTeamName} vs ${fixture.awayTeamName} odds tab`}
            >
              <OddsBtn label={odd.label} value={odd.value} />
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
