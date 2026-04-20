'use client';

import type { StateBucket } from '@/lib/types/api';
import { CalendarPicker } from './CalendarPicker';

function ChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 4L6 8l4 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

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

function dateNumberLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit' });
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
  const canReturnToLive = date !== today;
  const dates = Array.from({ length: 7 }, (_, index) =>
    fmt(new Date(new Date(`${date}T12:00:00`).getTime() + (index - 3) * 86400000)),
  );

  const visibleStates = STATES.filter((item) => {
    if (futureOnlyUpcoming) return item.value === 'Upcoming' || item.value === 'Live';
    if (pastOnlyFinished) return item.value === 'Finished' || item.value === 'Live';
    if (!showLiveFilter && item.value === 'Live' && !canReturnToLive) return false;
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
            className="filter-hover-chip flex h-11 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold transition-colors"
            style={{
              color: 'var(--t-text-5)',
              background: '#161922',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </button>

          <div
            className="hide-scrollbar min-w-0 flex-1 overflow-x-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
            }}
          >
            <div className="flex min-w-max items-center gap-1.5">
              {dates.map((day) => {
                const active = day === date;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onDateChange(day)}
                    className="filter-hover-chip w-[64px] flex-shrink-0 rounded-xl px-1.5 py-2 text-center transition-all"
                    data-active={active ? 'true' : 'false'}
                    style={{
                      background: active ? '#1e9e6e' : '#161922',
                      color: active ? '#ffffff' : 'var(--t-text-2)',
                      border: active ? '1px solid rgba(30,158,110,0.9)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: active ? '0 8px 18px rgba(30,158,110,0.22)' : 'none',
                      ['--filter-hover-bg' as string]: active ? '#229f71' : 'rgba(255,255,255,0.08)',
                      ['--filter-active-hover-bg' as string]: active ? '#229f71' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="truncate text-[9px] font-medium leading-none"
                      style={{ color: active ? 'rgba(255,255,255,0.82)' : 'var(--t-text-5)' }}
                    >
                      {labelDate(day)}
                    </div>
                    <div className="mt-1 text-[17px] font-bold leading-none">
                      {dateNumberLabel(day)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() + 86400000)))}
            className="filter-hover-chip flex h-11 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold transition-colors"
            style={{
              color: 'var(--t-text-5)',
              background: '#161922',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Next day"
          >
            <ChevronRight />
          </button>
        </div>

        <div
          className="hide-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pb-0.5"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
        >
          {visibleStates.map((item) => {
            const active = item.value === state;
            const isLiveBtn = item.value === 'Live';
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onStateChange(item.value)}
                className="filter-hover-chip flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                data-active={active ? 'true' : 'false'}
                style={{
                  color: active ? '#ffffff' : 'var(--t-text-4)',
                  background: active ? '#1e9e6e' : 'transparent',
                  borderRadius: '999px',
                  border: active ? '1px solid rgba(30,158,110,0.95)' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  ['--filter-hover-bg' as string]: active ? '#229f71' : 'rgba(255,255,255,0.08)',
                  ['--filter-active-hover-bg' as string]: active ? '#229f71' : 'rgba(255,255,255,0.08)',
                }}
              >
                {isLiveBtn ? (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: '#ef5350',
                      boxShadow: '0 0 0 3px rgba(239,83,80,0.12)',
                      flexShrink: 0,
                    }}
                  />
                ) : null}
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="ml-0.5 flex-shrink-0">
            <CalendarPicker value={date} onChange={onDateChange} />
          </div>
        </div>
      </div>

      <div className="hidden md:block xl:hidden">
        <div className="hide-scrollbar flex items-center gap-0.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
            className="filter-hover-chip flex-shrink-0 flex items-center justify-center rounded px-2.5 py-2 min-w-[32px] transition-colors"
            style={{
              color: 'var(--t-text-5)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Previous day"
          >
            <ChevronLeft />
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
            className="filter-hover-chip flex-shrink-0 flex items-center justify-center rounded px-2.5 py-2 min-w-[32px] transition-colors"
            style={{
              color: 'var(--t-text-5)',
              cursor: 'pointer',
              ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
            }}
            aria-label="Next day"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
          </div>

          <div className="flex-shrink-0">
            <CalendarPicker value={date} onChange={onDateChange} />
          </div>
        </div>
      </div>

      <div
        className="hidden xl:flex xl:flex-shrink-0 xl:items-center xl:gap-0.5 xl:overflow-x-auto"
        style={{ height: '44px' }}
      >
        <button
          type="button"
          onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
          className="filter-hover-chip flex-shrink-0 flex items-center justify-center rounded px-2.5 py-2 min-w-[32px] transition-colors"
          style={{
            color: 'var(--t-text-5)',
            cursor: 'pointer',
            ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
          }}
          aria-label="Previous day"
        >
          <ChevronLeft />
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
          className="filter-hover-chip flex-shrink-0 flex items-center justify-center rounded px-2.5 py-2 min-w-[32px] transition-colors"
          style={{
            color: 'var(--t-text-5)',
            cursor: 'pointer',
            ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
          }}
          aria-label="Next day"
        >
          <ChevronRight />
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
