'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLeagues } from '@/lib/hooks/useLeagues';
import { useStandings } from '@/lib/hooks/useStandings';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildStandingsHref(leagueId: number | null, season: number) {
  const params = new URLSearchParams();

  if (leagueId) {
    params.set('leagueId', String(leagueId));
  }

  if (leagueId || season !== DEFAULT_SEASON) {
    params.set('season', String(season));
  }

  const query = params.toString();
  return query ? `/football/standings?${query}` : '/football/standings';
}

function buildTeamHref(apiTeamId: number, leagueId: number, season: number) {
  const params = new URLSearchParams({
    leagueId: String(leagueId),
    season: String(season),
  });

  return `/football/teams/${apiTeamId}?${params.toString()}`;
}

function StandingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const { data: leagues, isLoading: leaguesLoading } = useLeagues(season);
  const { data: standings, isLoading: standingsLoading, isError: standingsError } = useStandings(leagueId, season);
  const selectedLeague = leagues?.find((league) => league.apiLeagueId === leagueId) ?? null;

  const handleLeagueChange = (value: string) => {
    const nextLeagueId = parsePositiveInt(value);
    router.replace(buildStandingsHref(nextLeagueId, season), { scroll: false });
  };

  useEffect(() => {
    const canonicalHref = buildStandingsHref(leagueId, season);
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `/football/standings?${currentQuery}` : '/football/standings';

    if (canonicalHref !== currentHref) {
      router.replace(canonicalHref, { scroll: false });
    }
  }, [leagueId, router, searchParams, season]);

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--t-border)' }}
      >
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--t-text-1)' }}>
            Standings
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
            Choose a league and click any team to open its detail page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={leagueId ? String(leagueId) : ''}
            onChange={(event) => handleLeagueChange(event.target.value)}
            disabled={leaguesLoading}
            className="min-w-[220px] rounded px-3 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
          >
            <option value="">
              {leaguesLoading ? 'Loading leagues...' : 'Choose a league'}
            </option>
            {(leagues ?? []).map((league) => (
              <option key={`${league.apiLeagueId}-${league.season}`} value={league.apiLeagueId}>
                {league.countryName} - {league.name}
              </option>
            ))}
          </select>

          <select
            value={season}
            onChange={(event) => router.replace(buildStandingsHref(leagueId, Number(event.target.value)), { scroll: false })}
            className="rounded px-3 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
          >
            {[2026, 2025, 2024, 2023].map((value) => (
              <option key={value} value={value}>
                {value}/{value + 1}
              </option>
            ))}
          </select>

          {leagueId ? (
            <button
              type="button"
              onClick={() => router.replace(buildStandingsHref(null, season), { scroll: false })}
              className="rounded px-2.5 py-1.5 text-[11px] font-medium"
              style={{
                background: 'var(--t-surface-2)',
                border: '1px solid var(--t-border-2)',
                color: 'var(--t-text-3)',
                cursor: 'pointer',
              }}
            >
              Clear league
            </button>
          ) : null}
        </div>
      </div>

      {selectedLeague ? (
        <div
          className="px-5 py-2 text-[12px]"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-surface)' }}
        >
          <span style={{ color: 'var(--t-text-5)' }}>Selected league:</span>{' '}
          <span className="font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {selectedLeague.countryName} - {selectedLeague.name}
          </span>
          <span style={{ color: 'var(--t-text-5)' }}> - {season}</span>
        </div>
      ) : null}

      <div className="flex-1 overflow-auto p-5">
        {!leagueId ? (
          <div
            className="mx-auto max-w-xl rounded-xl p-6"
            style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
          >
            <EmptyState
              title="Select a league"
              description="Pick a league from the dropdown below or use the left sidebar to open the standings table."
            />

            <div className="mt-5">
              <label className="mb-2 block text-[12px] font-medium" style={{ color: 'var(--t-text-3)' }}>
                League
              </label>
              <select
                value=""
                onChange={(event) => handleLeagueChange(event.target.value)}
                disabled={leaguesLoading}
                className="w-full rounded px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
              >
                <option value="">
                  {leaguesLoading ? 'Loading leagues...' : 'Choose a league'}
                </option>
                {(leagues ?? []).map((league) => (
                  <option key={`empty-${league.apiLeagueId}-${league.season}`} value={league.apiLeagueId}>
                    {league.countryName} - {league.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : standingsLoading ? (
          <LoadingSpinner />
        ) : standingsError ? (
          <EmptyState title="Failed to load standings" description="Try again or choose another league." />
        ) : !standings?.length ? (
          <EmptyState title="No standings available" description="There is no standings data for this league yet." />
        ) : (
          <StandingsTable
            standings={standings}
            resolveTeamHref={(standing) =>
              leagueId && standing.apiTeamId
                ? buildTeamHref(standing.apiTeamId, leagueId, season)
                : null
            }
          />
        )}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StandingsContent />
    </Suspense>
  );
}
