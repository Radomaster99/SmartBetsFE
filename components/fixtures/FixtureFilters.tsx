'use client';
import type { StateBucket } from '@/lib/types/api';

interface Props {
  state: StateBucket | 'All';
  onStateChange: (s: StateBucket | 'All') => void;
  date: string;
  onDateChange: (d: string) => void;
}

const STATES: { value: StateBucket | 'All'; label: string }[] = [
  { value: 'All',      label: 'All' },
  { value: 'Live',     label: '🔴 Live' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Finished', label: 'Finished' },
];

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function labelDate(iso: string): string {
  const today     = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  const tomorrow  = fmt(new Date(Date.now() + 86400000));
  if (iso === today)     return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow)  return 'Tomorrow';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function FixtureFilters({ state, onStateChange, date, onDateChange }: Props) {
  const today = fmt(new Date());
  const dates = [-2, -1, 0, 1, 2].map((n) => fmt(new Date(Date.now() + n * 86400000)));

  return (
    <div style={{ borderBottom: '1px solid var(--t-border)' }}>
      {/* Date strip */}
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto"
        style={{ background: 'var(--t-page-bg)', borderBottom: '1px solid var(--t-border)' }}
      >
        <button onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() - 86400000)))}
          className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
          style={{ color: 'var(--t-text-5)' }}>‹</button>

        {dates.map((d) => {
          const active = d === date;
          return (
            <button
              key={d}
              onClick={() => onDateChange(d)}
              className="px-3 py-1.5 rounded text-[12px] font-medium flex-shrink-0 transition-all"
              style={{
                color:      active ? '#000' : d === today ? 'var(--t-text-2)' : 'var(--t-text-4)',
                background: active ? 'var(--t-accent)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {labelDate(d)}
            </button>
          );
        })}

        <button onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() + 86400000)))}
          className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
          style={{ color: 'var(--t-text-5)' }}>›</button>

        <div className="flex-1" />
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-[12px] rounded px-2 py-1 outline-none"
          style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)', color: 'var(--t-text-2)' }}
        />
      </div>

      {/* State filter */}
      <div className="flex items-center gap-1 px-3 py-1.5" style={{ background: 'var(--t-surface)' }}>
        {STATES.map((s) => {
          const active = s.value === state;
          return (
            <button
              key={s.value}
              onClick={() => onStateChange(s.value)}
              className="px-3 py-1 rounded text-[12px] font-medium transition-all"
              style={{
                color:      active ? (s.value === 'Live' ? '#fff' : '#000') : 'var(--t-text-4)',
                background: active ? (s.value === 'Live' ? '#ef5350' : 'var(--t-accent)') : 'transparent',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
