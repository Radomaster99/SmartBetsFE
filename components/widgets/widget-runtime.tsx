'use client';

import { createContext, useContext } from 'react';

export type WidgetScriptStatus = 'loading' | 'ready' | 'error';

export interface WidgetsContextValue {
  widgetKey: string;
  hasWidgetKey: boolean;
  scriptStatus: WidgetScriptStatus;
}

export const WIDGET_SCRIPT_SRC = 'https://widgets.api-sports.io/3.1.0/widgets.js';
export const WIDGETS_READY_EVENT = 'smartbets:widgets-ready';
export const WIDGETS_ERROR_EVENT = 'smartbets:widgets-error';
export const WIDGETS_ENV_HINT = 'NEXT_PUBLIC_WIDGET_KEY or WIDGET_KEY';

export const WidgetsContext = createContext<WidgetsContextValue>({
  widgetKey: '',
  hasWidgetKey: false,
  scriptStatus: 'loading',
});

export function useWidgets(): WidgetsContextValue {
  return useContext(WidgetsContext);
}

declare global {
  interface Window {
    __smartbetsWidgetsScriptStatus?: WidgetScriptStatus;
  }
}
