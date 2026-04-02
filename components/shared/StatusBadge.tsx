import type { StateBucket } from '@/lib/types/api';

interface Props {
  state: StateBucket;
  status?: string;
}

const STATUS_LABELS: Record<string, string> = {
  TBD: 'To be decided',
  NS: 'Not started',
  '1H': 'First half',
  HT: 'Half time',
  '2H': 'Second half',
  ET: 'Extra time',
  BT: 'Break time',
  P: 'Penalties',
  INT: 'Interrupted',
  SUSP: 'Suspended',
  LIVE: 'Live',
  FT: 'Finished',
  AET: 'After extra time',
  PEN: 'Finished on penalties',
  PST: 'Postponed',
  CANC: 'Cancelled',
  ABD: 'Abandoned',
  AWD: 'Awarded',
  WO: 'Walkover',
};

export function formatFixtureStatusLabel(state: StateBucket, status?: string): string {
  const normalizedStatus = status?.trim().toUpperCase();

  if (normalizedStatus && STATUS_LABELS[normalizedStatus]) {
    return STATUS_LABELS[normalizedStatus];
  }

  switch (state) {
    case 'Upcoming':
      return 'Not started';
    case 'Live':
      return 'Live';
    case 'Finished':
      return 'Finished';
    case 'Postponed':
      return 'Postponed';
    case 'Cancelled':
      return 'Cancelled';
    case 'Other':
      return 'Other';
    case 'Unknown':
    default:
      return 'Unknown';
  }
}

export function StatusBadge({ state, status }: Props) {
  const label = formatFixtureStatusLabel(state, status);

  if (state === 'Live') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide animate-pulse"
        style={{ background: '#7f1d1d', color: '#fca5a5' }}
      >
        <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#fca5a5' }} />
        {label}
      </span>
    );
  }

  const styles: Record<Exclude<StateBucket, 'Live'>, { bg: string; color: string }> = {
    Upcoming: { bg: 'var(--t-surface-2)', color: 'var(--t-text-4)' },
    Finished: { bg: 'var(--t-surface)', color: 'var(--t-text-5)' },
    Postponed: { bg: '#3b2a00', color: '#f59e0b' },
    Cancelled: { bg: 'var(--t-surface-2)', color: 'var(--t-text-6)' },
    Other: { bg: 'var(--t-surface-2)', color: 'var(--t-text-5)' },
    Unknown: { bg: 'var(--t-surface-2)', color: 'var(--t-text-5)' },
  };

  const resolvedStyle = styles[state as Exclude<StateBucket, 'Live'>] ?? styles.Other;

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
      style={{ background: resolvedStyle.bg, color: resolvedStyle.color }}
    >
      {label}
    </span>
  );
}
