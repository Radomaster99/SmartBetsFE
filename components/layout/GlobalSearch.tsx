'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { GlobalSearchResponse, GlobalSearchSuggestion } from '@/lib/types/search';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

const TYPE_STYLES: Record<
  GlobalSearchSuggestion['type'],
  { background: string; color: string; label: string }
> = {
  fixture: {
    background: 'rgba(0,230,118,0.12)',
    color: 'var(--t-accent)',
    label: 'Match',
  },
  team: {
    background: 'rgba(59,130,246,0.12)',
    color: '#93c5fd',
    label: 'Team',
  },
  league: {
    background: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    label: 'League',
  },
};

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const queryCacheRef = useRef<Map<string, GlobalSearchSuggestion[]>>(new Map());
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GlobalSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setItems([]);
    setActiveIndex(0);
  }, [pathname]);

  useEffect(() => {
    let timeoutId: number | null = null;
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);

    const prefetch = () => {
      fetch('/api/search/global?prefetch=1').catch(() => undefined);
    };

    if (requestIdle && cancelIdle) {
      const idleId = requestIdle(prefetch, { timeout: 1500 });

      return () => {
        cancelIdle(idleId);
      };
    }

    timeoutId = window.setTimeout(prefetch, 400);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setItems([]);
      setIsLoading(false);
      setActiveIndex(0);
      return;
    }

    const cachedItems = queryCacheRef.current.get(trimmedQuery.toLowerCase());

    if (cachedItems) {
      setItems(cachedItems);
      setIsOpen(true);
      setIsLoading(false);
      setActiveIndex(0);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search/global?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as GlobalSearchResponse;
        const nextItems = Array.isArray(payload.items) ? payload.items : [];

        if (!controller.signal.aborted) {
          queryCacheRef.current.set(trimmedQuery.toLowerCase(), nextItems);
          setItems(nextItems);
          setIsOpen(true);
          setActiveIndex(0);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[global-search] failed:', error);
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown);
    };
  }, []);

  function openSuggestion(item: GlobalSearchSuggestion) {
    setIsOpen(false);
    setQuery('');
    router.push(item.href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || items.length === 0) {
      if (event.key === 'Enter' && items[0]) {
        event.preventDefault();
        openSuggestion(items[0]);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + items.length) % items.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      openSuggestion(items[activeIndex] ?? items[0]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[460px]">
      <div
        className="flex items-center gap-2 rounded-[12px] px-3 py-2"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--t-border)',
          boxShadow: 'var(--t-shadow-soft)',
        }}
      >
        <span style={{ color: 'var(--t-text-5)' }}>
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search matches, teams, leagues..."
          className="w-full bg-transparent text-[12px] outline-none placeholder:opacity-100"
          style={{ color: 'var(--t-text-2)' }}
        />
        {isLoading ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--t-text-5)' }}>
            Searching
          </span>
        ) : null}
      </div>

      {isOpen && query.trim().length >= 2 ? (
        <div
          className="panel-shell absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-[14px]"
          style={{
            zIndex: 80,
            background: 'rgba(10, 15, 27, 0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 14px 34px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {isLoading ? (
            <div className="px-4 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
              Searching resources...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-[12px]" style={{ color: 'var(--t-text-5)' }}>
              No matching matches, teams, or leagues.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {items.map((item, index) => {
                const tone = TYPE_STYLES[item.type];
                const isActive = index === activeIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openSuggestion(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.015)',
                      borderTop: index === 0 ? 'none' : '1px solid var(--t-border)',
                    }}
                  >
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{ background: tone.background, color: tone.color }}
                    >
                      {item.badge ?? tone.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: 'var(--t-text-2)' }}>
                        {item.title}
                      </div>
                      <div className="truncate text-[11px]" style={{ color: 'var(--t-text-5)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
