'use client';

import { useMemo } from 'react';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';
import { getOddIdentityKey, sortOddsByStrength } from '@/lib/live-odds';
import type { OddDto } from '@/lib/types/api';

interface Props {
  fixtureId: number;
  odds: OddDto[];
}

function InlineOddPill({
  bookmaker,
  fixtureId,
  outcome,
  label,
  value,
  isBest,
}: {
  bookmaker: string;
  fixtureId: number;
  outcome: 'home' | 'draw' | 'away';
  label: string;
  value: number;
  isBest: boolean;
}) {
  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId,
    outcome,
    source: 'fixture-live-inline',
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      style={{
        minWidth: 48,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '5px 8px',
        borderRadius: 6,
        textDecoration: 'none',
        background: isBest ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.04)',
        border: isBest ? '1px solid rgba(0,230,118,0.28)' : '1px solid var(--t-border)',
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--t-text-5)',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: isBest ? 'var(--t-accent)' : 'var(--t-text-2)',
          lineHeight: 1,
        }}
      >
        {value.toFixed(2)}
      </span>
    </a>
  );
}

export function FixtureLiveOddsTable({ fixtureId, odds }: Props) {
  const orderedOdds = useMemo(() => sortOddsByStrength(odds), [odds]);
  if (orderedOdds.length === 0) {
    return null;
  }

  const maxHome = Math.max(...orderedOdds.map((odd) => odd.homeOdd));
  const maxDraw = Math.max(...orderedOdds.map((odd) => odd.drawOdd));
  const maxAway = Math.max(...orderedOdds.map((odd) => odd.awayOdd));

  return (
    <div
      style={{
        marginLeft: 62,
        marginRight: 36,
        marginBottom: 8,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--t-border)',
        background: 'rgba(255,255,255,0.02)',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
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
          Live bookmakers
        </span>
        <span style={{ fontSize: 10, color: 'var(--t-text-5)' }}>{orderedOdds.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {orderedOdds.map((odd, index) => {
          const meta = getBookmakerMeta(odd.bookmaker);

          return (
            <div
              key={getOddIdentityKey(odd)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                borderBottom: index < orderedOdds.length - 1 ? '1px solid var(--t-border)' : undefined,
              }}
            >
              <span
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
                  background: `${meta.accent}18`,
                  color: meta.accent,
                  border: `1px solid ${meta.accent}33`,
                }}
              >
                {meta.logoText}
              </span>

              <span
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--t-text-2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={odd.bookmaker}
              >
                {odd.bookmaker}
              </span>

              <div style={{ display: 'flex', gap: 4 }}>
                <InlineOddPill
                  bookmaker={odd.bookmaker}
                  fixtureId={fixtureId}
                  outcome="home"
                  label="1"
                  value={odd.homeOdd}
                  isBest={odd.homeOdd === maxHome}
                />
                <InlineOddPill
                  bookmaker={odd.bookmaker}
                  fixtureId={fixtureId}
                  outcome="draw"
                  label="X"
                  value={odd.drawOdd}
                  isBest={odd.drawOdd === maxDraw}
                />
                <InlineOddPill
                  bookmaker={odd.bookmaker}
                  fixtureId={fixtureId}
                  outcome="away"
                  label="2"
                  value={odd.awayOdd}
                  isBest={odd.awayOdd === maxAway}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
