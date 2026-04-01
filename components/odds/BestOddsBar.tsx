import type { BestOddsDto } from '@/lib/types/api';

interface Props {
  bestOdds: BestOddsDto;
}

function OddsCard({ outcome, odd, bookmaker, isBest }: {
  outcome: string; odd: number; bookmaker: string; isBest?: boolean;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-2 p-5 rounded-lg transition-all"
      style={{
        background: isBest ? 'rgba(0,230,118,0.06)' : 'var(--t-surface)',
        border: `1px solid ${isBest ? 'var(--t-accent)' : 'var(--t-border)'}`,
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--t-text-5)' }}>
        {outcome}
      </div>
      <div className="text-4xl font-black odds-cell" style={{ color: isBest ? 'var(--t-accent)' : 'var(--t-text-2)' }}>
        {odd.toFixed(2)}
      </div>
      <div className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-3)' }}>
        {bookmaker}
      </div>
      {isBest && (
        <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--t-accent)' }}>
          Best odds
        </div>
      )}
    </div>
  );
}

export function BestOddsBar({ bestOdds }: Props) {
  const best = Math.max(bestOdds.bestHomeOdd, bestOdds.bestDrawOdd, bestOdds.bestAwayOdd);
  return (
    <div className="flex gap-3">
      <OddsCard outcome="Home Win" odd={bestOdds.bestHomeOdd} bookmaker={bestOdds.bestHomeBookmaker} isBest={bestOdds.bestHomeOdd === best} />
      <OddsCard outcome="Draw"     odd={bestOdds.bestDrawOdd} bookmaker={bestOdds.bestDrawBookmaker} isBest={bestOdds.bestDrawOdd === best} />
      <OddsCard outcome="Away Win" odd={bestOdds.bestAwayOdd} bookmaker={bestOdds.bestAwayBookmaker} isBest={bestOdds.bestAwayOdd === best} />
    </div>
  );
}
