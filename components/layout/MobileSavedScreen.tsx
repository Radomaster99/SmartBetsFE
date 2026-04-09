'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useFixtureWatchlist, type WatchlistFixtureEntry } from '@/lib/hooks/useFixtureWatchlist';

function formatKickoff(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function StatusBadge({ entry }: { entry: WatchlistFixtureEntry }) {
  if (entry.stateBucket === 'Live') {
    const minute =
      entry.elapsed != null
        ? entry.statusExtra
          ? `${entry.elapsed}+${entry.statusExtra}'`
          : `${entry.elapsed}'`
        : 'LIVE';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'live-pulse 1.4s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5' }}>{minute}</span>
      </div>
    );
  }

  if (entry.stateBucket === 'Finished') {
    return <span style={{ fontSize: 10, color: 'var(--t-text-5)', fontWeight: 600 }}>FT</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text-3)' }}>
        {formatKickoff(entry.kickoffAt)}
      </span>
      <span style={{ fontSize: 9, color: 'var(--t-text-5)' }}>{formatDate(entry.kickoffAt)}</span>
    </div>
  );
}

function TeamLogoCircle({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--t-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          color: 'var(--t-text-5)',
          flexShrink: 0,
        }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={20}
      height={20}
      style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }}
    />
  );
}

function SavedCard({ entry, onClose }: { entry: WatchlistFixtureEntry; onClose: () => void }) {
  const homeGoals = entry.homeGoals;
  const awayGoals = entry.awayGoals;
  const showScore = entry.stateBucket === 'Live' || entry.stateBucket === 'Finished';
  const isLive = entry.stateBucket === 'Live';

  return (
    <Link
      href={`/football/fixtures/${entry.apiFixtureId}`}
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        textDecoration: 'none',
        borderBottom: '1px solid var(--t-border)',
        borderLeft: isLive ? '2px solid rgba(239,83,80,0.4)' : '2px solid transparent',
        background: isLive ? 'rgba(239,83,80,0.03)' : 'transparent',
      }}
    >
      <div style={{ width: 44, flexShrink: 0 }}>
        <StatusBadge entry={entry} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TeamLogoCircle src={entry.homeTeamLogoUrl} alt={entry.homeTeamName ?? 'Home'} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color:
                showScore && homeGoals != null && awayGoals != null && homeGoals > awayGoals
                  ? 'var(--t-text-1)'
                  : 'var(--t-text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.homeTeamName ?? 'Home'}
          </span>
          {showScore && homeGoals != null ? (
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--t-text-1)', marginLeft: 'auto', flexShrink: 0 }}>
              {homeGoals}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TeamLogoCircle src={entry.awayTeamLogoUrl} alt={entry.awayTeamName ?? 'Away'} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color:
                showScore && homeGoals != null && awayGoals != null && awayGoals > homeGoals
                  ? 'var(--t-text-1)'
                  : 'var(--t-text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.awayTeamName ?? 'Away'}
          </span>
          {showScore && awayGoals != null ? (
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--t-text-1)', marginLeft: 'auto', flexShrink: 0 }}>
              {awayGoals}
            </span>
          ) : null}
        </div>
        {entry.leagueName ? (
          <span style={{ fontSize: 10, color: 'var(--t-text-5)' }}>{entry.leagueName}</span>
        ) : null}
      </div>
    </Link>
  );
}

export function MobileSavedScreen({ onClose }: { onClose: () => void }) {
  const { entries } = useFixtureWatchlist();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--t-bg)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--t-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-1)' }}>Saved matches</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-4)', fontSize: 16, padding: '2px 6px' }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--t-text-5)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            No saved matches yet.
            <br />
            Tap ☆ on any match to save it.
          </div>
        ) : (
          entries.map((entry) => (
            <SavedCard key={entry.apiFixtureId} entry={entry} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  );
}
