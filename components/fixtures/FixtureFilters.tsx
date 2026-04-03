'use client';
import { useRef } from 'react';
import type { StateBucket } from '@/lib/types/api';

interface Props {
  state: StateBucket | 'All';
  onStateChange: (s: StateBucket | 'All') => void;
  date: string;
  onDateChange: (d: string) => void;
  showLiveFilter: boolean;
  showFinishedFilter: boolean;
  futureOnlyUpcoming: boolean;
}

const STATES: { value: StateBucket | 'All'; label: string }[] = [
  { value: 'All',      label: 'All' },
  { value: 'Live',     label: 'Live' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Finished', label: 'Finished' },
];

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

function labelDate(iso: string): string {
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  const tomorrow  = fmt(new Date(Date.now() + 86400000));
  if (iso === today)     return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow)  return 'Tomorrow';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function FixtureFilters({
  state,
  onStateChange,
  date,
  onDateChange,
  showLiveFilter,
  showFinishedFilter,
  futureOnlyUpcoming,
}: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = fmt(new Date());
  const dates = [-2, -1, 0, 1, 2].map((offset) => fmt(new Date(Date.now() + offset * 86400000)));

  const visibleStates = STATES.filter((s) => {
    if (futureOnlyUpcoming)               return s.value === 'Upcoming';
    if (!showLiveFilter     && s.value === 'Live')     return false;
    if (!showFinishedFilter && s.value === 'Finished') return false;
    return true;
  });

  return (
    <div
      className="flex items-center gap-0.5 px-3 overflow-x-auto flex-shrink-0"
      style={{
        height: '44px',
        background: 'var(--t-page-bg)',
        borderBottom: '1px solid var(--t-border)',
      }}
    >
      {/* Date navigation */}
      <button
        type="button"
        onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() - 86400000)))}
        className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
        aria-label="Previous day"
      >
        ‹
      </button>

      {dates.map((d) => {
        const active = d === date;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onDateChange(d)}
            className="px-2.5 py-1 rounded text-[12px] font-medium flex-shrink-0 transition-all"
            style={{
              color:      active ? 'var(--t-text-1)' : d === today ? 'var(--t-text-2)' : 'var(--t-text-4)',
              background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
              fontWeight: active ? 700 : 500,
            }}
          >
            {labelDate(d)}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() + 86400000)))}
        className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
        aria-label="Next day"
      >
        ›
      </button>

      {/* Separator */}
      <span className="mx-1.5 flex-shrink-0" style={{ color: 'var(--t-border-2)', userSelect: 'none' }}>|</span>

      {/* State filters */}
      {visibleStates.map((s) => {
        const active = s.value === state;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onStateChange(s.value)}
            className="px-2.5 py-1 rounded text-[12px] font-medium flex-shrink-0 transition-all"
            style={{
              color:      active ? (s.value === 'Live' ? '#fff' : 'var(--t-text-1)') : 'var(--t-text-4)',
              background: active ? (s.value === 'Live' ? '#ef5350' : 'rgba(255,255,255,0.1)') : 'transparent',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Calendar picker — hidden input triggered by button */}
      <button
        type="button"
        onClick={() => dateInputRef.current?.showPicker?.()}
        title="Pick a specific date"
        className="flex-shrink-0 px-2 py-1 rounded text-[12px] transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
      >
        📅
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
