'use client';

import { useMemo, type CSSProperties } from 'react';
import type { BestOddsDto, OddDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection, LiveOddsRealtimeStatus } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref } from '@/lib/bookmakers';
import { BookmakerAvatar } from '@/components/shared/BookmakerAvatar';
import {
  dedupeOddsByBookmaker,
  dedupeOddsByBookmakerName,
  getOddIdentityKey,
  sortOddsByStrength,
} from '@/lib/live-odds';

export interface OddsComparisonProps {
  bestOdds: BestOddsDto | null;
  odds: OddDto[];
  fixtureId?: number;
  isLive: boolean;
  liveOddsRealtimeStatus: LiveOddsRealtimeStatus;
  hasLiveOdds: boolean;
  usingPreMatchFallback: boolean;
  shouldUseLiveBookmakerView: boolean;
  bestOddsMovements?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
  oddsMovements?: Record<string, Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>>;
  hidePreMatchFallbackPill?: boolean;
  hideLiveStatusPill?: boolean;
}

function minutesAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function OddPill({
  value,
  isBest,
  movement,
  bookmaker,
  fixtureId,
  apiFixtureId,
  outcome,
}: {
  value: number | null | undefined;
  isBest: boolean;
  movement?: LiveOddsMovementDirection;
  bookmaker: string;
  fixtureId?: number;
  apiFixtureId: number;
  outcome: 'home' | 'draw' | 'away';
}) {
  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId ?? apiFixtureId,
    outcome,
    source: 'odds-comparison',
  });
  const displayValue = typeof value === 'number' && Number.isFinite(value) ? value : null;

  const commonStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 7px',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: isBest ? 700 : 500,
    textDecoration: 'none',
    minWidth: 44,
    textAlign: 'center',
    ...(isBest
      ? {
          background: 'rgba(0,230,118,0.1)',
          border: '1px solid rgba(0,230,118,0.3)',
          color: 'var(--t-accent)',
        }
      : {
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--t-border)',
          color: 'var(--t-text-3)',
        }),
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
      {displayValue != null ? displayValue.toFixed(2) : '-'}
    </>
  );

  if (displayValue == null) {
    return <span style={commonStyle}>{inner}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={commonStyle}
    >
      {inner}
    </a>
  );
}

export function OddsComparison({
  bestOdds,
  odds,
  fixtureId,
  isLive,
  bestOddsMovements,
  oddsMovements,
}: OddsComparisonProps) {
  const orderedOdds = useMemo(
    () => sortOddsByStrength(dedupeOddsByBookmakerName(dedupeOddsByBookmaker(odds))),
    [odds],
  );

  const maxHome = useMemo(
    () => (orderedOdds.length > 0 ? Math.max(...orderedOdds.map((o) => o.homeOdd)) : -1),
    [orderedOdds],
  );
  const maxDraw = useMemo(
    () => (orderedOdds.length > 0 ? Math.max(...orderedOdds.map((o) => o.drawOdd)) : -1),
    [orderedOdds],
  );
  const maxAway = useMemo(
    () => (orderedOdds.length > 0 ? Math.max(...orderedOdds.map((o) => o.awayOdd)) : -1),
    [orderedOdds],
  );

  const bestOutcomes = bestOdds
    ? [
        { key: 'home' as const, label: 'Home Win', odd: bestOdds.bestHomeOdd, bookmaker: bestOdds.bestHomeBookmaker },
        { key: 'draw' as const, label: 'Draw', odd: bestOdds.bestDrawOdd, bookmaker: bestOdds.bestDrawBookmaker },
        { key: 'away' as const, label: 'Away Win', odd: bestOdds.bestAwayOdd, bookmaker: bestOdds.bestAwayBookmaker },
      ].filter((row) => row.odd != null && row.odd > 0)
    : [];

  if (odds.length === 0 && bestOutcomes.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
        No odds available for this fixture.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bestOutcomes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {bestOutcomes.map((row) => {
            const bookmaker = row.bookmaker ?? 'Unknown';
            const href = buildBookmakerHref(bookmaker, {
              fixture: fixtureId,
              outcome: row.key,
              source: 'best-odds-header',
            });
            const movement = bestOddsMovements?.[row.key];

            return (
              <a
                key={row.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 6px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  background: 'rgba(0,230,118,0.08)',
                  border: '1px solid rgba(0,230,118,0.25)',
                  gap: 2,
                }}
              >
                {movement ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      color: movement === 'up' ? 'var(--t-accent)' : '#f87171',
                    }}
                  >
                    {movement === 'up' ? '↑' : '↓'}
                  </span>
                ) : null}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--t-text-5)',
                  }}
                >
                  {row.label}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--t-accent)', lineHeight: 1.1 }}>
                  {row.odd!.toFixed(2)}
                </span>
                <span style={{ fontSize: 9, color: 'var(--t-text-4)', textAlign: 'center' }}>
                  {bookmaker}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      {orderedOdds.length > 0 ? (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--t-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderBottom: '1px solid var(--t-border)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--t-text-5)',
              }}
            >
              All bookmakers
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['1', 'X', '2'] as const).map((label) => (
                <span
                  key={label}
                  style={{ fontSize: 9, fontWeight: 700, color: 'var(--t-text-5)', width: 44, textAlign: 'center' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {orderedOdds.map((odd, index) => {
            const oddIdentityKey = getOddIdentityKey(odd);
            const generalHref = buildBookmakerHref(odd.bookmaker, {
              fixture: fixtureId ?? odd.apiFixtureId,
              source: 'odds-comparison-row',
            });
            const rowMovements = oddsMovements?.[oddIdentityKey];

            return (
              <div
                key={oddIdentityKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderBottom: index < orderedOdds.length - 1 ? '1px solid var(--t-border)' : undefined,
                }}
              >
                <a
                  href={generalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  <BookmakerAvatar bookmakerName={odd.bookmaker} size={22} />
                </a>

                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--t-text-2)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {odd.bookmaker}
                </span>

                <div style={{ display: 'flex', gap: 4 }}>
                  <OddPill
                    value={odd.homeOdd}
                    isBest={odd.homeOdd === maxHome}
                    movement={rowMovements?.home}
                    bookmaker={odd.bookmaker}
                    fixtureId={fixtureId}
                    apiFixtureId={odd.apiFixtureId}
                    outcome="home"
                  />
                  <OddPill
                    value={odd.drawOdd}
                    isBest={odd.drawOdd === maxDraw}
                    movement={rowMovements?.draw}
                    bookmaker={odd.bookmaker}
                    fixtureId={fixtureId}
                    apiFixtureId={odd.apiFixtureId}
                    outcome="draw"
                  />
                  <OddPill
                    value={odd.awayOdd}
                    isBest={odd.awayOdd === maxAway}
                    movement={rowMovements?.away}
                    bookmaker={odd.bookmaker}
                    fixtureId={fixtureId}
                    apiFixtureId={odd.apiFixtureId}
                    outcome="away"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : bestOutcomes.length > 0 ? (
        <div
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid var(--t-border)',
            background: 'rgba(255,255,255,0.03)',
            fontSize: 11,
            color: 'var(--t-text-5)',
          }}
        >
          Detailed bookmaker rows are not available yet. Showing the best prices we could resolve for this fixture.
        </div>
      ) : null}

      {bestOdds ? (
        <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--t-text-5)' }}>
          Prices updated {minutesAgo(bestOdds.collectedAtUtc)}
        </div>
      ) : null}
    </div>
  );
}
