'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { WatchlistFixtureEntry } from '@/lib/hooks/useFixtureWatchlist';

const SAVED_DELETE_ACTION_WIDTH = 78;
const MOBILE_SAVED_OPAQUE_BG = '#07101a';
const MOBILE_SAVED_OPAQUE_HEADER_BG = '#090e1a';

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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4.5 7.5h15" strokeLinecap="round" />
      <path d="M9.5 3.75h5a1 1 0 0 1 1 1V6h-7V4.75a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 7.5l.7 10.2a1.5 1.5 0 0 0 1.5 1.3h4.6a1.5 1.5 0 0 0 1.5-1.3l.7-10.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v4.5M14 11v4.5" strokeLinecap="round" />
    </svg>
  );
}

function SavedCard({
  entry,
  onClose,
  onRemove,
  isOpen,
  onOpenChange,
}: {
  entry: WatchlistFixtureEntry;
  onClose: () => void;
  onRemove: (fixtureId: number) => void;
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const homeGoals = entry.homeGoals;
  const awayGoals = entry.awayGoals;
  const showScore = entry.stateBucket === 'Live' || entry.stateBucket === 'Finished';
  const isLive = entry.stateBucket === 'Live';
  const [dragOffset, setDragOffset] = useState(0);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    dragging: boolean;
    moved: boolean;
  } | null>(null);

  const restingOffset = isOpen ? SAVED_DELETE_ACTION_WIDTH : 0;
  const translateX = Math.max(0, Math.min(SAVED_DELETE_ACTION_WIDTH, restingOffset + dragOffset));

  function clampOffset(value: number) {
    return Math.max(0, Math.min(SAVED_DELETE_ACTION_WIDTH, value));
  }

  function handleTouchStart(event: React.TouchEvent<HTMLAnchorElement>) {
    const touch = event.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      dragging: false,
      moved: false,
    };
  }

  function handleTouchMove(event: React.TouchEvent<HTMLAnchorElement>) {
    const state = touchStateRef.current;
    if (!state) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    if (!state.dragging) {
      if (Math.abs(deltaY) > Math.abs(deltaX) + 4) {
        touchStateRef.current = null;
        setDragOffset(0);
        return;
      }

      if (Math.abs(deltaX) < 6) {
        return;
      }

      state.dragging = true;
    }

    state.moved = true;
    setDragOffset(clampOffset(deltaX));
  }

  function handleTouchEnd() {
    const state = touchStateRef.current;
    touchStateRef.current = null;

    const finalOffset = clampOffset(restingOffset + dragOffset);
    setDragOffset(0);

    if (state?.dragging || finalOffset !== restingOffset) {
      onOpenChange(finalOffset >= SAVED_DELETE_ACTION_WIDTH * 0.5);
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        borderBottom: '1px solid var(--t-border)',
        overflow: 'hidden',
        background: MOBILE_SAVED_OPAQUE_BG,
      }}
    >
      <button
        type="button"
        onClick={() => onRemove(entry.apiFixtureId)}
        aria-label="Remove from saved matches"
        style={{
          position: 'absolute',
          inset: 0,
          right: 'auto',
          width: SAVED_DELETE_ACTION_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <TrashIcon />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Remove
        </span>
      </button>

      <Link
        href={`/football/fixtures/${entry.apiFixtureId}`}
        onClick={(event) => {
          if (isOpen || dragOffset !== 0) {
            event.preventDefault();
            onOpenChange(false);
            return;
          }

          onClose();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          textDecoration: 'none',
          transform: `translateX(${translateX}px)`,
          transition: dragOffset === 0 ? 'transform 180ms ease' : 'none',
          touchAction: 'pan-y',
          willChange: 'transform',
          borderLeft: isLive ? '2px solid rgba(239,83,80,0.4)' : '2px solid transparent',
          background: isLive ? 'rgba(30, 10, 14, 0.98)' : MOBILE_SAVED_OPAQUE_BG,
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
    </div>
  );
}

interface Props {
  entries: WatchlistFixtureEntry[];
  onClose: () => void;
  onRemove: (fixtureId: number) => void;
}

export function MobileSavedScreen({ entries, onClose, onRemove }: Props) {
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        // Use a solid dark background — var(--t-page-bg) is semi-transparent in dark mode
        // so fall back to a fully opaque colour so text is always readable.
        background: MOBILE_SAVED_OPAQUE_BG,
        backgroundColor: MOBILE_SAVED_OPAQUE_BG,
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
          background: MOBILE_SAVED_OPAQUE_HEADER_BG,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-1)' }}>Saved matches</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'var(--t-surface-2)',
            border: '1px solid var(--t-border)',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--t-text-2)',
            fontSize: 14,
            padding: '4px 10px',
            lineHeight: 1,
            fontWeight: 700,
          }}
          aria-label="Close saved matches"
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: MOBILE_SAVED_OPAQUE_BG }}>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--t-text-4)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            No saved matches yet.
            <br />
            <span style={{ color: 'var(--t-text-5)', fontSize: 12 }}>Tap ☆ on any match to save it.</span>
          </div>
        ) : (
          entries.map((entry) => (
            <SavedCard
              key={entry.apiFixtureId}
              entry={entry}
              onClose={onClose}
              onRemove={(fixtureId) => {
                if (openEntryId === fixtureId) {
                  setOpenEntryId(null);
                }
                onRemove(fixtureId);
              }}
              isOpen={openEntryId === entry.apiFixtureId}
              onOpenChange={(next) => setOpenEntryId(next ? entry.apiFixtureId : null)}
            />
          ))
        )}
      </div>
    </div>
  );
}
