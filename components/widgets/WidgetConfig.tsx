'use client';
import { useEffect, useRef } from 'react';

const WIDGET_KEY = process.env.NEXT_PUBLIC_WIDGET_KEY ?? '';

/**
 * Renders the api-sports config widget ONCE globally.
 * Waits for the custom element to be defined before mounting.
 * Uses custom "SmartBets" theme defined via CSS variables in globals.css.
 */
export function WidgetConfig() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mount = () => {
      if (!containerRef.current) return;
      let config = el.querySelector('api-sports-widget');
      if (!config) {
        config = document.createElement('api-sports-widget');
        el.appendChild(config);
      }
      config.setAttribute('data-type', 'config');
      config.setAttribute('data-key', WIDGET_KEY);
      config.setAttribute('data-sport', 'football');
      config.setAttribute('data-lang', 'en');
      config.setAttribute('data-theme', 'SmartBets');
      config.setAttribute('data-show-errors', 'true');
    };

    customElements.whenDefined('api-sports-widget').then(mount).catch(mount);
  }, []);

  // Render outside the viewport but still in the DOM (not display:none
  // which can prevent custom elements from initialising in some browsers).
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    />
  );
}
