import type { StateBucket } from '@/lib/types/api';

interface Props {
  state: StateBucket;
  status?: string;
}

export function StatusBadge({ state, status }: Props) {
  if (state === 'Live') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide animate-pulse"
        style={{ background: '#7f1d1d', color: '#fca5a5' }}
      >
        <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#fca5a5' }} />
        {status ?? 'LIVE'}
      </span>
    );
  }

  // Semantic status colors — intentionally not themed (status is status)
  const styles: Record<Exclude<StateBucket, 'Live'>, { bg: string; color: string; label: string }> = {
    Upcoming:  { bg: 'var(--t-surface-2)', color: 'var(--t-text-4)', label: 'NS' },
    Finished:  { bg: 'var(--t-surface)',   color: 'var(--t-text-5)', label: 'FT' },
    Postponed: { bg: '#3b2a00',            color: '#f59e0b',         label: 'PST' },
    Cancelled: { bg: 'var(--t-surface-2)', color: 'var(--t-text-6)', label: 'CANC' },
    Other:     { bg: 'var(--t-surface-2)', color: 'var(--t-text-5)', label: '?' },
    Unknown:   { bg: 'var(--t-surface-2)', color: 'var(--t-text-5)', label: '?' },
  };

  const s = styles[state as Exclude<StateBucket, 'Live'>] ?? styles.Other;
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
