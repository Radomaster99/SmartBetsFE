'use client';

import type { StateBucket } from '@/lib/types/api';
import { CalendarPicker } from './CalendarPicker';

interface Props {
  state: StateBucket | 'All';
  onStateChange: (s: StateBucket | 'All') => void;
  date: string;
  onDateChange: (d: string) => void;
  showLiveFilter: boolean;
  showFinishedFilter: boolean;
  futureOnlyUpcoming: boolean;
  pastOnlyFinished: boolean;
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
  pastOnlyFinished,
}: Props) {
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
    if (pastOnlyFinished) return item.value === 'Finished';
    if (!showLiveFilter && item.value === 'Live') return false;
    if (!showFinishedFilter && item.value === 'Finished') return false;
    return true;
  });

  return (
    <div
      className="flex-shrink-0 border-b px-3 py-2 md:py-0"
      style={{
        background: 'var(--t-page-bg)',
        borderBottomColor: 'var(--t-border)',
      }}
    >
      <div className="md:hidden">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
            className="filter-hover-chip flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
            style={{
              color: 'var(--t-text-5)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
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
                className="filter-hover-chip flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all"
                data-active={active ? 'true' : 'false'}
                style={{
                  color: active ? 'var(--filter-date-active-color)' : day === today ? 'var(--t-text-3)' : 'var(--t-text-5)',
                  background: active ? 'var(--filter-date-active-bg)' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  borderRadius: '20px',
                  ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.07)',
                  ['--filter-active-hover-bg' as string]: 'rgba(255,255,255,0.16)',
                }}
              >
                {labelDate(day)}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() + 86400000)))}
            className="filter-hover-chip flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
            style={{
              color: 'var(--t-text-5)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Next day"
          >
            {'>'}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {visibleStates.map((item) => {
            const active = item.value === state;
            const isLiveBtn = item.value === 'Live';
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onStateChange(item.value)}
                className="filter-hover-chip flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                data-active={active ? 'true' : 'false'}
                style={{
                  color: active
                    ? isLiveBtn ? '#fff' : 'var(--filter-active-color)'
                    : 'var(--t-text-4)',
                  background: active
                    ? isLiveBtn ? '#ef5350' : 'var(--filter-active-bg)'
                    : 'transparent',
                  borderRadius: '20px',
                  border: active && !isLiveBtn ? '1px solid var(--filter-active-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  ['--filter-hover-bg' as string]: active && isLiveBtn ? '#f26763' : 'rgba(255,255,255,0.07)',
                  ['--filter-active-hover-bg' as string]: active && isLiveBtn ? '#f26763' : 'rgba(255,255,255,0.16)',
                }}
              >
                {item.label}
              </button>
            );
          })}

          <div className="ml-1 flex-shrink-0">
            <CalendarPicker value={date} onChange={onDateChange} />
          </div>
        </div>
      </div>

      <div
        className="hidden md:flex md:flex-shrink-0 md:items-center md:gap-0.5 md:overflow-x-auto"
        style={{ height: '44px' }}
      >
        <button
          type="button"
          onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
          className="filter-hover-chip flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
          style={{
            color: 'var(--t-text-5)',
            cursor: 'pointer',
            ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
          }}
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
              className="filter-hover-chip flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all"
              data-active={active ? 'true' : 'false'}
              style={{
                color: active ? 'var(--filter-date-active-color)' : day === today ? 'var(--t-text-3)' : 'var(--t-text-5)',
                background: active ? 'var(--filter-date-active-bg)' : 'transparent',
                fontWeight: active ? 700 : 500,
                borderRadius: '20px',
                ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.07)',
                ['--filter-active-hover-bg' as string]: 'rgba(255,255,255,0.16)',
              }}
            >
              {labelDate(day)}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() + 86400000)))}
          className="filter-hover-chip flex-shrink-0 rounded px-2 py-1 text-[12px] transition-colors"
          style={{
            color: 'var(--t-text-5)',
            cursor: 'pointer',
            ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
          }}
          aria-label="Next day"
        >
          {'>'}
        </button>

        <span className="mx-1.5 flex-shrink-0" style={{ color: 'var(--t-border-2)', userSelect: 'none' }}>
          |
        </span>

        {visibleStates.map((item) => {
          const active = item.value === state;
          const isLiveBtn = item.value === 'Live';
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onStateChange(item.value)}
              className="filter-hover-chip flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
              data-active={active ? 'true' : 'false'}
              style={{
                color: active
                  ? isLiveBtn ? '#fff' : 'var(--filter-active-color)'
                  : 'var(--t-text-4)',
                background: active
                  ? isLiveBtn ? '#ef5350' : 'var(--filter-active-bg)'
                  : 'transparent',
                borderRadius: '20px',
                border: active && !isLiveBtn ? '1px solid var(--filter-active-border)' : '1px solid transparent',
                cursor: 'pointer',
                ['--filter-hover-bg' as string]: active && isLiveBtn ? '#f26763' : 'rgba(255,255,255,0.07)',
                ['--filter-active-hover-bg' as string]: active && isLiveBtn ? '#f26763' : 'rgba(255,255,255,0.16)',
              }}
            >
              {item.label}
            </button>
          );
        })}

        <div className="flex-1" />

        <CalendarPicker value={date} onChange={onDateChange} />
      </div>
    </div>
  );
}
