'use client';
import { use, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFixtureDetail } from '@/lib/hooks/useFixtureDetail';
import { useOdds, useBestOdds } from '@/lib/hooks/useOdds';
import { FixtureDetailHeader, type SelectedFixtureTeam } from '@/components/fixtures/FixtureDetailHeader';
import { OddsTable } from '@/components/odds/OddsTable';
import { BestOddsBar } from '@/components/odds/BestOddsBar';
import { ApiSportsWidget } from '@/components/widgets/ApiSportsWidget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';

type Tab = 'odds' | 'match' | 'h2h' | 'team';

interface Props {
  params: Promise<{ fixtureId: string }>;
}

interface SelectedPlayer {
  apiPlayerId: number;
  label: string | null;
}

const LAST_MATCHES_HREF_KEY = 'smartbets:last-matches-href';

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--t-text-5)' }}>
      {children}
    </span>
  );
}

function WidgetCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}
    >
      {children}
    </div>
  );
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

function resolveInitialTab(tab: string | null): Tab {
  if (tab === 'odds' || tab === 'h2h' || tab === 'match') {
    return tab;
  }

  // Default to odds so bettors land on the comparison surface first.
  return 'odds';
}

export default function FixtureDetailPage({ params }: Props) {
  const { fixtureId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = resolveInitialTab(searchParams.get('tab'));
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedTeam, setSelectedTeam] = useState<SelectedFixtureTeam | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const teamWidgetScopeRef = useRef<HTMLDivElement>(null);
  const playerDetailsSectionRef = useRef<HTMLElement>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  const { data: detail, isLoading, isError } = useFixtureDetail(fixtureId);
  const { data: odds } = useOdds(fixtureId);
  const { data: bestOdds } = useBestOdds(fixtureId);

  useEffect(() => {
    if (initialTab !== 'team') {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY)) {
      window.sessionStorage.setItem(LAST_MATCHES_HREF_KEY, '/football');
    }
  }, []);

  const handleBackToMatches = () => {
    if (typeof window === 'undefined') {
      router.push('/football');
      return;
    }

    const savedHref = window.sessionStorage.getItem(LAST_MATCHES_HREF_KEY);
    if (savedHref?.startsWith('/football')) {
      router.push(savedHref);
      return;
    }

    router.push('/football');
  };

  const handleTeamSelect = (team: SelectedFixtureTeam) => {
    setSelectedTeam((current) => {
      if (current?.side === team.side && current.apiTeamId === team.apiTeamId) {
        setTab('match');
        setSelectedPlayer(null);
        return null;
      }

      setTab('team');
      setSelectedPlayer(null);
      return team;
    });
  };

  useEffect(() => {
    const scope = teamWidgetScopeRef.current;
    if (!scope || tab !== 'team' || !selectedTeam) {
      return;
    }

    const handlePlayerClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const playerTarget = target?.closest('.player-target[data-id]') as HTMLElement | null;

      if (!playerTarget) {
        return;
      }

      const rawPlayerId = playerTarget.getAttribute('data-id');
      const apiPlayerId = Number(rawPlayerId);

      if (!Number.isFinite(apiPlayerId)) {
        return;
      }

      const nextPlayer: SelectedPlayer = {
        apiPlayerId,
        label: resolvePlayerLabel(playerTarget),
      };

      setSelectedPlayer((current) => {
        if (current?.apiPlayerId === nextPlayer.apiPlayerId) {
          return null;
        }

        return nextPlayer;
      });
    };

    scope.addEventListener('click', handlePlayerClick);

    return () => {
      scope.removeEventListener('click', handlePlayerClick);
    };
  }, [selectedTeam, tab]);

  useEffect(() => {
    const scope = teamWidgetScopeRef.current;
    if (!scope) {
      return;
    }

    const applySelectedState = () => {
      const playerTargets = scope.querySelectorAll<HTMLElement>('.player-target[data-id]');

      playerTargets.forEach((playerTarget) => {
        const isSelected = Number(playerTarget.getAttribute('data-id')) === selectedPlayer?.apiPlayerId;
        const highlightTarget = playerTarget.closest('.player-card') as HTMLElement | null;

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
  }, [selectedPlayer, selectedTeam, tab]);

  useEffect(() => {
    if (!selectedPlayer || tab !== 'team') {
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
  }, [selectedPlayer, tab]);

  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !detail) {
    return (
      <EmptyState
        title="Fixture not found"
        description="This fixture may not exist or the data is unavailable."
        action={
          <button
            type="button"
            onClick={handleBackToMatches}
            className="mt-2 inline-flex items-center px-4 py-2 rounded text-[12px] font-medium"
            style={{
              background: 'rgba(0,230,118,0.15)',
              color: '#00e676',
              border: '1px solid rgba(0,230,118,0.3)',
              cursor: 'pointer',
            }}
          >
            Back to matches
          </button>
        }
      />
    );
  }

  const isLive = detail.fixture.stateBucket === 'Live';
  const resolvedBestOdds = detail.bestOdds ?? bestOdds ?? null;
  const hasAnyOdds = Boolean(resolvedBestOdds) || Boolean(odds?.length);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'odds', label: 'Odds' },
    { id: 'match', label: 'Match' },
    { id: 'h2h', label: 'H2H' },
    ...(selectedTeam ? [{ id: 'team' as const, label: selectedTeam.name }] : []),
  ];

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleBackToMatches}
          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors bg-transparent border-0 cursor-pointer"
          style={{ color: 'var(--t-text-3)' }}
        >
          <span aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>
            &lt;
          </span>
          <span>Matches</span>
        </button>
      </div>

      <FixtureDetailHeader
        detail={detail}
        selectedTeamSide={selectedTeam?.side ?? null}
        onTeamSelect={handleTeamSelect}
      />

      <div
        className="flex items-center"
        style={{ borderBottom: '1px solid var(--t-border)', background: 'var(--t-topbar-bg)' }}
      >
        {tabs.map((currentTab) => (
          <button
            key={currentTab.id}
            onClick={() => setTab(currentTab.id)}
            className="px-5 py-3 text-[13px] font-medium transition-colors flex-shrink-0"
            style={{
              color: tab === currentTab.id ? 'var(--t-text-1)' : 'var(--t-text-4)',
              borderBottom: tab === currentTab.id ? '2px solid var(--t-accent)' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {currentTab.label}
          </button>
        ))}
        {detail.oddsLastSyncedAtUtc && (
          <span className="ml-auto pr-4 text-[11px] flex-shrink-0" style={{ color: 'var(--t-text-5)' }}>
            {(() => {
              const mins = Math.floor((Date.now() - new Date(detail.oddsLastSyncedAtUtc).getTime()) / 60000);
              return mins < 1 ? 'Odds: just now' : mins < 60 ? `Odds: ${mins}m ago` : `Odds: ${Math.floor(mins / 60)}h ago`;
            })()}
          </span>
        )}
      </div>

      <div className="p-4">
        {tab === 'match' && (
          <WidgetCard>
            <ApiSportsWidget
              type="game"
              gameId={detail.fixture.apiFixtureId}
              gameTab="events"
              refresh={isLive ? 120 : undefined}
            />
          </WidgetCard>
        )}

        {tab === 'h2h' && (
          <WidgetCard>
            <ApiSportsWidget
              type="h2h"
              h2h={`${detail.fixture.homeTeamApiId}-${detail.fixture.awayTeamApiId}`}
            />
          </WidgetCard>
        )}

        {tab === 'odds' &&
          (hasAnyOdds ? (
            <div className="flex flex-col gap-5">
              {resolvedBestOdds ? (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Best Odds</SectionLabel>
                  <BestOddsBar bestOdds={resolvedBestOdds} fixtureId={detail.fixture.apiFixtureId} />
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <SectionLabel>All Bookmakers</SectionLabel>
                <OddsTable odds={odds ?? []} fixtureId={detail.fixture.apiFixtureId} />
              </div>
            </div>
          ) : (
            <EmptyState title="No odds available" description="No bookmaker odds are available for this fixture." />
          ))}

        {tab === 'team' &&
          (selectedTeam ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-bold" style={{ color: 'var(--t-text-1)' }}>
                    {selectedTeam.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('match')}
                  className="px-3 py-1.5 rounded text-[11px] font-medium"
                  style={{
                    background: 'var(--t-surface)',
                    border: '1px solid var(--t-border)',
                    color: 'var(--t-text-3)',
                    cursor: 'pointer',
                  }}
                >
                  Back to match
                </button>
              </div>

              <WidgetCard>
                <div ref={teamWidgetScopeRef}>
                  <ApiSportsWidget
                    type="team"
                    teamId={selectedTeam.apiTeamId}
                    teamTab="squads"
                    teamSquad
                    teamStatistics
                    league={detail.fixture.leagueApiId}
                    season={detail.fixture.season}
                  />
                </div>
              </WidgetCard>

              <section
                ref={playerDetailsSectionRef}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                }}
              >
                <div className="mb-3">
                  <SectionLabel>{selectedPlayer?.label ? selectedPlayer.label : 'Player Details'}</SectionLabel>
                </div>

                {selectedPlayer ? (
                  <WidgetCard>
                    <ApiSportsWidget
                      key={`${selectedPlayer.apiPlayerId}-${detail.fixture.season}`}
                      type="player"
                      playerId={selectedPlayer.apiPlayerId}
                      season={detail.fixture.season}
                      league={detail.fixture.leagueApiId}
                      playerStatistics
                      playerTrophies
                      playerInjuries
                    />
                  </WidgetCard>
                ) : (
                  <div
                    className="min-h-[120px] rounded-lg px-4 py-5 text-[12px]"
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
          ) : (
            <EmptyState title="Select a team" description="Click one of the teams in the match header to open the team widget." />
          ))}
      </div>
    </div>
  );
}
