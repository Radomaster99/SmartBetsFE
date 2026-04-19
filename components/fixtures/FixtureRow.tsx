'use client';

import { memo, useEffect, useRef, useState } from 'react';
import type { BestOddsDto, FixtureDto, OddDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { buildBookmakerHref } from '@/lib/bookmakers';
import { deriveBestOddsFromOdds, sortOddsByStrength } from '@/lib/live-odds';

interface Props {
  fixture: FixtureDto;
  bestOddsFallback?: BestOddsDto | null;
  liveOddsRows?: OddDto[];
  isLiveOddsPending?: boolean;
  oddsMovement?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
  isSaved?: boolean;
  onToggleSave?: (fixture: FixtureDto) => void;
  isSelected?: boolean;
  onRowClick?: (fixture: FixtureDto) => void;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function isTodayKickoff(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function isTomorrowKickoff(iso: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(iso).toDateString() === tomorrow.toDateString();
}

function formatLiveMinute(status: string, elapsed?: number | null, statusExtra?: number | null): string {
  const s = status.toUpperCase();
  if (s === 'HT') return 'HT';
  if (s === 'BT') return 'BT';
  if (s === 'P') return 'PEN';
  if (s === 'SUSP') return 'SUSP';
  if (s === 'INT') return 'INT';
  if (elapsed != null) return statusExtra ? `${elapsed}+${statusExtra}'` : `${elapsed}'`;
  return s;
}

function resolveBookmaker(name: string | null | undefined): string | null {
  return name?.trim() || null;
}

function StatusCell({ fixture }: { fixture: FixtureDto }) {
  const { stateBucket, kickoffAt, status, elapsed, statusExtra } = fixture;

  if (stateBucket === 'Live') {
    const minute = formatLiveMinute(status ?? '', elapsed, statusExtra);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'live-pulse 1.4s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fca5a5' }}>
            LIVE
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5' }}>{minute}</span>
      </div>
    );
  }

  if (stateBucket === 'Finished') {
    return (
      <span style={{ fontSize: 9, color: 'var(--t-text-5)', fontWeight: 600 }}>Full-time</span>
    );
  }

  if (stateBucket === 'Postponed') {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>PST</span>
    );
  }

  if (stateBucket === 'Cancelled') {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t-text-5)' }}>CANC</span>
    );
  }

  // Upcoming
  const isToday = isTodayKickoff(kickoffAt);
  const isTomorrow = isTomorrowKickoff(kickoffAt);
  const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatKickoffDate(kickoffAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-3)' }}>
        {formatKickoff(kickoffAt)}
      </span>
      <span style={{ fontSize: 9, color: 'var(--t-text-5)' }}>{dateLabel}</span>
    </div>
  );
}

