# OddsDetector Brand Mark Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current abstract SVG mark in `OddsDetectorLogo.tsx` with the new brand mark (magnifying glass + EKG pulse line + speed streaks) and propagate it across the topbar, footer, favicon, OG image, and a new four-pillar badge row in the footer.

**Architecture:** Single source-of-truth SVG in `OddsDetectorLogo.tsx` exports `OddsDetectorMark` and `OddsDetectorLogo`. The favicon (`app/icon.tsx`) and OG image (`app/opengraph-image.tsx`) render their own inline versions (required by `next/og` which can't import React components). The footer badge row is added directly in `SiteFooter.tsx`.

**Tech Stack:** React 19, Next.js App Router, TypeScript, `next/og` (ImageResponse), inline SVG, Tailwind 4 / CSS vars.

---

## File Map

| File | Change |
|---|---|
| `smartbets/components/branding/OddsDetectorLogo.tsx` | Replace `OddsDetectorMark` SVG paths with new magnifier + pulse + speed-lines mark |
| `smartbets/app/icon.tsx` | Replace icon with new mark (inline, no React import) |
| `smartbets/app/opengraph-image.tsx` | Add mark + tagline "COMPARE. DETECT. WIN." |
| `smartbets/components/layout/SiteFooter.tsx` | Add four brand-pillar badges below nav zone |

---

### Task 1: Update `OddsDetectorMark` SVG in branding component

**Files:**
- Modify: `smartbets/components/branding/OddsDetectorLogo.tsx`

The new mark uses: speed-line rectangles on the left, a circular magnifier ring, a polyline EKG pulse inside the ring, and a handle line at bottom-right. The viewBox is `0 0 52 52` so it scales cleanly.

- [ ] **Step 1: Replace the full file content**

Open `smartbets/components/branding/OddsDetectorLogo.tsx` and replace its entire content with:

```tsx
import { useId } from 'react';

type OddsDetectorLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  textColor?: string;
  accentColor?: string;
  muted?: boolean;
};

type OddsDetectorMarkProps = {
  size?: number;
  className?: string;
  muted?: boolean;
};

export function OddsDetectorMark({ size = 40, className, muted = false }: OddsDetectorMarkProps) {
  const glassId = useId();

  const streakColor = muted ? '#4b5563' : '#00e676';
  const ringColor = muted ? '#6b7280' : '#ffffff';
  const pulseColor = muted ? '#4b5563' : '#00e676';

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speed streaks — left side */}
      <rect x="2" y="15" width="9"  height="3.5" rx="1.75" fill={streakColor} opacity="0.75" />
      <rect x="1" y="21" width="12" height="3.5" rx="1.75" fill={streakColor} opacity="0.55" />
      <rect x="2" y="27" width="8"  height="3.5" rx="1.75" fill={streakColor} opacity="0.38" />

      {/* Magnifier ring */}
      <circle cx="31" cy="22" r="13" stroke={ringColor} strokeWidth="4" fill="none" />

      {/* EKG / heartbeat pulse inside ring */}
      <polyline
        points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
        stroke={pulseColor}
        strokeWidth="2.2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Handle */}
      <line x1="40" y1="31" x2="48" y2="40" stroke={ringColor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function OddsDetectorLogo({
  size = 40,
  className,
  showWordmark = true,
  wordmarkClassName,
  textColor = 'var(--t-text-1)',
  accentColor = 'var(--t-accent)',
  muted = false,
}: OddsDetectorLogoProps) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: size >= 32 ? 10 : 8 }}>
      <OddsDetectorMark size={size} muted={muted} />
      {showWordmark ? (
        <span className={wordmarkClassName} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
          <span
            style={{
              color: muted ? 'var(--t-text-5, #6B7280)' : textColor,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Odds
          </span>
          <span
            style={{
              color: muted ? 'var(--t-text-4, #8B94A7)' : accentColor,
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Detector
          </span>
        </span>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd smartbets && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `OddsDetectorLogo.tsx`.

---

### Task 2: Update favicon (`app/icon.tsx`)

**Files:**
- Modify: `smartbets/app/icon.tsx`

The favicon must use inline JSX only (no imported React components — `next/og` renders in an edge context). Render the new magnifier+pulse+streaks mark at 64×64.

- [ ] **Step 1: Replace the full file content**

```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07101a',
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Speed streaks */}
          <rect x="2"  y="15" width="9"  height="3.5" rx="1.75" fill="#00e676" opacity={0.75} />
          <rect x="1"  y="21" width="12" height="3.5" rx="1.75" fill="#00e676" opacity={0.55} />
          <rect x="2"  y="27" width="8"  height="3.5" rx="1.75" fill="#00e676" opacity={0.38} />
          {/* Ring */}
          <circle cx="31" cy="22" r="13" stroke="white" strokeWidth="4" fill="none" />
          {/* EKG */}
          <polyline
            points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
            stroke="#00e676"
            strokeWidth="2.2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Handle */}
          <line x1="40" y1="31" x2="48" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd smartbets && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

### Task 3: Update OG / social share card (`app/opengraph-image.tsx`)

**Files:**
- Modify: `smartbets/app/opengraph-image.tsx`

Add the new mark above the wordmark, and add the "COMPARE. DETECT. WIN." tagline below it. Keep the dark background and green accent bar.

- [ ] **Step 1: Replace the full file content**

