import type { BestOddsDto } from '@/lib/types/api';

interface Props {
  bestOdds: BestOddsDto;
}

function OddsCard({
  outcome,
  odd,
  bookmaker,
  isBest,
}: {
  outcome: string;
  odd: number;
  bookmaker: string;
  isBest?: boolean;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-3 p-5 rounded-lg text-center transition-colors"
      style={{
        background: 'var(--t-surface)',
        border: `1px solid ${isBest ? 'var(--t-border-2)' : 'var(--t-border)'}`,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-text-5)' }}>
        {outcome}
      </div>

      <div className="text-4xl font-black odds-cell" style={{ color: 'var(--t-text-2)' }}>
        {odd.toFixed(2)}
      </div>

      <div className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--t-text-5)' }}>
        Best available at
      </div>

      <button
        type="button"
        title="Bookmaker links coming soon"
        className="rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors"
        style={{
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.22)',
          color: 'var(--t-accent)',
          cursor: 'pointer',
        }}
        aria-label={`Open bookmaker ${bookmaker} for ${outcome}`}
      >
        {bookmaker}
      </button>
    </div>
  );
}

export function BestOddsBar({ bestOdds }: Props) {
  const best = Math.max(bestOdds.bestHomeOdd, bestOdds.bestDrawOdd, bestOdds.bestAwayOdd);

  return (
    <div className="flex gap-3">
      <OddsCard
        outcome="Home Win"
        odd={bestOdds.bestHomeOdd}
        bookmaker={bestOdds.bestHomeBookmaker}
        isBest={bestOdds.bestHomeOdd === best}
      />
      <OddsCard
        outcome="Draw"
        odd={bestOdds.bestDrawOdd}
        bookmaker={bestOdds.bestDrawBookmaker}
        isBest={bestOdds.bestDrawOdd === best}
      />
      <OddsCard
        outcome="Away Win"
        odd={bestOdds.bestAwayOdd}
        bookmaker={bestOdds.bestAwayBookmaker}
        isBest={bestOdds.bestAwayOdd === best}
      />
    </div>
  );
}
