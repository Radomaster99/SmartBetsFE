'use client';

import { useMemo } from 'react';
import type { BestOddsDto, OddDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection, LiveOddsRealtimeStatus } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref, getBookmakerMeta, getBookmakerOrder } from '@/lib/bookmakers';

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
}

function minutesAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function LiveStatusPill({
  status,
  hasLiveOdds,
  usingPreMatchFallback,
}: {
  status: LiveOddsRealtimeStatus;
  hasLiveOdds: boolean;
  usingPreMatchFallback: boolean;
}) {
  let copy = 'Live odds idle';
  let styles = {
    background: 'rgba(148,163,184,0.12)',
    border: '1px solid rgba(148,163,184,0.22)',
    color: 'var(--t-text-3)',
  };

  if (usingPreMatchFallback) {
    copy = 'Pre-match fallback';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (hasLiveOdds && status === 'connected') {
    copy = 'Live odds';
    styles = {
      background: 'rgba(0,230,118,0.12)',
      border: '1px solid rgba(0,230,118,0.28)',
      color: 'var(--t-accent)',
    };
  } else if (hasLiveOdds && (status === 'connecting' || status === 'reconnecting')) {
    copy = 'Syncing…';
    styles = {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.26)',
      color: '#fbbf24',
    };
  } else if (status === 'error') {
    copy = 'Realtime unavailable';
    styles = {
      background: 'rgba(239,83,80,0.12)',
      border: '1px solid rgba(239,83,80,0.24)',
      color: '#fca5a5',
    };
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 10,
        fontWeight: 600,
        ...styles,
      }}
    >
      {hasLiveOdds && status === 'connected' && !usingPreMatchFallback && (
        <span
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--t-accent)',
            animation: 'live-pulse 1.4s ease-in-out infinite',
          }}
        />
      )}
      {copy}
    </div>
  );
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
  value: number;
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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
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
      }}
    >
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
      {value.toFixed(2)}
    </a>
  );
}

export function OddsComparison({
  bestOdds,
  odds,
  fixtureId,
  isLive,
  liveOddsRealtimeStatus,
  hasLiveOdds,
  usingPreMatchFallback,
  shouldUseLiveBookmakerView,
  bestOddsMovements,
  oddsMovements,
}: OddsComparisonProps) {
  const orderedOdds = useMemo(
    () =>
      [...odds].sort(
        (a, b) =>
          getBookmakerOrder(a.bookmaker) - getBookmakerOrder(b.bookmaker) ||
          a.bookmaker.localeCompare(b.bookmaker),
      ),
    [odds],
  );

  const maxHome = useMemo(
    () => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((o) => o.homeOdd)) : -1),
    [orderedOdds],
  );
  const maxDraw = useMemo(
    () => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((o) => o.drawOdd)) : -1),
    [orderedOdds],
  );
  const maxAway = useMemo(
    () => (orderedOdds.length > 1 ? Math.max(...orderedOdds.map((o) => o.awayOdd)) : -1),
    [orderedOdds],
  );

  if (odds.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--t-text-5)', fontSize: 12 }}>
        No odds available for this fixture.
      </div>
    );
  }

  const bestOutcomes = bestOdds
    ? [
        { key: 'home' as const, label: 'Home Win', odd: bestOdds.bestHomeOdd, bookmaker: bestOdds.bestHomeBookmaker },
        { key: 'draw' as const, label: 'Draw', odd: bestOdds.bestDrawOdd, bookmaker: bestOdds.bestDrawBookmaker },
        { key: 'away' as const, label: 'Away Win', odd: bestOdds.bestAwayOdd, bookmaker: bestOdds.bestAwayBookmaker },
      ].filter((row) => row.odd != null && row.odd > 0)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Live status pill */}
      {isLive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <LiveStatusPill
            status={liveOddsRealtimeStatus}
            hasLiveOdds={hasLiveOdds}
            usingPreMatchFallback={usingPreMatchFallback}
          />
          {usingPreMatchFallback ? (
            <div
              style={{
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 10,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.24)',
                color: '#fbbf24',
              }}
            >
              Live odds not yet available. Showing latest pre-match prices.
            </div>
          ) : null}
          {liveOddsRealtimeStatus === 'connected' && shouldUseLiveBookmakerView ? (
            <div
              style={{
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--t-border)',
                color: 'var(--t-text-4)',
              }}
            >
              Live prices flash as the provider updates the market.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Best odds 3-column header */}
      {bestOutcomes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {bestOutcomes.map((row) => {
            const href = buildBookmakerHref(row.bookmaker, {
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
                  {row.bookmaker}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      {/* Per-bookmaker slim rows */}
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
          const meta = getBookmakerMeta(odd.bookmaker);
          const generalHref = buildBookmakerHref(odd.bookmaker, {
            fixture: fixtureId ?? odd.apiFixtureId,
            source: 'odds-comparison-row',
          });
          const rowMovements = oddsMovements?.[odd.bookmaker];

          return (
            <div
              key={odd.bookmaker}
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 900,
                  textDecoration: 'none',
                  background: `${meta.accent}18`,
                  color: meta.accent,
                  border: `1px solid ${meta.accent}33`,
                }}
              >
                {meta.logoText}
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

      {/* Footer */}
      {bestOdds ? (
        <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--t-text-5)' }}>
          Prices updated {minutesAgo(bestOdds.collectedAtUtc)}
        </div>
      ) : null}
    </div>
  );
}
