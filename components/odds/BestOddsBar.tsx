import type { BestOddsDto } from '@/lib/types/api';
import type { LiveOddsMovementDirection } from '@/lib/hooks/useLiveOdds';
import { buildBookmakerHref, getBookmakerMeta } from '@/lib/bookmakers';

interface Props {
  bestOdds: BestOddsDto;
  fixtureId?: number;
  movements?: Partial<Record<'home' | 'draw' | 'away', LiveOddsMovementDirection>>;
  variant?: 'default' | 'compact';
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
      className="flex items-center gap-3 px-4 py-3.5 transition-colors"
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
        className="cta-btn flex-shrink-0 px-4 py-2 text-[12px] font-bold tracking-wide"
        style={{ textDecoration: 'none', whiteSpace: 'nowrap', borderRadius: '8px' }}
        onClick={(e) => e.stopPropagation()}
      >
        BET
      </a>
    </div>
  );
}

export function BestOddsBar({ bestOdds, fixtureId, movements, variant = 'default' }: Props) {
  const rows = [
    { outcome: 'Home Win', odd: bestOdds.bestHomeOdd, bookmaker: bestOdds.bestHomeBookmaker, outcomeKey: 'home' as const },
    { outcome: 'Draw', odd: bestOdds.bestDrawOdd, bookmaker: bestOdds.bestDrawBookmaker, outcomeKey: 'draw' as const },
    { outcome: 'Away Win', odd: bestOdds.bestAwayOdd, bookmaker: bestOdds.bestAwayBookmaker, outcomeKey: 'away' as const },
  ].filter((row) => row.odd != null && row.odd > 0);

  if (rows.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="overflow-hidden rounded-xl panel-shell">
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: '1px solid var(--t-border)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--t-text-5)' }}>
            Best 1X2
          </div>
          <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
            {rows.length} priced
          </div>
        </div>
        <div className="flex flex-col">
          {rows.map((row, i) => {
            const bookmaker = row.bookmaker ?? 'Unknown';
            const href = buildBookmakerHref(bookmaker, {
              fixture: fixtureId,
              outcome: row.outcomeKey,
              source: 'best-odds-panel',
            });
            const meta = getBookmakerMeta(bookmaker);
            const movement = movements?.[row.outcomeKey];

            return (
              <div
                key={row.outcomeKey}
                className="px-3 py-3"
                style={{ borderBottom: i === rows.length - 1 ? undefined : '1px solid var(--t-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: 'var(--t-text-5)' }}
                    >
                      {row.outcome}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="odds-cell text-[22px] font-black" style={{ color: 'var(--t-accent)' }}>
                        {row.odd!.toFixed(2)}
                      </span>
                      {movement ? (
                        <span
                          aria-hidden="true"
                          className="text-[11px] font-bold leading-none"
                          style={{ color: movement === 'up' ? 'var(--t-accent)' : '#f87171' }}
                        >
                          {movement === 'up' ? '\u2191' : '\u2193'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chrome-btn flex-shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open
                  </a>
                </div>

                <div className="mt-2.5 flex min-w-0 items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-black tracking-[0.08em]"
                    style={{ background: `${meta.accent}18`, color: meta.accent, border: `1px solid ${meta.accent}33` }}
                  >
                    {meta.logoText}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }} title={bookmaker}>
                      {bookmaker}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                      Bookmaker
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="px-3 py-2 text-right text-[10px]"
          style={{ color: 'var(--t-text-5)', background: 'var(--t-surface)', borderTop: '1px solid var(--t-border)' }}
        >
          Updated {minutesAgo(bestOdds.collectedAtUtc)}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl panel-shell">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)', background: 'rgba(255,255,255,0.02)' }}>
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
          odd={row.odd!}
          bookmaker={row.bookmaker ?? 'Unknown'}
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
