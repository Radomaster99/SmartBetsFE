'use client';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useWidgets } from '@/components/widgets/widget-runtime';

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
 * Renders an API-Sports widget using the documented custom-element pattern.
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
  const { hasWidgetKey, scriptStatus } = useWidgets();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const wrapperClassName = ['widget-wrap', className].filter(Boolean).join(' ');
  const isLeaguesWidget = type === 'leagues';
  const containerStyle: CSSProperties = {
    width: '100%',
    minHeight: isLeaguesWidget ? '100%' : '220px',
    height: isLeaguesWidget ? '100%' : undefined,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!hasWidgetKey) {
      setStatus('error');
      container.innerHTML = '';
      return;
    }
    if (scriptStatus !== 'ready' || !customElements.get('api-sports-widget')) {
      setStatus(scriptStatus === 'error' ? 'error' : 'loading');
      return;
    }

    let cancelled = false;
    let initTimeoutId: number | undefined;
    let observer: MutationObserver | undefined;

    const cleanupWidget = () => {
      if (observer) {
        observer.disconnect();
        observer = undefined;
      }
      if (initTimeoutId) {
        window.clearTimeout(initTimeoutId);
        initTimeoutId = undefined;
      }
      container.innerHTML = '';
    };

    const mountWidget = () => {
      if (cancelled || !containerRef.current) return;

      cleanupWidget();
      setStatus('loading');

      const widget = document.createElement('api-sports-widget');
      widget.setAttribute('data-type', type);
      if (refresh !== undefined) widget.setAttribute('data-refresh', String(refresh));
      if (id !== undefined) widget.setAttribute('data-id', String(id));
      if (league !== undefined) widget.setAttribute('data-league', String(league));
      if (season !== undefined) widget.setAttribute('data-season', String(season));
      if (home !== undefined) widget.setAttribute('data-home', String(home));
      if (away !== undefined) widget.setAttribute('data-away', String(away));
      if (date !== undefined) widget.setAttribute('data-date', date);
      widget.style.display = 'block';
      widget.style.width = '100%';
      widget.style.minHeight = isLeaguesWidget ? '100%' : '220px';
      containerRef.current.appendChild(widget);

      const markReady = () => {
        if (cancelled) return;
        setStatus('ready');
        if (observer) {
          observer.disconnect();
          observer = undefined;
        }
        if (initTimeoutId) {
          window.clearTimeout(initTimeoutId);
          initTimeoutId = undefined;
        }
      };

      if (widget.classList.contains('initialized')) {
        markReady();
        return;
      }

      observer = new MutationObserver(() => {
        if (widget.classList.contains('initialized')) {
          markReady();
        }
      });
      observer.observe(widget, { attributes: true, attributeFilter: ['class'] });

      initTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        if (!widget.classList.contains('initialized')) {
          setStatus('error');
        }
      }, 8000);
    };

    mountWidget();

    return () => {
      cancelled = true;
      cleanupWidget();
    };
  }, [type, refresh, id, league, season, home, away, date, isLeaguesWidget, hasWidgetKey, scriptStatus]);

  const errorCopy = !hasWidgetKey
    ? 'Widget key is missing.'
    : scriptStatus === 'error'
      ? 'Leagues widget script failed to load.'
      : 'Leagues widget failed to initialize.';

  return (
    <div
      ref={containerRef}
      className={wrapperClassName}
      style={containerStyle}
    >
      {status === 'error' ? (
        <div className="px-3 py-3 text-[11px]" style={{ color: 'var(--t-text-4)' }}>
          {errorCopy}
        </div>
      ) : null}
    </div>
  );
}
