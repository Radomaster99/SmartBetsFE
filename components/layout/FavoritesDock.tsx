'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeamLogo } from '@/components/shared/TeamLogo';
import type { WatchlistFixtureEntry } from '@/lib/hooks/useFixtureWatchlist';
import { DESKTOP_SIDE_AD_WIDTH_PX } from '@/lib/side-ads';

type Props = {
  entries: WatchlistFixtureEntry[];
  onRemove: (fixtureId: number) => void;
};

const FAVORITES_DOCK_OPEN_STORAGE_KEY = 'smartbets:favorites-dock-open';

function formatKickoffLabel(entry: WatchlistFixtureEntry): string {
  if (!entry.kickoffAt) {
    return 'Saved fixture';
  }

  const kickoff = new Date(entry.kickoffAt);
  return kickoff.toLocaleString('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(entry: WatchlistFixtureEntry): string {
  if (entry.stateBucket === 'Live') {
    if (entry.elapsed != null) {
      return entry.statusExtra ? `${entry.elapsed}+${entry.statusExtra}'` : `${entry.elapsed}'`;
    }

    return entry.status || 'LIVE';
  }

  if (entry.stateBucket === 'Finished') {
    return 'FT';
  }

  if (entry.stateBucket === 'Upcoming') {
    return formatKickoffLabel(entry);
  }

  return entry.status || entry.stateBucket || 'Saved';
}

function scoreLabel(entry: WatchlistFixtureEntry): string {
  if (entry.homeGoals == null || entry.awayGoals == null) {
    return 'vs';
  }

  return `${entry.homeGoals} - ${entry.awayGoals}`;
}

function statusTone(entry: WatchlistFixtureEntry) {
  if (entry.stateBucket === 'Live') {
    return {
      background: 'rgba(239,83,80,0.14)',
      border: '1px solid rgba(239,83,80,0.28)',
      color: '#fca5a5',
    };
  }

  if (entry.stateBucket === 'Finished') {
    return {
      background: 'rgba(148,163,184,0.12)',
      border: '1px solid rgba(148,163,184,0.2)',
      color: 'var(--t-text-3)',
    };
  }

  return {
    background: 'rgba(0,230,118,0.08)',
    border: '1px solid rgba(0,230,118,0.16)',
    color: 'var(--t-accent)',
  };
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v2a2 2 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-2a2 2 0 0 0 0-7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 9.5v5M14 9.5v5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      style={{
        transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 160ms ease',
      }}
    >
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FavoritesDock({ entries, onRemove }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleEntries = useMemo(() => entries.slice(0, 12), [entries]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsOpen(window.localStorage.getItem(FAVORITES_DOCK_OPEN_STORAGE_KEY) === '1');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FAVORITES_DOCK_OPEN_STORAGE_KEY, isOpen ? '1' : '0');
  }, [isOpen]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-[70] flex flex-col items-end gap-2 md:bottom-4 md:right-3"
      style={{ width: `min(${DESKTOP_SIDE_AD_WIDTH_PX}px, calc(100vw - 18px))` }}
    >
      {isOpen ? (
        <div
          className="pointer-events-auto panel-shell w-full overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(11, 16, 30, 0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 38px rgba(0,0,0,0.42)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: 'var(--t-border)' }}
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--t-accent)' }}>
                Favorites
              </div>
              <div className="text-[12px]" style={{ color: 'var(--t-text-4)' }}>
                Saved matches stay pinned while you browse.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center"
              aria-label="Collapse favorites"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--t-text-3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <ChevronIcon open />
              </span>
            </button>
          </div>

          <div className="max-h-[58vh] overflow-y-auto px-2 py-2">
            {visibleEntries.map((entry) => {
              const tone = statusTone(entry);

              return (
                <a
                  key={entry.apiFixtureId}
                  href={`/football/fixtures/${entry.apiFixtureId}`}
                  className="mb-2 block rounded-xl px-3 py-2.5 last:mb-0"
                  style={{
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--t-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={tone}
                    >
                      {formatStatus(entry)}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemove(entry.apiFixtureId);
                      }}
                      className="chrome-btn flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold"
                      aria-label="Remove from favorites"
                    >
                      x
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TeamLogo src={entry.homeTeamLogoUrl ?? ''} alt={entry.homeTeamName ?? 'Home'} size={18} />
                      <span className="min-w-0 truncate text-[11px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
                        {entry.homeTeamName ?? `Fixture #${entry.apiFixtureId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo src={entry.awayTeamLogoUrl ?? ''} alt={entry.awayTeamName ?? 'Away'} size={18} />
                      <span className="min-w-0 truncate text-[11px] font-semibold" style={{ color: 'var(--t-text-1)' }}>
                        {entry.awayTeamName ?? 'Open fixture'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <div className="text-[10px]" style={{ color: 'var(--t-text-5)' }}>
                      {[entry.countryName, entry.leagueName].filter(Boolean).join(' • ') || 'Saved fixture'}
                    </div>
                    <div
                      className="rounded-lg px-2.5 py-0.5 text-[11px] font-bold"
                      style={{
                        background: 'var(--t-surface-2)',
                        border: '1px solid var(--t-border-2)',
                        color: 'var(--t-text-2)',
                      }}
                    >
                      {scoreLabel(entry)}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto flex items-center gap-2.5 rounded-full px-3 py-2"
        style={{
          width: `min(${DESKTOP_SIDE_AD_WIDTH_PX}px, calc(100vw - 18px))`,
          background: 'linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(10,15,27,0.98) 100%)',
          border: '1px solid rgba(0,230,118,0.22)',
          boxShadow: '0 14px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
          color: 'var(--t-text-1)',
          backdropFilter: 'blur(14px)',
        }}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Collapse favorites' : 'Open favorites'}
      >
        <span
          className="relative flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: 'rgba(0,230,118,0.12)',
            color: 'var(--t-accent)',
            border: '1px solid rgba(0,230,118,0.16)',
          }}
        >
          <TicketIcon />
          <span
            className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{
              background: 'rgba(8,12,22,0.98)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {entries.length}
          </span>
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--t-accent)' }}>
            Favorites
          </div>
          <div className="truncate text-[11px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
            {entries.length} saved {entries.length === 1 ? 'match' : 'matches'}
          </div>
        </div>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--t-text-3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <ChevronIcon open={isOpen} />
        </span>
      </button>
    </div>
  );
}