```tsx
import { ImageResponse } from 'next/og';

export const alt = 'OddsDetector — Football Odds Comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07101a',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#00e676', display: 'flex' }} />

        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: '50%',
            width: 700,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,230,118,0.13) 0%, transparent 70%)',
            transform: 'translateX(-50%)',
            display: 'flex',
          }}
        />

        {/* Mark */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2"  y="15" width="9"  height="3.5" rx="1.75" fill="#00e676" opacity={0.75} />
          <rect x="1"  y="21" width="12" height="3.5" rx="1.75" fill="#00e676" opacity={0.55} />
          <rect x="2"  y="27" width="8"  height="3.5" rx="1.75" fill="#00e676" opacity={0.38} />
          <circle cx="31" cy="22" r="13" stroke="white" strokeWidth="4" fill="none" />
          <polyline
            points="19,22 22,22 24,16 26.5,28 29,17 31.5,25 34,22 42,22"
            stroke="#00e676"
            strokeWidth="2.2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line x1="40" y1="31" x2="48" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>

        {/* Wordmark */}
        <div
          style={{
            marginTop: 20,
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#f4f8ff',
            display: 'flex',
            gap: 0,
          }}
        >
          <span>Odds</span>
          <span style={{ color: '#00e676' }}>Detector</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: '#00e676',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Compare. Detect. Win.
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.38)',
            letterSpacing: '0.02em',
            display: 'flex',
          }}
        >
          Football Odds Comparison
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd smartbets && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

### Task 4: Add four brand-pillar badges to `SiteFooter.tsx`

**Files:**
- Modify: `smartbets/components/layout/SiteFooter.tsx`

Add a new "Zone 0" row above the nav columns — a centered strip with four icon+label badges: Compare Odds, Find Value, Detect Opportunities, Beat the Bookies. Icons are small inline SVGs. The row sits inside the same `marginInline` container.

- [ ] **Step 1: Open the file and locate the solid center strip div**

In `smartbets/components/layout/SiteFooter.tsx`, find the `{/* Zone 1 — Navigation */}` comment. Insert the following new `BrandPillars` component call immediately before it, inside the solid strip `div`.

Replace this block:

```tsx
        {/* Zone 1 — Navigation */}
        <nav
```

With:

```tsx
        {/* Zone 0 — Brand pillars */}
        <BrandPillars />

        {/* Zone 1 — Navigation */}
        <nav
```

- [ ] **Step 2: Add the `BrandPillars` component at the bottom of the file**

After the closing `}` of the `RespBadge` function, append:

```tsx
function BrandPillars() {
  const pillars: Array<{ label: string; icon: React.ReactNode }> = [
    {
      label: 'Compare Odds',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="4"    width="16" height="2.5" rx="1.25" fill="var(--t-text-5, #4b5563)" />
          <rect x="2" y="8.75" width="10" height="2.5" rx="1.25" fill="var(--t-accent, #00e676)" />
          <rect x="2" y="13.5" width="13" height="2.5" rx="1.25" fill="var(--t-text-5, #4b5563)" />
        </svg>
      ),
    },
    {
      label: 'Find Value',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7"   stroke="var(--t-text-5, #4b5563)" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="3"   stroke="var(--t-accent, #00e676)"  strokeWidth="1.5" />
          <circle cx="10" cy="10" r="1"   fill="var(--t-accent, #00e676)" />
        </svg>
      ),
    },
    {
      label: 'Detect Opportunities',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 3v2M14.24 5.76l-1.41 1.41M17 10h-2M14.24 14.24l-1.41-1.41M10 17v-2M5.76 14.24l1.41-1.41M3 10h2M5.76 5.76l1.41 1.41"
            stroke="var(--t-text-5, #4b5563)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="2.5" fill="var(--t-accent, #00e676)" />
        </svg>
      ),
    },
    {
      label: 'Beat the Bookies',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <polyline
            points="3,14 7,9 10,12 14,6 17,8"
            stroke="var(--t-text-5, #4b5563)"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points="14,6 17,6 17,9"
            stroke="var(--t-accent, #00e676)"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--t-border, rgba(255,255,255,0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        flexWrap: 'wrap',
      }}
    >
      {pillars.map((p) => (
        <div
          key={p.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: 'rgba(0,230,118,0.07)',
              borderTop: '1px solid rgba(0,230,118,0.18)',
              borderRight: '1px solid rgba(0,230,118,0.18)',
              borderBottom: '1px solid rgba(0,230,118,0.18)',
              borderLeft: '1px solid rgba(0,230,118,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {p.icon}
          </div>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--t-text-5, #4b5563)',
              textAlign: 'center' as const,
              maxWidth: 80,
              lineHeight: 1.4,
            }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add `React` import (needed for `React.ReactNode` in the pillars array)**

At the top of `smartbets/components/layout/SiteFooter.tsx`, the existing imports include `import type { ReactNode } from 'react';`. Change it to also import `React`:

Replace:
```tsx
import type { ReactNode } from 'react';
```
With:
```tsx
import type { ReactNode } from 'react';
import React from 'react';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd smartbets && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

### Task 5: Visual smoke-test

- [ ] **Step 1: Start the dev server**

```bash
cd smartbets && npm run dev
```

- [ ] **Step 2: Check topbar mark**

Open `http://localhost:3000/football`. The topbar should show the magnifier+pulse+streaks mark followed by "Odds**Detector**" in white/green.

- [ ] **Step 3: Check footer badges**

Scroll to the bottom of any page. Confirm the four brand-pillar badges (Compare Odds, Find Value, Detect Opportunities, Beat the Bookies) appear above the footer nav columns. Confirm the muted logo renders correctly in the legal bar.

- [ ] **Step 4: Check favicon**

Look at the browser tab icon. It should show the magnifier+pulse mark on a dark background (no text).

- [ ] **Step 5: Check OG image**

Open `http://localhost:3000/opengraph-image` directly. Confirm it shows: green bar at top, magnifier mark, "OddsDetector" wordmark, "COMPARE. DETECT. WIN." tagline, "Football Odds Comparison" subtitle.
