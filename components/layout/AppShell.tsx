'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

function shouldOpenExternallyInNewTab(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href');

  if (!href || href.startsWith('#') || anchor.hasAttribute('download')) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    const isSameOrigin = url.origin === window.location.origin;
    const isGoRedirect = isSameOrigin && url.pathname.startsWith('/go/');

    return !isSameOrigin || isGoRedirect;
  } catch {
    return false;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobileViewport(media.matches);

    apply();
    media.addEventListener('change', apply);

    return () => {
      media.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileViewport && mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [isMobileViewport, mobileSidebarOpen]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      if (!shouldOpenExternallyInNewTab(anchor)) {
        return;
      }

      const href = anchor.href;
      if (!href) {
        return;
      }

      event.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  const shellGutter = isMobileViewport ? '5px' : '280px';

  return (
    <div style={{ height: '100vh', paddingInline: shellGutter, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Topbar onMenuToggle={isMobileViewport ? () => setMobileSidebarOpen((current) => !current) : undefined} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
          <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
        </div>
      </div>
    </div>
  );
}
