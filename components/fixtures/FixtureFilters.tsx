'use client';
import type { StateBucket } from '@/lib/types/api';
type UpcomingScope = 'today' | 'all';

interface Props {
  state: StateBucket | 'All';
  onStateChange: (s: StateBucket | 'All') => void;
  date: string;
  onDateChange: (d: string) => void;
  showLiveFilter: boolean;
  showFinishedFilter: boolean;
  futureOnlyUpcoming: boolean;
  showUpcomingScopeToggle?: boolean;
  upcomingScope?: UpcomingScope;
  onUpcomingScopeChange?: (scope: UpcomingScope) => void;
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
  showUpcomingScopeToggle = false,
  upcomingScope = 'today',
  onUpcomingScopeChange,
}: Props) {
  const today = fmt(new Date());
  const dates = [-2, -1, 0, 1, 2].map((offset) => fmt(new Date(Date.now() + offset * 86400000)));
  const visibleStates = STATES.filter((currentState) => {
    if (futureOnlyUpcoming) {
      return currentState.value === 'Upcoming';
    }

    if (!showLiveFilter && currentState.value === 'Live') {
      return false;
    }

    if (!showFinishedFilter && currentState.value === 'Finished') {
      return false;
    }

    return true;
  });

  return (
    <div style={{ borderBottom: '1px solid var(--t-border)' }}>
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto"
        style={{ background: 'var(--t-page-bg)', borderBottom: '1px solid var(--t-border)' }}
      >
        <button
          type="button"
          onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() - 86400000)))}
          className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
          style={{ color: 'var(--t-text-5)' }}
        >
          &lt;
        </button>

        {dates.map((currentDate) => {
          const active = currentDate === date;

          return (
            <button
              key={currentDate}
              type="button"
              onClick={() => onDateChange(currentDate)}
              className="px-3 py-1.5 rounded text-[12px] font-medium flex-shrink-0 transition-all"
              style={{
                color: active ? '#000' : currentDate === today ? 'var(--t-text-2)' : 'var(--t-text-4)',
                background: active ? 'var(--t-accent)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {labelDate(currentDate)}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onDateChange(fmt(new Date(new Date(date).getTime() + 86400000)))}
          className="px-2 py-1 rounded text-[12px] flex-shrink-0 transition-colors"
          style={{ color: 'var(--t-text-5)' }}
        >
          &gt;
        </button>

        <div className="flex-1" />
        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="text-[12px] rounded px-2 py-1 outline-none"
          style={{
            background: 'var(--t-surface-2)',
            border: '1px solid var(--t-border-2)',
            color: 'var(--t-text-2)',
          }}
        />
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5" style={{ background: 'var(--t-surface)' }}>
        {visibleStates.map((currentState) => {
          const active = currentState.value === state;

          return (
            <button
              key={currentState.value}
              type="button"
              onClick={() => onStateChange(currentState.value)}
              className="px-3 py-1 rounded text-[12px] font-medium transition-all"
              style={{
                color: active ? (currentState.value === 'Live' ? '#fff' : '#000') : 'var(--t-text-4)',
                background: active ? (currentState.value === 'Live' ? '#ef5350' : 'var(--t-accent)') : 'transparent',
              }}
            >
              {currentState.label}
            </button>
          );
        })}

        {showUpcomingScopeToggle ? (
          <div
            className="ml-auto inline-flex items-center rounded-md p-0.5"
            style={{ background: 'var(--t-surface-2)', border: '1px solid var(--t-border-2)' }}
          >
            {[
              { value: 'today' as const, label: 'Today' },
              { value: 'all' as const, label: 'All upcoming' },
            ].map((option) => {
              const active = upcomingScope === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpcomingScopeChange?.(option.value)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                  style={{
                    color: active ? '#000' : 'var(--t-text-4)',
                    background: active ? 'var(--t-accent)' : 'transparent',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
