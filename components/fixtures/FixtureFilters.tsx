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
  { value: 'All', label: 'All' },
  { value: 'Live', label: 'Live' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Finished', label: 'Finished' },
];

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

function labelDate(iso: string): string {
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  const tomorrow = fmt(new Date(Date.now() + 86400000));
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow) return 'Tomorrow';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
  const selectedDate = new Date(`${date}T12:00:00`);
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  const tomorrow = fmt(new Date(Date.now() + 86400000));
  const leftDefault = fmt(new Date(Date.now() - 2 * 86400000));
  const rightDefault = fmt(new Date(Date.now() + 2 * 86400000));

  const dates = [
    date < yesterday ? date : leftDefault,
    yesterday,
    today,
    tomorrow,
    date > tomorrow ? date : rightDefault,
  ];

  const visibleStates = STATES.filter((item) => {
    if (futureOnlyUpcoming) return item.value === 'Upcoming';
    if (!showLiveFilter && item.value === 'Live') return false;
    if (!showFinishedFilter && item.value === 'Finished') return false;
    return true;
  });

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    try {
      input.showPicker?.();
    } catch {
      input.focus();
      input.click();
    }
  };

  return (
    <div
      className="flex flex-shrink-0 items-center gap-0.5 overflow-x-auto px-3"
      style={{
        height: '44px',
        background: 'var(--t-page-bg)',
        borderBottom: '1px solid var(--t-border)',
      }}
    >
      <button
        type="button"
        onClick={() => onDateChange(fmt(new Date(selectedDate.getTime() - 86400000)))}
        className="flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
        aria-label="Previous day"
      >
        {'<'}
      </button>

      {dates.map((day) => {
        const active = day === date;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onDateChange(day)}
            className="flex-shrink-0 rounded px-2.5 py-1 text-[12px] font-medium transition-all"
            style={{
              color: active ? 'var(--t-text-1)' : day === today ? 'var(--t-text-2)' : 'var(--t-text-4)',
              background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
              fontWeight: active ? 700 : 500,
            }}
          >
            {labelDate(day)}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onDateChange(fmt(new Date(selectedDate.getTime() + 86400000)))}
        className="flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
        aria-label="Next day"
      >
        {'>'}
      </button>

      <span className="mx-1.5 flex-shrink-0" style={{ color: 'var(--t-border-2)', userSelect: 'none' }}>
        |
      </span>

      {visibleStates.map((item) => {
        const active = item.value === state;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onStateChange(item.value)}
            className="flex-shrink-0 rounded px-2.5 py-1 text-[12px] font-medium transition-all"
            style={{
              color: active ? (item.value === 'Live' ? '#fff' : 'var(--t-text-1)') : 'var(--t-text-4)',
              background: active ? (item.value === 'Live' ? '#ef5350' : 'rgba(255,255,255,0.1)') : 'transparent',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        onClick={openDatePicker}
        title="Pick a specific date"
        className="flex-shrink-0 rounded px-2 py-1 text-[11px] font-semibold tracking-[0.12em] transition-colors"
        style={{ color: 'var(--t-text-5)', cursor: 'pointer' }}
      >
        CAL
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