function OddsLoadingSnake({ radius }: { fill: string; radius: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: radius,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'rgba(148,163,184,0.13)',
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

function OddsButton({
  label,
  value,
  bookmaker,
  fixtureId,
  outcomeKey,
  movement,
  isLoading = false,
  onFallbackClick,
}: {
  label: string;
  value?: number | null;
  bookmaker?: string | null;
  fixtureId: number;
  outcomeKey: 'home' | 'draw' | 'away';
  movement?: LiveOddsMovementDirection;
  isLoading?: boolean;
  onFallbackClick: (event: React.MouseEvent) => void;
}) {
  const prevMovementRef = useRef<LiveOddsMovementDirection | undefined>(movement);
  const [flashAnimation, setFlashAnimation] = useState<string | null>(null);

  useEffect(() => {
    if (movement && movement !== prevMovementRef.current) {
      const anim = movement === 'up'
        ? 'odds-flash-up 0.6s ease-out forwards'
        : 'odds-flash-down 0.6s ease-out forwards';
      setFlashAnimation(anim);
      const timer = window.setTimeout(() => setFlashAnimation(null), 650);
      prevMovementRef.current = movement;
      return () => window.clearTimeout(timer);
    }
    prevMovementRef.current = movement;
  }, [movement]);

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 32,
    borderRadius: 6,
    border: '1px solid var(--t-border)',
    background: 'var(--t-surface-2)',
    cursor: value && bookmaker ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
    padding: 0,
    width: '100%',
    ...(flashAnimation ? { animation: flashAnimation } : {}),
  };

  const inner = (
    <>
      {isLoading && value == null ? <OddsLoadingSnake fill="rgba(0,230,118,0.06)" radius={6} /> : null}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          width: '100%',
          height: '100%',
        }}
      >
      {isLoading && value == null ? (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 8,
              borderRadius: 999,
              background: 'rgba(148,163,184,0.26)',
              animation: 'skeleton-pulse 1.2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(0,230,118,0.7)',
              lineHeight: 1,
            }}
          >
            Live
          </span>
        </>
      ) : (
        <>
      {movement ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 2,
            right: 3,
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
            color: movement === 'up' ? 'var(--t-accent)' : '#f87171',
          }}
        >
          {movement === 'up' ? '↑' : '↓'}
        </span>
      ) : null}

      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: value ? 'var(--t-text-2)' : 'var(--t-text-6)',
          lineHeight: 1,
        }}
      >
        {value ? value.toFixed(2) : '–'}
      </span>

      <span
        style={{
          fontSize: 7,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--t-text-5)',
          lineHeight: 1,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {bookmaker ?? label}
      </span>
        </>
      )}
      </span>
    </>
  );

  if (value && bookmaker) {
    const href = buildBookmakerHref(bookmaker, { fixture: fixtureId, outcome: outcomeKey, source: 'fixture-list' });
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${value.toFixed(2)} at ${bookmaker} — ${label}`}
        style={buttonStyle as React.CSSProperties}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onFallbackClick}
      aria-label={`${label} odds`}
      style={
        isLoading
          ? buttonStyle
          : { ...buttonStyle, background: 'var(--t-surface-2)', border: '1px solid var(--t-border)' }
      }
    >
      {inner}
    </button>
  );
}

export const FixtureRow = memo(function FixtureRow({
  fixture,
  bestOddsFallback,
  liveOddsRows = [],
  isLiveOddsPending = false,
  oddsMovement,
  isSaved = false,
  onToggleSave,
  isSelected = false,
  onRowClick,
}: Props) {
  const isLive = fixture.stateBucket === 'Live';
  const isFinished = fixture.stateBucket === 'Finished';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const liveSummaryIsLive = liveSummary?.source === 'live';
  const liveSummaryIsPrematch = liveSummary?.source === 'prematch';
  const sortedLiveOddsRows = sortOddsByStrength(liveOddsRows);
  const liveBestOdds = sortedLiveOddsRows.length > 0 ? deriveBestOddsFromOdds(sortedLiveOddsRows) : null;
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;
  const hideFallbackWhilePending = isLive && isLiveOddsPending && !liveBestOdds;

  // Priority:
  // 1. live bookmaker rows from any live provider
  // 2. backend list summary (live or prematch fallback)
  // 3. best-odds batch fallback for any outcome still missing
  const homeOdd = liveBestOdds
    ? liveBestOdds.bestHomeOdd
    : liveSummaryIsLive
      ? (liveSummary?.bestHomeOdd ?? null)
      : null;
  const homeBookmaker = resolveBookmaker(
    liveBestOdds
      ? liveBestOdds.bestHomeBookmaker
      : liveSummaryIsLive
        ? liveSummary?.bestHomeBookmaker
        : null,
  );
  const drawOdd = liveBestOdds
    ? liveBestOdds.bestDrawOdd
    : liveSummaryIsLive
      ? (liveSummary?.bestDrawOdd ?? null)
      : null;
  const drawBookmaker = resolveBookmaker(
    liveBestOdds
      ? liveBestOdds.bestDrawBookmaker
      : liveSummaryIsLive
        ? liveSummary?.bestDrawBookmaker
        : null,
  );
  const awayOdd = liveBestOdds
    ? liveBestOdds.bestAwayOdd
    : liveSummaryIsLive
      ? (liveSummary?.bestAwayOdd ?? null)
      : null;
  const awayBookmaker = resolveBookmaker(
    liveBestOdds
      ? liveBestOdds.bestAwayBookmaker
      : liveSummaryIsLive
        ? liveSummary?.bestAwayBookmaker
        : null,
  );
  const resolvedHomeOdd =
    homeOdd ??
    (hideFallbackWhilePending
      ? null
      : ((liveSummaryIsPrematch ? liveSummary?.bestHomeOdd ?? null : null) ?? bestOddsFallback?.bestHomeOdd ?? null));
  const resolvedHomeBookmaker =
    homeBookmaker ??
    (hideFallbackWhilePending
      ? null
      : resolveBookmaker(
          (liveSummaryIsPrematch ? liveSummary?.bestHomeBookmaker : null) ?? bestOddsFallback?.bestHomeBookmaker,
        ));
  const resolvedDrawOdd =
    drawOdd ??
    (hideFallbackWhilePending
      ? null
      : ((liveSummaryIsPrematch ? liveSummary?.bestDrawOdd ?? null : null) ?? bestOddsFallback?.bestDrawOdd ?? null));
  const resolvedDrawBookmaker =
    drawBookmaker ??
    (hideFallbackWhilePending
      ? null
      : resolveBookmaker(
          (liveSummaryIsPrematch ? liveSummary?.bestDrawBookmaker : null) ?? bestOddsFallback?.bestDrawBookmaker,
        ));
  const resolvedAwayOdd =
    awayOdd ??
    (hideFallbackWhilePending
      ? null
      : ((liveSummaryIsPrematch ? liveSummary?.bestAwayOdd ?? null : null) ?? bestOddsFallback?.bestAwayOdd ?? null));
  const resolvedAwayBookmaker =
    awayBookmaker ??
    (hideFallbackWhilePending
      ? null
      : resolveBookmaker(
          (liveSummaryIsPrematch ? liveSummary?.bestAwayBookmaker : null) ?? bestOddsFallback?.bestAwayBookmaker,
        ));

  // Score flash: detect when live score changes
  const prevScoreRef = useRef({ home: fixture.homeGoals, away: fixture.awayGoals });
  const [scoreFlashActive, setScoreFlashActive] = useState(false);

  useEffect(() => {
    const prev = prevScoreRef.current;
    if (
      fixture.stateBucket === 'Live' &&
      (prev.home !== fixture.homeGoals || prev.away !== fixture.awayGoals)
    ) {
      prevScoreRef.current = { home: fixture.homeGoals, away: fixture.awayGoals };
      setScoreFlashActive(true);
      const timer = window.setTimeout(() => setScoreFlashActive(false), 450);
      return () => window.clearTimeout(timer);
    }
    prevScoreRef.current = { home: fixture.homeGoals, away: fixture.awayGoals };
  }, [fixture.homeGoals, fixture.awayGoals, fixture.stateBucket]);

  const homeWin = hasScore && fixture.homeGoals! > fixture.awayGoals!;
  const awayWin = hasScore && fixture.awayGoals! > fixture.homeGoals!;

  const homeNameColor = isLive || !hasScore
    ? 'var(--t-text-1)'
    : homeWin
      ? 'var(--t-text-1)'
      : awayWin
        ? 'var(--t-text-4)'
        : 'var(--t-text-2)';

  const awayNameColor = isLive || !hasScore
    ? 'var(--t-text-1)'
    : awayWin
      ? 'var(--t-text-1)'
      : homeWin
        ? 'var(--t-text-4)'
        : 'var(--t-text-2)';

  const trStyle: React.CSSProperties = {
    opacity: isFinished ? 0.85 : 1,
    cursor: 'pointer',
    borderLeft: isLive
      ? '2px solid rgba(239,83,80,0.35)'
      : isSelected
        ? '2px solid rgba(0,230,118,0.4)'
        : '2px solid transparent',
    background: isLive
      ? 'rgba(239,83,80,0.03)'
      : isSelected
        ? 'rgba(0,230,118,0.04)'
        : 'transparent',
  };

  const handleRowClick = () => onRowClick?.(fixture);

  const handleOpenOdds = (event: React.MouseEvent) => {
    event.stopPropagation();
    onRowClick?.(fixture);
  };

  const handleToggleSave = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleSave?.(fixture);
  };

  return (
    <tr
      onClick={handleRowClick}
      style={trStyle}
      data-live={isLive ? 'true' : 'false'}
      data-live-fixture-id={isLive ? fixture.apiFixtureId : undefined}
      data-selected={isSelected ? 'true' : 'false'}
    >
      {/* Status column — 62px */}
      <td style={{ width: 62, padding: '8px 6px 8px 10px', verticalAlign: 'middle' }}>
        <StatusCell fixture={fixture} />
      </td>

      {/* Center: Home ←→ Score ←→ Away */}
      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Home side */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: homeWin ? 700 : 500,
                color: homeNameColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
              title={fixture.homeTeamName}
            >
              {fixture.homeTeamName}
            </span>
            <TeamLogo src={fixture.homeTeamLogoUrl} alt={fixture.homeTeamName} size={18} />
          </div>

          {/* Score / vs */}
          <div style={{ flexShrink: 0, width: 48, textAlign: 'center' }}>
            {hasScore ? (
              <span
                className={scoreFlashActive ? 'score-flash' : undefined}
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: isLive ? '#fca5a5' : 'var(--t-text-1)',
                  letterSpacing: '-0.02em',
                }}
              >
                {fixture.homeGoals} – {fixture.awayGoals}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--t-text-5)', fontWeight: 500 }}>vs</span>
            )}
          </div>

          {/* Away side */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, minWidth: 0 }}>
            <TeamLogo src={fixture.awayTeamLogoUrl} alt={fixture.awayTeamName} size={18} />
            <span
              style={{
                fontSize: 12,
                fontWeight: awayWin ? 700 : 500,
                color: awayNameColor,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
              title={fixture.awayTeamName}
            >
              {fixture.awayTeamName}
            </span>
          </div>
        </div>
      </td>

      {/* Odds column — 198px */}
      <td
        style={{ width: 198, padding: '6px 6px 6px 4px', verticalAlign: 'middle' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
          <OddsButton
            label="HOME"
            value={resolvedHomeOdd}
            bookmaker={resolvedHomeBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="home"
            movement={oddsMovement?.home}
            isLoading={hideFallbackWhilePending && resolvedHomeOdd == null}
            onFallbackClick={handleOpenOdds}
          />
          <OddsButton
            label="DRAW"
            value={resolvedDrawOdd}
            bookmaker={resolvedDrawBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="draw"
            movement={oddsMovement?.draw}
            isLoading={hideFallbackWhilePending && resolvedDrawOdd == null}
            onFallbackClick={handleOpenOdds}
          />
          <OddsButton
            label="AWAY"
            value={resolvedAwayOdd}
            bookmaker={resolvedAwayBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="away"
            movement={oddsMovement?.away}
            isLoading={hideFallbackWhilePending && resolvedAwayOdd == null}
            onFallbackClick={handleOpenOdds}
          />
        </div>
      </td>

      {/* Save column */}
      <td style={{ width: 30, padding: '6px 7px 6px 1px', verticalAlign: 'middle' }}>
        <button
          type="button"
          onClick={handleToggleSave}
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: isSaved ? '#f59e0b' : 'var(--t-text-5)',
            padding: 0,
          }}
          aria-label={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
          title={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
        >
          {isSaved ? '★' : '☆'}
        </button>
      </td>
    </tr>
  );
});
