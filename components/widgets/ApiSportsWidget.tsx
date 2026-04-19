'use client';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useWidgets } from '@/components/widgets/widget-runtime';

interface Props {
  type: string;
  refresh?: number;
  id?: number;
  gameId?: number;
  gameTab?: string;
  compactPlayerDetails?: boolean;
  h2h?: string;
  teamId?: number;
  teamTab?: string;
  teamSquad?: boolean;
  teamStatistics?: boolean;
  targetPlayer?: string;
  playerId?: number;
  playerStatistics?: boolean;
  playerTrophies?: boolean;
  playerInjuries?: boolean;
  league?: number;
  season?: number;
  home?: number;
  away?: number;
  date?: string;
  className?: string;
}

export function ApiSportsWidget({
  type,
  refresh,
  id,
  gameId,
  gameTab,
  compactPlayerDetails = false,
  h2h,
  teamId,
  teamTab,
  teamSquad,
  teamStatistics,
  targetPlayer,
  playerId,
  playerStatistics,
  playerTrophies,
  playerInjuries,
  league,
  season,
  home,
  away,
  date,
  className,
}: Props) {
  const { hasWidgetConfig, scriptStatus } = useWidgets();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const wrapperClassName = [
    'widget-wrap',
    compactPlayerDetails ? 'widget-wrap--compact-player-details' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const isLeaguesWidget = type === 'leagues';
  const containerStyle: CSSProperties = {
    width: '100%',
    minHeight: isLeaguesWidget ? '100%' : '220px',
    height: isLeaguesWidget ? '100%' : undefined,
  };

  const shouldCompactGamePlayers = compactPlayerDetails && type === 'game';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!hasWidgetConfig) {
      setStatus('error');
      container.innerHTML = '';
      return;
    }
    if (scriptStatus !== 'ready' || !customElements.get('api-sports-widget')) {
      setStatus(scriptStatus === 'error' ? 'error' : 'loading');
      return;
    }

    let cancelled = false;
    let initTimeoutId: number | undefined;
    let observer: MutationObserver | undefined;
    let compactObserver: MutationObserver | undefined;
    let compactFrameId: number | undefined;

    const normalizeWidgetText = (value: string | null | undefined) =>
      value?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';

    const shouldHideCompactPlayerRow = (row: Element) => {
      const label = normalizeWidgetText(row.textContent);
      return (
        label.startsWith('position') ||
        label.startsWith('rating') ||
        label.startsWith('key passes') ||
        label.startsWith('pass accuracy') ||
        label.startsWith('yellow card') ||
        label.startsWith('yellow cards') ||
        label.startsWith('red card') ||
        label.startsWith('red cards')
      );
    };

    const applyCompactPlayersMode = (widget: Element) => {
      if (!shouldCompactGamePlayers) {
        return;
      }

      widget.querySelectorAll<HTMLElement>('.player-info.player-pos').forEach((element) => {
        element.style.display = 'none';
      });

      widget.querySelectorAll<HTMLElement>('.player-stats-list .info-line').forEach((row) => {
        if (shouldHideCompactPlayerRow(row)) {
          row.style.display = 'none';
        }
      });
    };

    const scheduleCompactPlayersMode = (widget: Element) => {
      if (!shouldCompactGamePlayers || compactFrameId) {
        return;
      }

      compactFrameId = window.requestAnimationFrame(() => {
        compactFrameId = undefined;
        applyCompactPlayersMode(widget);
      });
    };

    const cleanupWidget = () => {
      if (observer) {
        observer.disconnect();
        observer = undefined;
      }
      if (compactObserver) {
        compactObserver.disconnect();
        compactObserver = undefined;
      }
      if (initTimeoutId) {
        window.clearTimeout(initTimeoutId);
        initTimeoutId = undefined;
      }
      if (compactFrameId) {
        window.cancelAnimationFrame(compactFrameId);
        compactFrameId = undefined;
      }
      container.innerHTML = '';
    };

    const mountWidget = () => {
      if (cancelled || !containerRef.current) return;

      cleanupWidget();
      setStatus('loading');

      const widget = document.createElement('api-sports-widget');
      widget.setAttribute('data-type', type);

      if (refresh !== undefined) widget.setAttribute('data-refresh', String(refresh));

      if (type === 'game') {
        const resolvedGameId = gameId ?? id;
        if (resolvedGameId !== undefined) {
          widget.setAttribute('data-game-id', String(resolvedGameId));
        }
        if (gameTab !== undefined) {
          widget.setAttribute('data-game-tab', gameTab);
        }
      } else if (type === 'team') {
        const resolvedTeamId = teamId ?? id;
        if (resolvedTeamId !== undefined) {
          widget.setAttribute('data-team-id', String(resolvedTeamId));
        }
        if (teamTab !== undefined) {
          widget.setAttribute('data-team-tab', teamTab);
        }
        if (teamSquad !== undefined) {
          widget.setAttribute('data-team-squad', String(teamSquad));
        }
        if (teamStatistics !== undefined) {
          widget.setAttribute('data-team-statistics', String(teamStatistics));
        }
        if (targetPlayer !== undefined) {
          widget.setAttribute('data-target-player', targetPlayer);
        }
      } else if (type === 'player') {
        const resolvedPlayerId = playerId ?? id;
        if (resolvedPlayerId !== undefined) {
          widget.setAttribute('data-player-id', String(resolvedPlayerId));
        }
        if (playerStatistics !== undefined) {
          widget.setAttribute('data-player-statistics', String(playerStatistics));
        }
        if (playerTrophies !== undefined) {
          widget.setAttribute('data-player-trophies', String(playerTrophies));
        }
        if (playerInjuries !== undefined) {
          widget.setAttribute('data-player-injuries', String(playerInjuries));
        }
      } else if (type === 'h2h') {
        const resolvedH2h = h2h ?? (home !== undefined && away !== undefined ? `${home}-${away}` : undefined);
        if (resolvedH2h !== undefined) {
          widget.setAttribute('data-h2h', resolvedH2h);
        }
      } else if (id !== undefined) {
        widget.setAttribute('data-id', String(id));
      }

      if (league !== undefined) widget.setAttribute('data-league', String(league));
      if (season !== undefined) widget.setAttribute('data-season', String(season));
      if (date !== undefined) widget.setAttribute('data-date', date);

      widget.style.display = 'block';
      widget.style.width = '100%';
      widget.style.minHeight = isLeaguesWidget ? '100%' : '220px';

      containerRef.current.appendChild(widget);

      if (shouldCompactGamePlayers) {
        compactObserver = new MutationObserver(() => {
          scheduleCompactPlayersMode(widget);
        });
        compactObserver.observe(widget, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        scheduleCompactPlayersMode(widget);
      }

      const markReady = () => {
        if (cancelled) return;
        setStatus('ready');
        scheduleCompactPlayersMode(widget);
        if (observer) {
          observer.disconnect();
          observer = undefined;
        }
        if (initTimeoutId) {
          window.clearTimeout(initTimeoutId);
          initTimeoutId = undefined;
        }
      };

      if (widget.classList.contains('initialized')) {
        markReady();
        return;
      }

      observer = new MutationObserver(() => {
        if (widget.classList.contains('initialized')) {
          markReady();
        }
      });
      observer.observe(widget, { attributes: true, attributeFilter: ['class'] });

      initTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        if (!widget.classList.contains('initialized')) {
          setStatus('error');
        }
      }, 8000);
    };

    mountWidget();

    return () => {
      cancelled = true;
      cleanupWidget();
    };
  }, [
    type,
    refresh,
    id,
    gameId,
    gameTab,
    h2h,
    teamId,
    teamTab,
    teamSquad,
    teamStatistics,
    targetPlayer,
    playerId,
    playerStatistics,
    playerTrophies,
    playerInjuries,
    league,
    season,
    home,
    away,
    date,
    shouldCompactGamePlayers,
    isLeaguesWidget,
    hasWidgetConfig,
    scriptStatus,
  ]);

  const errorCopy = !hasWidgetConfig
    ? 'Widget configuration is missing.'
    : scriptStatus === 'error'
      ? 'Widget script failed to load.'
      : 'Widget failed to initialize.';

  return (
    <div ref={containerRef} className={wrapperClassName} style={containerStyle}>
      {status === 'error' ? (
        <div className="px-3 py-3 text-[11px]" style={{ color: 'var(--t-text-4)' }}>
          {errorCopy}
        </div>
      ) : null}
    </div>
  );
}
