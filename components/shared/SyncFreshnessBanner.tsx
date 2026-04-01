'use client';
import Link from 'next/link';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function SyncFreshnessBanner() {
  const season = Number(process.env.NEXT_PUBLIC_DEFAULT_SEASON || '2025');
  const { data } = useSyncStatus(season);

  if (!data) return null;

  const leagues = Array.isArray(data.leagues) ? data.leagues : [];
  const now = Date.now();
  let hasStale = false;
  let hasNever = false;

  for (const league of leagues) {
    if (!league.isActive) continue;
    if (!league.oddsLastSyncedAtUtc) {
      hasNever = true;
    } else if (now - new Date(league.oddsLastSyncedAtUtc).getTime() > SIX_HOURS_MS) {
      hasStale = true;
    }
  }

  if (!hasNever && !hasStale) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{
        background: hasNever ? 'rgba(239,83,80,0.08)' : 'rgba(245,158,11,0.08)',
        borderBottom: `1px solid ${hasNever ? 'rgba(239,83,80,0.2)' : 'rgba(245,158,11,0.2)'}`,
        color: hasNever ? '#fca5a5' : '#fcd34d',
      }}
    >
      <span>⚠</span>
      <span>{hasNever ? 'Odds have never been synced for some leagues.' : 'Odds data may be outdated (synced >6h ago).'}</span>
      <Link href="/admin/sync" className="ml-auto underline opacity-80 hover:opacity-100">
        {hasNever ? 'Go to Sync →' : 'Sync now →'}
      </Link>
    </div>
  );
}
