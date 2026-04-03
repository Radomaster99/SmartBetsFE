import type { BestOddsDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref } from '@/lib/bookmakers';

interface Props {
  bestOdds: BestOddsDto;
  fixtureId?: number;
  movements?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
}

function minutesAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function OddsRow({
  outcome,
  odd,
  bookmaker,
  outcomeKey,
  fixtureId,
  isLast,
  movement,
}: {
  outcome: string;
  odd: number;
  bookmaker: string;
  outcomeKey: 'home' | 'draw' | 'away';
  fixtureId?: number;
  isLast: boolean;
  movement?: LiveOddsMovementDirection;
}) {
  const href = buildBookmakerHref(bookmaker, {
    fixture: fixtureId,
    outcome: outcomeKey,
    source: 'best-odds',
  });

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        position: 'relative',
        borderBottom: isLast ? undefined : '1px solid var(--t-border)',
        ...(movement === 'up'
          ? {
              background: 'rgba(0,230,118,0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(0,230,118,0.16)',
            }
          : movement === 'down'
            ? {
                background: 'rgba(239,83,80,0.08)',
                boxShadow: 'inset 0 0 0 1px rgba(239,83,80,0.12)',
              }
            : null),
      }}
    >
      {movement ? (
        <span
          aria-hidden="true"
          className="absolute right-3 top-2 text-[11px] font-bold leading-none"
          style={{ color: movement === 'up' ? 'var(--t-accent)' : '#f87171' }}
        >
          {movement === 'up' ? '\u2191' : '\u2193'}
        </span>
      ) : null}
      <span
        className="w-20 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--t-text-5)' }}
      >
        {outcome}
      </span>

      <span
        className="w-16 flex-shrink-0 text-right odds-cell text-[20px] font-black"
        style={{ color: 'var(--t-accent)' }}
      >
        {odd.toFixed(2)}
      </span>

      <span
        className="flex-1 min-w-0 truncate text-[13px] font-semibold"
        style={{ color: 'var(--t-text-2)' }}
        title={bookmaker}
      >
        {bookmaker}
      </span>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 px-4 py-1.5 rounded text-[12px] font-bold tracking-wide transition-opacity hover:opacity-90"
        style={{
          background: 'var(--t-accent)',
          color: '#000',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        BET →
      </a>
    </div>
  );
}

export function BestOddsBar({ bestOdds, fixtureId, movements }: Props) {
  // Filter out rows where the API returned null/0 for odd or bookmaker despite the DTO typing.
  // This guards against partial-data responses without crashing on .toFixed().
  const rows = [
    { outcome: 'Home Win', odd: bestOdds.bestHomeOdd, bookmaker: bestOdds.bestHomeBookmaker, outcomeKey: 'home' as const },
    { outcome: 'Draw',     odd: bestOdds.bestDrawOdd, bookmaker: bestOdds.bestDrawBookmaker, outcomeKey: 'draw' as const },
    { outcome: 'Away Win', odd: bestOdds.bestAwayOdd, bookmaker: bestOdds.bestAwayBookmaker, outcomeKey: 'away' as const },
  ].filter((row) => row.odd != null && row.odd > 0 && row.bookmaker);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--t-border)' }}>
      {rows.map((row, i) => (
        <OddsRow
          key={row.outcomeKey}
          outcome={row.outcome}
          odd={row.odd}
          bookmaker={row.bookmaker}
          outcomeKey={row.outcomeKey}
          fixtureId={fixtureId}
          isLast={i === rows.length - 1}
          movement={movements?.[row.outcomeKey]}
        />
      ))}
      <div
        className="px-4 py-2 text-right text-[11px]"
        style={{ color: 'var(--t-text-5)', background: 'var(--t-surface)', borderTop: '1px solid var(--t-border)' }}
      >
        Prices updated {minutesAgo(bestOdds.collectedAtUtc)}
      </div>
    </div>
  );
}
