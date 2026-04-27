'use client';
import Link from 'next/link';
import type { FixtureDto } from '@/lib/types/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { buildFixturePath } from '@/lib/seo/slug';

interface Props {
  title: string;
  description: string;
  fixtures: FixtureDto[];
  teamApiId: number;
  emptyTitle: string;
  emptyDescription: string;
  isLoading?: boolean;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getVenueBadgeStyle(fixture: FixtureDto, isHome: boolean) {
  if (fixture.homeGoals === null || fixture.awayGoals === null) {
    return {
      background: 'var(--t-surface-2)',
      color: 'var(--t-text-4)',
    };
  }

  const teamGoals = isHome ? fixture.homeGoals : fixture.awayGoals;
  const opponentGoals = isHome ? fixture.awayGoals : fixture.homeGoals;

  if (teamGoals > opponentGoals) {
    return {
      background: 'rgba(0,230,118,0.12)',
      color: 'var(--t-accent)',
    };
  }

  if (teamGoals < opponentGoals) {
    return {
      background: 'rgba(239,83,80,0.12)',
      color: '#f87171',
    };
  }

  return {
    background: 'var(--t-surface-2)',
    color: 'var(--t-text-4)',
  };
}

export function TeamFixturesList({
  title,
  description,
  fixtures,
  teamApiId,
  emptyTitle,
  emptyDescription,
  isLoading = false,
}: Props) {
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'var(--t-surface)',
        border: '1px solid var(--t-border)',
      }}
    >
      <div className="mb-3">
        <h2 className="text-[15px] font-bold" style={{ color: 'var(--t-text-1)' }}>
          {title}
        </h2>
        <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
          {description}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-8" />
      ) : fixtures.length ? (
        <div className="flex flex-col gap-2">
          {fixtures.map((fixture) => {
            const isHome = fixture.homeTeamApiId === teamApiId;
            const matchupLabel = `${fixture.homeTeamName} - ${fixture.awayTeamName}`;
            const venueBadgeStyle = getVenueBadgeStyle(fixture, isHome);
            const scoreLabel =
              fixture.homeGoals !== null && fixture.awayGoals !== null
                ? `${fixture.homeGoals}-${fixture.awayGoals}`
                : 'vs';

            return (
              <Link
                key={fixture.apiFixtureId}
                href={`${buildFixturePath(fixture.homeTeamName, fixture.awayTeamName, fixture.apiFixtureId)}?tab=match`}
                className="rounded-lg px-3 py-3 transition-colors"
                style={{
                  background: 'var(--t-page-bg)',
                  border: '1px solid var(--t-border)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={venueBadgeStyle}
                      >
                        {isHome ? 'Home' : 'Away'}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                        {fixture.round ?? fixture.leagueName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
                      <span className="truncate text-[13px] font-medium" style={{ color: 'var(--t-text-1)' }}>
                        {matchupLabel}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                      {formatKickoff(fixture.kickoffAt)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[13px] font-bold" style={{ color: 'var(--t-text-2)' }}>
                      {scoreLabel}
                    </span>
                    <StatusBadge state={fixture.stateBucket} status={fixture.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}
