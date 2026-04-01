'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { WidgetConfig } from '@/components/widgets/WidgetConfig';
import {
  WidgetsContext,
  WIDGETS_ERROR_EVENT,
  WIDGETS_READY_EVENT,
  WIDGET_SCRIPT_SRC,
  type WidgetScriptStatus,
} from '@/components/widgets/widget-runtime';

interface Props {
  children: ReactNode;
  widgetKey: string;
}

function getInitialScriptStatus(): WidgetScriptStatus {
  if (typeof window === 'undefined') {
    return 'loading';
  }

  if (customElements.get('api-sports-widget')) {
    return 'ready';
  }

  return window.__smartbetsWidgetsScriptStatus ?? 'loading';
}

export function WidgetsProvider({ children, widgetKey }: Props) {
  const [scriptStatus, setScriptStatus] = useState<WidgetScriptStatus>(getInitialScriptStatus);
  const hasWidgetKey = widgetKey.trim().length > 0;

  useEffect(() => {
    if (customElements.get('api-sports-widget')) {
      setScriptStatus('ready');
      return;
    }

    const handleReady = () => setScriptStatus('ready');
    const handleError = () => setScriptStatus('error');

    window.addEventListener(WIDGETS_READY_EVENT, handleReady);
    window.addEventListener(WIDGETS_ERROR_EVENT, handleError);

    const timeoutId = window.setTimeout(() => {
      if (!customElements.get('api-sports-widget') && window.__smartbetsWidgetsScriptStatus !== 'ready') {
        setScriptStatus('error');
      }
    }, 10000);

    return () => {
      window.removeEventListener(WIDGETS_READY_EVENT, handleReady);
      window.removeEventListener(WIDGETS_ERROR_EVENT, handleError);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const value = useMemo(
    () => ({
      widgetKey,
      hasWidgetKey,
      scriptStatus,
    }),
    [hasWidgetKey, scriptStatus, widgetKey],
  );

  return (
    <WidgetsContext.Provider value={value}>
      <Script
        id="api-sports-widgets"
        src={WIDGET_SCRIPT_SRC}
        type="module"
        strategy="afterInteractive"
        onReady={() => {
          window.__smartbetsWidgetsScriptStatus = 'ready';
          window.dispatchEvent(new Event(WIDGETS_READY_EVENT));
        }}
        onError={() => {
          window.__smartbetsWidgetsScriptStatus = 'error';
          window.dispatchEvent(new Event(WIDGETS_ERROR_EVENT));
        }}
      />
      <WidgetConfig widgetKey={widgetKey} />
      {children}
    </WidgetsContext.Provider>
  );
}
