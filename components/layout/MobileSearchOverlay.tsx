'use client';

import { useEffect } from 'react';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

export function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(6,10,20,0.99)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.09)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <GlobalSearch autoFocus />
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--t-text-3)',
            padding: '4px 8px',
            flexShrink: 0,
          }}
        >
          Cancel
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--t-text-5)',
          fontSize: 13,
        }}
      >
        Search matches, teams, or leagues above
      </div>
    </div>
  );
}
