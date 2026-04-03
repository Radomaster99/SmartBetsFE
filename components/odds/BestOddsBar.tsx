import type { BestOddsDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';

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
  const meta = getBookmakerMeta(bookmaker);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        position: 'relative',
        borderBottom: isLast ? undefined : '1px solid var(--t-border)',
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
      <span className="w-20 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--t-text-5)' }}>
        {outcome}
      </span>

      <span className="w-16 flex-shrink-0 text-right odds-cell text-[20px] font-black" style={{ color: 'var(--t-accent)' }}>
        {odd.toFixed(2)}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black tracking-[0.08em]"
          style={{ background: `${meta.accent}18`, color: meta.accent, border: `1px solid ${meta.accent}33` }}
        >
          {meta.logoText}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--t-text-2)' }} title={bookmaker}>
            {bookmaker}
          </div>
          <div className="mt-0.5 text-[10px]" style={{ color: 'var(--t-text-5)' }}>
            Bookmaker
          </div>
        </div>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cta-btn flex-shrink-0 rounded px-4 py-1.5 text-[12px] font-bold tracking-wide"
        style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
        onClick={(e) => e.stopPropagation()}
      >
        BET
      </a>
    </div>
  );
}

export function BestOddsBar({ bestOdds, fixtureId, movements }: Props) {
  const rows = [
    { outcome: 'Home Win', odd: bestOdds.bestHomeOdd, bookmaker: bestOdds.bestHomeBookmaker, outcomeKey: 'home' as const },
    { outcome: 'Draw', odd: bestOdds.bestDrawOdd, bookmaker: bestOdds.bestDrawBookmaker, outcomeKey: 'draw' as const },
    { outcome: 'Away Win', odd: bestOdds.bestAwayOdd, bookmaker: bestOdds.bestAwayBookmaker, outcomeKey: 'away' as const },
  ].filter((row) => row.odd != null && row.odd > 0 && row.bookmaker);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg panel-shell">
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--t-border)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--t-text-5)' }}>
          Best 1X2 prices
        </div>
        <div className="text-[11px]" style={{ color: 'var(--t-text-5)' }}>
          {rows.length} outcomes priced
        </div>
      </div>
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
      <div className="px-4 py-2 text-right text-[11px]" style={{ color: 'var(--t-text-5)', background: 'var(--t-surface)', borderTop: '1px solid var(--t-border)' }}>
        Prices updated {minutesAgo(bestOdds.collectedAtUtc)}
      </div>
    </div>
  );
}
