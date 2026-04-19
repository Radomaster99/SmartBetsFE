'use client';

import { useEffect, useRef } from 'react';

interface LiveStatsRefreshOptions {
  enabled: boolean;
  isLive: boolean;
  isPageVisible: boolean;
  refetch: () => Promise<unknown>;
}

export function useLiveStatsRefresh({
  enabled,
  isLive,
  isPageVisible,
  refetch,
}: LiveStatsRefreshOptions) {
  const previousVisibilityRef = useRef(isPageVisible);

  useEffect(() => {
    const wasVisible = previousVisibilityRef.current;
    previousVisibilityRef.current = isPageVisible;

    if (!enabled || !isLive) {
      return;
    }

    if (!wasVisible && isPageVisible) {
      void refetch();
    }
  }, [enabled, isLive, isPageVisible, refetch]);
}
