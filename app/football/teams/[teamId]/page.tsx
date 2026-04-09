'use client';
import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { TeamFixturesList } from '@/components/teams/TeamFixturesList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { useTeam } from '@/lib/hooks/useTeams';
import { useFixtures } from '@/lib/hooks/useFixtures';
import { useLeagues } from '@/lib/hooks/useLeagues';

interface Props {
  params: Promise<{ teamId: string }>;
}

interface SelectedPlayer {
  apiPlayerId: number;
  label: string | null;
}

const DEFAULT_SEASON = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function findScrollContainer(element: HTMLElement): HTMLElement | Window {
  let current = element.parentElement;

  while (current) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;

    if (isScrollable) {
      return current;
    }

    current = current.parentElement;
  }

  return window;
}

function resolvePlayerLabel(target: HTMLElement): string | null {
  const directLabel =
    target.getAttribute('data-player-name') ??
    target.querySelector<HTMLElement>('[data-player-name]')?.getAttribute('data-player-name') ??
    target.querySelector<HTMLElement>('.player-name')?.textContent ??
    target.querySelector<HTMLElement>('strong')?.textContent;

  if (directLabel?.trim()) {
    return directLabel.trim();
  }

  const text = target.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  return text ? text : null;
}

function extractPlayerId(target: HTMLElement): number | null {
  const directId =
    target.getAttribute('data-player-id') ??
    target.getAttribute('data-id') ??
    target.querySelector<HTMLElement>('[data-player-id]')?.getAttribute('data-player-id') ??
    target.querySelector<HTMLElement>('[data-id]')?.getAttribute('data-id');

  if (!directId) {
    return null;
  }

  const parsed = Number(directId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function TeamPageContent({ teamId }: { teamId: number }) {
  const searchParams = useSearchParams();
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const teamWidgetScopeRef = useRef<HTMLDivElement>(null);
  const playerDetailsSectionRef = useRef<HTMLElement>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const selectedPlayerRef = useRef<SelectedPlayer | null>(null);
  const leagueId = parsePositiveInt(searchParams.get('leagueId'));
  const season = parsePositiveInt(searchParams.get('season')) ?? DEFAULT_SEASON;
  const fromFixtureId = parsePositiveInt(searchParams.get('fromFixtureId'));
  const { data: team, isLoading: teamLoading, isError: teamError } = useTeam(teamId);
  const { data: leagues } = useLeagues(season);
  const selectedLeague = leagues?.find((league) => league.apiLeagueId === leagueId) ?? null;

  const recentFixturesQuery = useFixtures({
    teamId,
    leagueId: leagueId ?? undefined,
    season,
    state: 'Finished',
    page: 1,
    pageSize: 5,
    direction: 'desc',
  });

  const liveFixturesQuery = useFixtures({
    teamId,
    leagueId: leagueId ?? undefined,
    season,
    state: 'Live',
    page: 1,
    pageSize: 3,
    direction: 'asc',
  });

  const upcomingFixturesQuery = useFixtures({
    teamId,
    leagueId: leagueId ?? undefined,
    season,
    state: 'Upcoming',
    page: 1,
    pageSize: 5,
    direction: 'asc',
  });

  const backHref = fromFixtureId
    ? `/football/fixtures/${fromFixtureId}?tab=match`
    : leagueId
      ? `/football/standings?leagueId=${leagueId}&season=${season}`
      : '/football/standings';
  const backLabel = fromFixtureId ? 'Back to match' : 'Back to standings';

  useEffect(() => {
    selectedPlayerRef.current = selectedPlayer;
  }, [selectedPlayer]);

  useEffect(() => {
    const scope = teamWidgetScopeRef.current;
    if (!scope) {
      return;
    }

    const cleanups = new Set<() => void>();

    const bindTeamDetailDelegates = () => {
      const teamDetails = scope.querySelectorAll<HTMLElement>('team-detail');

      teamDetails.forEach((teamDetail) => {
        if (teamDetail.dataset.smartbetsPlayerDelegate === 'true') {
          return;
        }

        const handlePlayerClick = (event: Event) => {
          if (!(event.target instanceof HTMLElement)) {
            return;
          }

          const playerTarget = event.target.closest<HTMLElement>(
            '.team-squads-container .player-target[data-id], .team-squads-container .player-card[data-id]',
          );
          if (!playerTarget || !teamDetail.contains(playerTarget)) {
            return;
          }

          const apiPlayerId = extractPlayerId(playerTarget);
          if (!apiPlayerId) {
            return;
          }

          const nextPlayer: SelectedPlayer = {
            apiPlayerId,
            label: resolvePlayerLabel(playerTarget),
          };

          const currentPlayer = selectedPlayerRef.current;
          if (currentPlayer?.apiPlayerId === nextPlayer.apiPlayerId) {
            event.preventDefault();
            event.stopPropagation();
            if ('stopImmediatePropagation' in event) {
              event.stopImmediatePropagation();
            }
            setSelectedPlayer(null);
            return;
          }

          setSelectedPlayer(nextPlayer);
        };

        teamDetail.dataset.smartbetsPlayerDelegate = 'true';
        teamDetail.addEventListener('click', handlePlayerClick, true);
        cleanups.add(() => {
          teamDetail.removeEventListener('click', handlePlayerClick, true);
          delete teamDetail.dataset.smartbetsPlayerDelegate;
        });
      });
    };

    bindTeamDetailDelegates();

    const observer = new MutationObserver(() => {
      bindTeamDetailDelegates();
    });

    observer.observe(scope, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [teamLoading, team?.apiTeamId]);

  useEffect(() => {
    const scope = teamWidgetScopeRef.current;
    if (!scope) {
      return;
    }

    const applySelectedState = () => {
      const playerTargets = scope.querySelectorAll<HTMLElement>(
        '.team-squads-container .player-target, .team-squads-container .player-card',
      );

      playerTargets.forEach((playerTarget) => {
        const playerId = extractPlayerId(playerTarget);
        const isSelected = playerId != null && playerId === selectedPlayer?.apiPlayerId;
        const highlightTarget =
          playerTarget.matches('.player-card')
            ? playerTarget
            : ((playerTarget.closest('.player-card') as HTMLElement | null));

        playerTarget.toggleAttribute('data-smartbets-selected', isSelected);
        if (highlightTarget) {
          highlightTarget.toggleAttribute('data-smartbets-selected', isSelected);
        }
      });
    };

    applySelectedState();

    const observer = new MutationObserver(() => {
      applySelectedState();
    });

    observer.observe(scope, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [selectedPlayer]);

  useEffect(() => {
    if (!selectedPlayer) {
      return;
    }

    const section = playerDetailsSectionRef.current;
    if (!section) {
      return;
    }

    const scrollToDetails = window.setTimeout(() => {
      const scrollContainer = findScrollContainer(section);
      const sectionRect = section.getBoundingClientRect();
      let startTop = 0;
      let targetTop = 0;

      if (scrollContainer === window) {
        startTop = window.scrollY;
        targetTop = Math.max(window.scrollY + sectionRect.top - 24, 0);
      } else {
        const scrollElement = scrollContainer as HTMLElement;
        startTop = scrollElement.scrollTop;
        targetTop = Math.max(
          scrollElement.scrollTop +
            sectionRect.top -
            scrollElement.getBoundingClientRect().top -
            24,
          0,
        );
      }

      const delta = targetTop - startTop;
      const duration = 920;
      const startedAt = performance.now();

      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        const nextTop = startTop + delta * easedProgress;

        if (scrollContainer === window) {
          window.scrollTo({ top: nextTop });
        } else {
          scrollContainer.scrollTo({ top: nextTop });
        }

        if (progress < 1) {
          scrollAnimationFrameRef.current = window.requestAnimationFrame(step);
        } else {
          scrollAnimationFrameRef.current = null;
        }
      };

      scrollAnimationFrameRef.current = window.requestAnimationFrame(step);
    }, 120);

    return () => {
      window.clearTimeout(scrollToDetails);
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
    };
  }, [selectedPlayer]);

  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  if (teamLoading) {
    return <LoadingSpinner />;
  }

  if (teamError || !team) {
    return (
      <EmptyState
        title="Team not found"
        description="This team could not be loaded right now."
        action={
          <Link
            href={backHref}
            className="mt-2 inline-flex items-center rounded px-4 py-2 text-[12px] font-medium"
            style={{
              background: 'rgba(0,230,118,0.15)',
              color: '#00e676',
              border: '1px solid rgba(0,230,118,0.3)',
            }}
          >
            {backLabel}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <Link
          href={backHref}
          className="flex items-center gap-1 text-[11px] transition-colors"
          style={{ color: 'var(--t-text-5)', textDecoration: 'none' }}
        >
          {backLabel}
        </Link>
      </div>

      <div style={{ background: 'var(--t-surface)', borderBottom: '1px solid var(--t-border)' }}>
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-page-bg)' }}
        >
          {selectedLeague ? (
            <>
              <span className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                {selectedLeague.countryName}
              </span>
              <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-4)' }}>
                {selectedLeague.name}
              </span>
              <span style={{ color: 'var(--t-border-2)' }}>{'>'}</span>
            </>
          ) : null}
          <span className="text-[11px] font-medium" style={{ color: 'var(--t-text-4)' }}>
            Team details
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 px-6 py-6">
          <TeamLogo src={team.logoUrl} alt={team.name} size={72} />

          <div className="min-w-[240px] flex-1">
            <h1 className="text-[26px] font-black" style={{ color: 'var(--t-text-1)' }}>
              {team.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]" style={{ color: 'var(--t-text-4)' }}>
              {team.countryName ? <span>{team.countryName}</span> : null}
              {team.founded ? <span>Founded {team.founded}</span> : null}
              {team.venueName ? <span>{team.venueName}</span> : null}
              {team.venueCity ? <span>{team.venueCity}</span> : null}
            </div>
          </div>

          {selectedLeague ? (
            <div
              className="rounded-lg px-3 py-2 text-right"
              style={{ background: 'var(--t-page-bg)', border: '1px solid var(--t-border)' }}
            >
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-text-6)' }}>
                Context
              </div>
              <div className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
                {selectedLeague.name}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                Season {season}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section
            className="rounded-xl p-4"
            style={{
              background: 'var(--t-surface)',
              border: '1px solid var(--t-border)',
            }}
          >
            <div className="mb-3">
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--t-text-1)' }}>
                Team Widget
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
                Team statistics and squad overview from the official widget.
              </p>
            </div>

            <div ref={teamWidgetScopeRef} data-team-page-widget-scope="true">
              <ApiSportsWidget
                type="team"
                teamId={team.apiTeamId}
                teamTab="squads"
                teamSquad
                teamStatistics
                league={leagueId ?? undefined}
                season={season}
              />
            </div>
          </section>

          <div className="flex flex-col gap-5">
            {liveFixturesQuery.isLoading || (liveFixturesQuery.data?.items?.length ?? 0) > 0 ? (
              <TeamFixturesList
                title="Live now"
                description={
                  selectedLeague
                    ? `${team.name} currently has a live match in ${selectedLeague.name}.`
                    : `${team.name} currently has a live match.`
                }
                fixtures={liveFixturesQuery.data?.items ?? []}
                teamApiId={team.apiTeamId}
                emptyTitle="No live matches right now"
                emptyDescription="There is no active live fixture for this team in the selected context."
                isLoading={liveFixturesQuery.isLoading}
              />
            ) : null}

            <TeamFixturesList
              title="Last 5 matches"
              description={
                selectedLeague
                  ? `Most recent results for ${team.name} in ${selectedLeague.name}.`
                  : `Most recent results for ${team.name}.`
              }
              fixtures={recentFixturesQuery.data?.items ?? []}
              teamApiId={team.apiTeamId}
              emptyTitle="No finished matches yet"
              emptyDescription="There are no finished fixtures for this team in the selected context."
              isLoading={recentFixturesQuery.isLoading}
            />

            <TeamFixturesList
              title="Next 5 matches"
              description={
                selectedLeague
                  ? `Upcoming fixtures for ${team.name} in ${selectedLeague.name}.`
                  : `Upcoming fixtures for ${team.name}.`
              }
              fixtures={upcomingFixturesQuery.data?.items ?? []}
              teamApiId={team.apiTeamId}
              emptyTitle="No upcoming matches yet"
              emptyDescription="There are no upcoming fixtures for this team in the selected context."
              isLoading={upcomingFixturesQuery.isLoading}
            />
          </div>
        </div>

        <section ref={playerDetailsSectionRef} className="mt-5">
          <div className="grid gap-5">
            <section
              className="rounded-xl p-4"
              style={{
                background: 'var(--t-surface)',
                border: '1px solid var(--t-border)',
              }}
            >
              <div className="mb-3">
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--t-text-1)' }}>
                  {selectedPlayer?.label ? selectedPlayer.label : 'Player details'}
                </h2>
                <p className="text-[12px]" style={{ color: 'var(--t-text-5)' }}>
                  Click a player in the squad above to load statistics, trophies, and injuries here.
                </p>
              </div>
              {selectedPlayer ? (
                <ApiSportsWidget
                  key={`${selectedPlayer.apiPlayerId}-${season}-${leagueId ?? 'all'}`}
                  type="player"
                  playerId={selectedPlayer.apiPlayerId}
                  season={season}
                  league={leagueId ?? undefined}
                  playerStatistics
                  playerTrophies
                  playerInjuries
                />
              ) : (
                <div
                  className="mt-3 rounded-lg px-4 py-5 text-[12px]"
                  style={{
                    background: 'var(--t-page-bg)',
                    border: '1px dashed var(--t-border)',
                    color: 'var(--t-text-5)',
                  }}
                >
                  Select a player from the squad above to open the full player widget.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function TeamPage({ params }: Props) {
  const { teamId } = use(params);
  const parsedTeamId = Number(teamId);

  if (!Number.isFinite(parsedTeamId) || parsedTeamId <= 0) {
    return (
      <EmptyState
        title="Invalid team"
        description="This team page could not be opened."
      />
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeamPageContent teamId={parsedTeamId} />
    </Suspense>
  );
}
