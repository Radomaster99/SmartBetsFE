'use client';

import { getBookmakerMeta } from '@/lib/bookmakers';

interface Props {
  bookmakerName: string;
  size?: number;
}

export function BookmakerAvatar({ bookmakerName, size = 22 }: Props) {
  const meta = getBookmakerMeta(bookmakerName);

  if (meta.faviconUrl) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `${meta.accent}18`,
          border: `1px solid ${meta.accent}33`,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={meta.faviconUrl}
          alt={bookmakerName}
          width={size - 6}
          height={size - 6}
          style={{ objectFit: 'contain', borderRadius: 2 }}
          onError={(e) => {
            const img = e.currentTarget;
            const parent = img.parentElement;
            if (parent) {
              img.style.display = 'none';
              parent.textContent = meta.logoText;
              parent.style.fontSize = `${Math.max(size - 14, 7)}px`;
              parent.style.fontWeight = '900';
              parent.style.color = meta.accent;
            }
          }}
        />
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${meta.accent}18`,
        border: `1px solid ${meta.accent}33`,
        flexShrink: 0,
        fontSize: Math.max(size - 14, 7),
        fontWeight: 900,
        color: meta.accent,
        letterSpacing: '0.04em',
      }}
    >
      {meta.logoText}
    </span>
  );
}
