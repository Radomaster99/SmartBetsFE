'use client';

import { useEffect, useRef, useState } from 'react';
import type { BestOddsDto, FixtureDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { TeamLogo } from '@/components/shared/TeamLogo';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  fixture: FixtureDto;
  bestOddsFallback?: BestOddsDto | null;
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

function OddsButton({
  label,
  value,
  bookmaker,
  fixtureId,
  outcomeKey,
  movement,
  isBest,
  onFallbackClick,
}: {
  label: string;
  value?: number | null;
  bookmaker?: string | null;
  fixtureId: number;
  outcomeKey: 'home' | 'draw' | 'away';
  movement?: LiveOddsMovementDirection;
  isBest: boolean;
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
    border: isBest ? '1px solid rgba(0,230,118,0.35)' : '1px solid var(--t-border)',
    background: isBest ? 'rgba(0,230,118,0.1)' : 'var(--t-surface-2)',
    cursor: value && bookmaker ? 'pointer' : 'default',
    position: 'relative',
    textDecoration: 'none',
    padding: 0,
    width: '100%',
    ...(flashAnimation ? { animation: flashAnimation } : {}),
  };

  const inner = (
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
          color: isBest ? 'var(--t-accent)' : value ? 'var(--t-text-2)' : 'var(--t-text-6)',
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
          color: isBest ? 'rgba(0,230,118,0.7)' : 'var(--t-text-5)',
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
      style={{ ...buttonStyle, background: 'var(--t-surface-2)', border: '1px solid var(--t-border)' }}
    >
      {inner}
    </button>
  );
}

export function FixtureRow({
  fixture,
  bestOddsFallback,
  oddsMovement,
  isSaved = false,
  onToggleSave,
  isSelected = false,
  onRowClick,
}: Props) {
  const isLive = fixture.stateBucket === 'Live';
  const isFinished = fixture.stateBucket === 'Finished';
  const liveSummary = fixture.liveOddsSummary ?? null;
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;

  // For live fixtures: use any summary (live or prematch fallback).
  // For non-live fixtures: use summary or bestOddsFallback.
  const hasSummary = liveSummary !== null;
  const usePreMatch = !isLive;

  const homeOdd = hasSummary
    ? (liveSummary?.bestHomeOdd ?? null)
    : usePreMatch
      ? (bestOddsFallback?.bestHomeOdd ?? null)
      : null;
  const homeBookmaker = resolveBookmaker(
    hasSummary
      ? liveSummary?.bestHomeBookmaker
      : usePreMatch
        ? bestOddsFallback?.bestHomeBookmaker
        : null,
  );
  const drawOdd = hasSummary
    ? (liveSummary?.bestDrawOdd ?? null)
    : usePreMatch
      ? (bestOddsFallback?.bestDrawOdd ?? null)
      : null;
  const drawBookmaker = resolveBookmaker(
    hasSummary
      ? liveSummary?.bestDrawBookmaker
      : usePreMatch
        ? bestOddsFallback?.bestDrawBookmaker
        : null,
  );
  const awayOdd = hasSummary
    ? (liveSummary?.bestAwayOdd ?? null)
    : usePreMatch
      ? (bestOddsFallback?.bestAwayOdd ?? null)
      : null;
  const awayBookmaker = resolveBookmaker(
    hasSummary
      ? liveSummary?.bestAwayBookmaker
      : usePreMatch
        ? bestOddsFallback?.bestAwayBookmaker
        : null,
  );

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

  // Highest value among the three = loosest market (gets green highlight)
  const allOdds = [homeOdd, drawOdd, awayOdd].filter((o): o is number => o !== null);
  const bestOddValue = allOdds.length > 0 ? Math.max(...allOdds) : null;

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
    <tr onClick={handleRowClick} style={trStyle} data-live={isLive ? 'true' : 'false'} data-selected={isSelected ? 'true' : 'false'}>
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
            value={homeOdd}
            bookmaker={homeBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="home"
            movement={oddsMovement?.home}
            isBest={bestOddValue !== null && homeOdd === bestOddValue}
            onFallbackClick={handleOpenOdds}
          />
          <OddsButton
            label="DRAW"
            value={drawOdd}
            bookmaker={drawBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="draw"
            movement={oddsMovement?.draw}
            isBest={bestOddValue !== null && drawOdd === bestOddValue}
            onFallbackClick={handleOpenOdds}
          />
          <OddsButton
            label="AWAY"
            value={awayOdd}
            bookmaker={awayBookmaker}
            fixtureId={fixture.apiFixtureId}
            outcomeKey="away"
            movement={oddsMovement?.away}
            isBest={bestOddValue !== null && awayOdd === bestOddValue}
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
}
