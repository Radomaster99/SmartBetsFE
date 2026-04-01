'use client';
import { useEffect, useRef } from 'react';

interface Props {
  type: string;
  /** Refresh interval in seconds. Omit to save API quota. */
  refresh?: number;
  /** data-id — used by: game, topscorers, injuries, predictions */
  id?: number;
  league?: number;
  season?: number;
  /** data-home / data-away — used by: h2h */
  home?: number;
  away?: number;
  date?: string;
  className?: string;
}

/**
 * Renders an api-sports-widget element via native DOM.
 * Waits for the custom element to be defined before creating it,
 * so there's no race condition with the async module script.
 *
 * Widget types: livescore | game | leagues | standings | h2h | topscorers
 */
export function ApiSportsWidget({
  type,
  refresh,
  id,
  league,
  season,
  home,
  away,
  date,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      const widget = document.createElement('api-sports-widget');
      widget.setAttribute('data-type', type);
      if (refresh !== undefined) widget.setAttribute('data-refresh', String(refresh));
      if (id      !== undefined) widget.setAttribute('data-id',      String(id));
      if (league  !== undefined) widget.setAttribute('data-league',  String(league));
      if (season  !== undefined) widget.setAttribute('data-season',  String(season));
      if (home    !== undefined) widget.setAttribute('data-home',    String(home));
      if (away    !== undefined) widget.setAttribute('data-away',    String(away));
      if (date    !== undefined) widget.setAttribute('data-date',    date);
      el.innerHTML = '';
      el.appendChild(widget);
    };

    // Wait for the custom element to be registered before creating instances.
    // This handles the async module script load timing.
    customElements.whenDefined('api-sports-widget').then(mount).catch(mount);

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refresh, id, league, season, home, away, date]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', minHeight: '220px' }}
    />
  );
}
