'use client';

import { useEffect, useState } from 'react';

export function usePageVisibility() {
  const [isPageVisible, setIsPageVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isPageVisible;
}
