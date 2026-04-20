# UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 13 targeted UI/UX improvements across the fixture list, odds buttons, sidebar, mobile nav, bookmaker identity, and empty states to make SmartBets feel more polished and conversion-ready.

**Architecture:** Each task is a self-contained component edit. No new routes, no data layer changes, no backend calls. Changes touch `components/`, `lib/bookmakers.ts`, and `app/globals.css` only. Tasks are ordered by dependency — later tasks may reference helpers introduced earlier.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Tailwind 4, inline CSS-in-JS (existing pattern)

---

## File Map

| File | Changes |
|---|---|
| `components/fixtures/FixtureRow.tsx` | SVG bookmark icon; larger odds buttons (40px); larger bookmaker label (9px); hover tooltip on odds; movement arrows improved |
| `components/fixtures/FixtureTable.tsx` | League header: add live dot + count; save button SVG |
| `components/fixtures/FixtureFilters.tsx` | Replace `<` `>` with SVG chevron icons |
| `components/layout/MobileBottomNav.tsx` | Inactive tab opacity 0.28 → 0.55, remove grayscale filter |
| `components/layout/FootballSidebarContent.tsx` | Live dot per league in sidebar |
| `components/shared/EmptyState.tsx` | Contextual illustration + better messaging |
| `components/odds/OddsComparison.tsx` | Replace `^` `v` with proper ↑ ↓ arrows |
| `components/odds/BestOddsBar.tsx` | Replace `^` `v` with proper ↑ ↓ arrows; BET button stronger |
| `lib/bookmakers.ts` | Add `faviconUrl` field to `BookmakerMeta`; add favicon URLs for top bookmakers |
| `app/globals.css` | Add `.odds-btn:hover` tooltip styles; live-dot animation reuse |

---

## Task 1: Replace ASCII `< >` date nav arrows with SVG chevrons

**Files:**
- Modify: `components/fixtures/FixtureFilters.tsx`

The `FixtureFilters` component uses `{'<'}` and `{'>'}` as prev/next day button labels at three breakpoints (mobile, md, xl). Replace all six occurrences with an inline SVG chevron.

- [ ] **Step 1: Open `FixtureFilters.tsx` and add a `ChevronIcon` helper above the `FixtureFilters` function**

```tsx
function ChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 4L6 8l4 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
```

- [ ] **Step 2: Replace all six `{'<'}` / `{'>'}` in the button children**

There are three breakpoint blocks (mobile `md:hidden`, `hidden md:block xl:hidden`, `hidden xl:flex`). In each block there are two chevron buttons. Replace:
- `{'<'}` → `<ChevronLeft />`
- `{'>'}` → `<ChevronRight />`

Also update each button's `className` / padding to ensure a 36px minimum hit area. Change the `px-2 py-1` on `text-[12px]` buttons to `px-2.5 py-2` and add `min-w-[32px] flex items-center justify-center`.

Example — the xl-breakpoint prev button becomes:

```tsx
<button
  type="button"
  onClick={() => onDateChange(fmt(new Date(new Date(`${date}T12:00:00`).getTime() - 86400000)))}
  className="filter-hover-chip flex-shrink-0 flex items-center justify-center rounded px-2.5 py-2 min-w-[32px] transition-colors"
  style={{
    color: 'var(--t-text-5)',
    cursor: 'pointer',
    ['--filter-hover-bg' as string]: 'rgba(255,255,255,0.08)',
  }}
  aria-label="Previous day"
>
  <ChevronLeft />
</button>
```

Apply the same pattern to all six buttons across all three breakpoint blocks.

- [ ] **Step 3: Verify the page compiles — run the dev server check**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `FixtureFilters.tsx`.

---

## Task 2: Improve mobile bottom nav inactive tab opacity

**Files:**
- Modify: `components/layout/MobileBottomNav.tsx`

Inactive tabs currently use `opacity: 0.28` with `filter: grayscale(1)`. This makes the nav look disabled. Change to `opacity: 0.55` and remove the grayscale filter.

- [ ] **Step 1: In `MobileBottomNav.tsx`, find the two style objects that apply to inactive tabs**

Both the `<Link>` (Matches tab) and `<button>` (other tabs) share this pattern:

```tsx
opacity: tab.isActive ? 1 : 0.28,
filter: tab.isActive ? 'none' : 'grayscale(1)',
color: tab.isActive ? 'var(--t-accent)' : 'var(--t-text-3)',
```

- [ ] **Step 2: Replace both occurrences with**

```tsx
opacity: tab.isActive ? 1 : 0.55,
color: tab.isActive ? 'var(--t-accent)' : 'var(--t-text-3)',
```

Remove the `filter` line entirely from both (don't set `filter: 'none'` — just delete the property).

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep MobileBottomNav
```

Expected: no output (no errors).

---

## Task 3: Add `faviconUrl` to bookmaker meta and render favicons

**Files:**
- Modify: `lib/bookmakers.ts`
- Modify: `components/odds/OddsComparison.tsx`
- Modify: `components/odds/BestOddsBar.tsx`

The bookmaker identity circles currently show 2–4 letter text abbreviations. Add favicon URLs to the meta registry, then render `<img>` favicons with text fallback.

- [ ] **Step 1: Update `BookmakerMetaSeed` and `BookmakerMeta` types in `lib/bookmakers.ts`**

```ts
type BookmakerMetaSeed = {
  order: number;
  short: string;
  accent: string;
  faviconUrl?: string;
};

export type BookmakerMeta = BookmakerMetaSeed & {
  slug: string;
  name: string;
  logoText: string;
  faviconUrl: string | null;
};
```

- [ ] **Step 2: Add `faviconUrl` to the top bookmakers in `BOOKMAKER_META_REGISTRY`**

Update the registry entries below (others remain as-is, they'll fall back to text):

```ts
const BOOKMAKER_META_REGISTRY: Record<string, BookmakerMetaSeed> = {
  'bet365':            { order: 1,  short: 'B365', accent: '#1db954', faviconUrl: 'https://www.bet365.com/favicon.ico' },
  'pinnacle':          { order: 2,  short: 'PIN',  accent: '#ef4444', faviconUrl: 'https://www.pinnacle.com/favicon.ico' },
  'pinnacle-sports':   { order: 2,  short: 'PIN',  accent: '#ef4444', faviconUrl: 'https://www.pinnacle.com/favicon.ico' },
  'betfair':           { order: 3,  short: 'BF',   accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'betfair-exchange':  { order: 3,  short: 'BFX',  accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'betfair-sportsbook':{ order: 4,  short: 'BF',   accent: '#f59e0b', faviconUrl: 'https://www.betfair.com/favicon.ico' },
  'william-hill':      { order: 5,  short: 'WH',   accent: '#1d4ed8', faviconUrl: 'https://www.williamhill.com/favicon.ico' },
  'williamhill':       { order: 5,  short: 'WH',   accent: '#1d4ed8', faviconUrl: 'https://www.williamhill.com/favicon.ico' },
  'unibet':            { order: 6,  short: 'UNI',  accent: '#16a34a', faviconUrl: 'https://www.unibet.com/favicon.ico' },
  'betano':            { order: 7,  short: 'BTN',  accent: '#f97316', faviconUrl: 'https://www.betano.com/favicon.ico' },
  'bwin':              { order: 8,  short: 'BWN',  accent: '#facc15', faviconUrl: 'https://www.bwin.com/favicon.ico' },
  'betway':            { order: 9,  short: 'BTW',  accent: '#22c55e', faviconUrl: 'https://www.betway.com/favicon.ico' },
  '1xbet':             { order: 10, short: '1X',   accent: '#2563eb', faviconUrl: 'https://www.1xbet.com/favicon.ico' },
  '1x-bet':            { order: 10, short: '1X',   accent: '#2563eb', faviconUrl: 'https://www.1xbet.com/favicon.ico' },
  'marathonbet':       { order: 11, short: 'MAR',  accent: '#0ea5e9', faviconUrl: 'https://www.marathonbet.com/favicon.ico' },
  'marathon-bet':      { order: 11, short: 'MAR',  accent: '#0ea5e9', faviconUrl: 'https://www.marathonbet.com/favicon.ico' },
  'betclic':           { order: 12, short: 'BC',   accent: '#ef4444', faviconUrl: 'https://www.betclic.com/favicon.ico' },
  'interwetten':       { order: 13, short: 'IW',   accent: '#e11d48' },
  '888sport':          { order: 14, short: '888',  accent: '#0ea5e9', faviconUrl: 'https://www.888sport.com/favicon.ico' },
  '888-sport':         { order: 14, short: '888',  accent: '#0ea5e9', faviconUrl: 'https://www.888sport.com/favicon.ico' },
  'ladbrokes':         { order: 15, short: 'LAD',  accent: '#ef4444', faviconUrl: 'https://www.ladbrokes.com/favicon.ico' },
  'coral':             { order: 16, short: 'COR',  accent: '#06b6d4', faviconUrl: 'https://www.coral.co.uk/favicon.ico' },
  'paddy-power':       { order: 17, short: 'PP',   accent: '#16a34a', faviconUrl: 'https://www.paddypower.com/favicon.ico' },
  'paddypower':        { order: 17, short: 'PP',   accent: '#16a34a', faviconUrl: 'https://www.paddypower.com/favicon.ico' },
  'skybet':            { order: 18, short: 'SKY',  accent: '#2563eb', faviconUrl: 'https://www.skybet.com/favicon.ico' },
  'sky-bet':           { order: 18, short: 'SKY',  accent: '#2563eb', faviconUrl: 'https://www.skybet.com/favicon.ico' },
  'sportingbet':       { order: 19, short: 'SPB',  accent: '#22c55e' },
  'sporting-bet':      { order: 19, short: 'SPB',  accent: '#22c55e' },
  'betsson':           { order: 20, short: 'BTS',  accent: '#2563eb', faviconUrl: 'https://www.betsson.com/favicon.ico' },
  'nordicbet':         { order: 21, short: 'NB',   accent: '#06b6d4' },
  'nordic-bet':        { order: 21, short: 'NB',   accent: '#06b6d4' },
  'betsafe':           { order: 22, short: 'SAFE', accent: '#2563eb' },
  'coolbet':           { order: 23, short: 'COOL', accent: '#7c3aed' },
  'fortuna':           { order: 24, short: 'FOR',  accent: '#eab308' },
  'superbet':          { order: 25, short: 'SB',   accent: '#ef4444' },
  'super-bet':         { order: 25, short: 'SB',   accent: '#ef4444' },
};
```

- [ ] **Step 3: Update `getBookmakerMeta` to pass through `faviconUrl`**

```ts
export function getBookmakerMeta(name: string): BookmakerMeta {
  const slug = bookmakerNameToSlug(name);
  const seed = resolveMetaSeed(slug);

  return {
    slug,
    name,
    logoText: seed?.short ?? fallbackShort(name),
    short: seed?.short ?? fallbackShort(name),
    order: seed?.order ?? 999,
    accent: seed?.accent ?? '#64748b',
    faviconUrl: seed?.faviconUrl ?? null,
  };
}
```

- [ ] **Step 4: Create a shared `BookmakerAvatar` component in `components/shared/BookmakerAvatar.tsx`**

```tsx
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
            // Fall back to text on load failure
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
```

- [ ] **Step 5: Use `BookmakerAvatar` in `OddsComparison.tsx`**

In `OddsComparison.tsx`, import `BookmakerAvatar` at the top:

```tsx
import { BookmakerAvatar } from '@/components/shared/BookmakerAvatar';
```

Find the bookmaker row avatar (currently an `<a>` tag with an inline style circle):

```tsx
<a
  href={generalHref}
  ...
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    ...
  }}
>
  {meta.logoText}
</a>
```

Replace the inner content with `BookmakerAvatar` while keeping the `<a>` wrapper for the link:

```tsx
<a
  href={generalHref}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  style={{ textDecoration: 'none', flexShrink: 0 }}
>
  <BookmakerAvatar bookmakerName={odd.bookmaker} size={22} />
</a>
```

Also remove the now-unused `getBookmakerMeta` call and `meta` variable from the row render if it was only used for the avatar.

- [ ] **Step 6: Use `BookmakerAvatar` in `BestOddsBar.tsx`**

In `BestOddsBar.tsx`, import `BookmakerAvatar`:

```tsx
import { BookmakerAvatar } from '@/components/shared/BookmakerAvatar';
```

In the default variant `OddsRow` function, find:

```tsx
<span
  className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black tracking-[0.08em]"
  style={{ background: `${meta.accent}18`, color: meta.accent, border: `1px solid ${meta.accent}33` }}
>
  {meta.logoText}
</span>
```

Replace with:

```tsx
<BookmakerAvatar bookmakerName={bookmaker} size={32} />
```

In the compact variant, find the similar 28px circle:

```tsx
<span
  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-black tracking-[0.08em]"
  style={{ background: `${meta.accent}18`, color: meta.accent, border: `1px solid ${meta.accent}33` }}
>
  {meta.logoText}
</span>
```

Replace with:

```tsx
<BookmakerAvatar bookmakerName={bookmaker} size={28} />
```

Remove the now-unused `meta` variable from both render paths if applicable.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

## Task 4: Replace `^`/`v` movement indicators with proper arrows

**Files:**
- Modify: `components/odds/OddsComparison.tsx`
- Modify: `components/odds/BestOddsBar.tsx`

Both files use `'^'` and `'v'` as up/down movement indicators. Replace with Unicode ↑/↓.

- [ ] **Step 1: In `OddsComparison.tsx`, find `OddPill` — the movement span**

```tsx
{movement === 'up' ? '^' : 'v'}
```

Replace with:

```tsx
{movement === 'up' ? '↑' : '↓'}
```

- [ ] **Step 2: In `OddsComparison.tsx`, find the `bestOutcomes` grid movement span**

```tsx
{movement === 'up' ? '^' : 'v'}
```

Replace with:

```tsx
{movement === 'up' ? '↑' : '↓'}
```

- [ ] **Step 3: In `BestOddsBar.tsx`, find the compact variant movement span**

```tsx
{movement === 'up' ? '\u2191' : '\u2193'}
```

This one already uses proper Unicode — verify it's correct (it is). No change needed here.

- [ ] **Step 4: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep -E "OddsComparison|BestOddsBar"
```

Expected: no output.

---

## Task 5: Strengthen the BET CTA button in `BestOddsBar`

**Files:**
- Modify: `components/odds/BestOddsBar.tsx`

The "BET" button uses a generic `cta-btn` class. Make it unmissably green.

- [ ] **Step 1: In `BestOddsBar.tsx`, find the `OddsRow` function's BET anchor**

```tsx
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  className="cta-btn flex-shrink-0 px-4 py-2 text-[12px] font-bold tracking-wide"
  style={{ textDecoration: 'none', whiteSpace: 'nowrap', borderRadius: '8px' }}
  onClick={(e) => e.stopPropagation()}
>
  BET
</a>
```

Replace with:

```tsx
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  className="flex-shrink-0"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 18px',
    borderRadius: 8,
    background: 'var(--t-accent)',
    color: '#000',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: 36,
    transition: 'opacity 0.15s',
  }}
  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
  onClick={(e) => e.stopPropagation()}
>
  BET ↗
</a>
```

- [ ] **Step 2: In the compact variant, find the "Open" button**

```tsx
<a
  href={href}
  ...
  className="chrome-btn flex-shrink-0 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
  style={{ textDecoration: 'none' }}
  ...
>
  Open
</a>
```

Replace with:

```tsx
<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: 6,
    background: 'var(--t-accent)',
    color: '#000',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: 30,
    transition: 'opacity 0.15s',
  }}
  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
  onClick={(e) => e.stopPropagation()}
>
  BET ↗
</a>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep BestOddsBar
```

Expected: no output.

---

## Task 6: Improve `FixtureRow` odds buttons — taller buttons, larger bookmaker label, hover feedback

**Files:**
- Modify: `components/fixtures/FixtureRow.tsx`

Three changes in one task since they're all in `OddsButton`:
1. Button height 32px → 40px
2. Bookmaker label font-size 7px → 9px  
3. Add a hover tooltip showing "Open {value} at {bookmaker} ↗"

- [ ] **Step 1: In `FixtureRow.tsx`, find `OddsButton`'s `buttonStyle` object**

Change `height: 32` to `height: 40`:

```tsx
const buttonStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  height: 40,       // was 32
  borderRadius: 6,
  border: '1px solid var(--t-border)',
  background: 'var(--t-surface-2)',
  cursor: value && bookmaker ? 'pointer' : 'default',
  position: 'relative',
  overflow: 'hidden',
  textDecoration: 'none',
  padding: 0,
  width: '100%',
  ...(flashAnimation ? { animation: flashAnimation } : {}),
};
```

- [ ] **Step 2: In `OddsButton`, find the bookmaker name label span and update fontSize from 7 to 9**

```tsx
<span
  style={{
    fontSize: 9,          // was 7
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--t-text-5)',
    lineHeight: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}
>
  {bookmaker ?? label}
</span>
```

- [ ] **Step 3: Add hover tooltip to the `<a>` odds link in `OddsButton`**

Find the anchor element returned when `value && bookmaker`:

```tsx
return (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    aria-label={`${value.toFixed(2)} at ${bookmaker} — ${label}`}
    style={buttonStyle as React.CSSProperties}
  >
    {inner}
  </a>
);
```

Replace with (adds `title` tooltip and hover border brightening):

```tsx
return (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    aria-label={`${value.toFixed(2)} at ${bookmaker} — ${label}`}
    title={`Open ${value.toFixed(2)} at ${bookmaker} ↗`}
    style={buttonStyle as React.CSSProperties}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,230,118,0.4)';
      (e.currentTarget as HTMLElement).style.background = 'rgba(0,230,118,0.07)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = 'var(--t-border)';
      (e.currentTarget as HTMLElement).style.background = 'var(--t-surface-2)';
    }}
  >
    {inner}
  </a>
);
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep FixtureRow
```

Expected: no output.

---

## Task 7: Add live dot to league headers in `FixtureTable`

**Files:**
- Modify: `components/fixtures/FixtureTable.tsx`

The sticky league group headers in `FixtureTable` already know how many fixtures are in each group. They also have access to `liveOddsByFixture` (prop) and `items` (per-group fixtures). Use `items` to count live fixtures and show a pulsing red dot + count.

- [ ] **Step 1: In `FixtureTable.tsx`, find the league group header render inside `sortedLeagueEntries.map`**

It currently looks like:

```tsx
<div
  className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2"
  style={{
    background: 'var(--t-page-bg)',
    borderBottom: '1px solid var(--t-border)',
    borderTop: '1px solid var(--t-border)',
  }}
>
  ...
  {oddsCount > 0 && (
    <span className="text-[10px]" style={{ color: 'var(--t-text-6)' }}>
      {oddsCount}/{items.length} with odds
    </span>
  )}
  <span
    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
    style={{ background: 'var(--t-surface-2)', color: 'var(--t-text-5)', border: '1px solid var(--t-border)' }}
  >
    {items.length}
  </span>
</div>
```

- [ ] **Step 2: Add a `liveFixtureCount` variable just before the `return` inside `sortedLeagueEntries.map`**

Add this line immediately after the existing `oddsCount` calculation:

```tsx
const liveFixtureCount = items.filter((f) => f.stateBucket === 'Live').length;
```

- [ ] **Step 3: Add the live indicator into the header div, after the league name span**

Add after the `{name}` span and before the `{oddsCount > 0 && ...}` block:

```tsx
{liveFixtureCount > 0 && (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '1px 7px',
      borderRadius: 999,
      background: 'rgba(239,83,80,0.12)',
      border: '1px solid rgba(239,83,80,0.3)',
      fontSize: 10,
      fontWeight: 700,
      color: '#fca5a5',
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#ef4444',
        animation: 'live-pulse 1.4s ease-in-out infinite',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
    {liveFixtureCount} live
  </span>
)}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep FixtureTable
```

Expected: no output.

---

## Task 8: Add live dot per league in the sidebar

**Files:**
- Modify: `components/layout/FootballSidebarContent.tsx`

The sidebar fetches all leagues but doesn't know which have live fixtures. The live fixture count is available from `useLiveFixtureCount` (used in `Topbar`) but that's a global count. We need per-league live counts. The sidebar has access to `useLeagues` data — we need to also connect to the live fixture IDs from the page context.

Looking at the sidebar context system (`lib/fixture-page-sidebar-context.ts` is already imported in `FootballSidebarContent`), the sidebar receives `FixturePageSidebarContext` which includes fixture data from the current page. We can derive live counts from that context.

- [ ] **Step 1: Read `lib/fixture-page-sidebar-context.ts` to understand the shape**

```bash
cat "c:/Users/joret/Desktop/New folder/smartbets/lib/fixture-page-sidebar-context.ts"
```

Read the output and confirm what fields `FixturePageSidebarContext` has.

- [ ] **Step 2: In `FootballSidebarContent.tsx`, find where `sidebarContext` is read and used**

Look for usage of `readFixturePageSidebarContext()` or `FIXTURE_PAGE_SIDEBAR_CONTEXT_EVENT`. The context is already being read — find the variable name and its shape.

- [ ] **Step 3: Derive a `liveLeagueIds` set from the sidebar context**

In `FootballSidebarContent.tsx`, after the existing context state is read, add:

```tsx
const liveLeagueIds = useMemo(() => {
  if (!sidebarContext?.fixtures) return new Set<number>();
  return new Set(
    sidebarContext.fixtures
      .filter((f) => f.stateBucket === 'Live')
      .map((f) => f.leagueApiId)
  );
}, [sidebarContext]);
```

> Note: if `sidebarContext.fixtures` doesn't exist by that name, adjust to whatever field contains the fixture list in the context shape you read in Step 1. If no fixture list exists in the context, use an empty Set and skip the dot indicator (leave the structure ready for future wiring).

- [ ] **Step 4: Find where individual league links are rendered in `FootballSidebarContent.tsx`**

Look for the JSX that renders a league `<Link>` or `<a>` in the sidebar. It likely iterates over `leagues` or `countryGroups`. Find the per-league row render.

- [ ] **Step 5: Add the live dot after the league name in each league link row**

In the per-league render, after the league name text, add:

```tsx
{liveLeagueIds.has(league.apiLeagueId) && (
  <span
    style={{
      display: 'inline-block',
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#ef4444',
      flexShrink: 0,
      animation: 'live-pulse 1.4s ease-in-out infinite',
      marginLeft: 4,
    }}
    aria-label="Has live fixtures"
  />
)}
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep FootballSidebarContent
```

Expected: no output.

---

## Task 9: Replace Unicode star ☆/★ with SVG bookmark icon

**Files:**
- Modify: `components/fixtures/FixtureRow.tsx`
- Modify: `components/fixtures/FixtureTable.tsx` (MobileFixtureCard)

Both the desktop `FixtureRow` and the mobile `MobileFixtureCard` use `'★'`/`'☆'`. Replace with a consistent SVG bookmark.

- [ ] **Step 1: Add a `BookmarkIcon` helper near the top of `FixtureRow.tsx`**

```tsx
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={14}
      height={14}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 2h10a1 1 0 0 1 1 1v15l-6-3.5L4 18V3a1 1 0 0 1 1-1z" />
    </svg>
  );
}
```

- [ ] **Step 2: In `FixtureRow.tsx`, find the save button that renders `isSaved ? '★' : '☆'`**

Replace the emoji content:

```tsx
<button
  type="button"
  onClick={handleToggleSave}
  style={{
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: isSaved ? 'var(--t-accent)' : 'var(--t-text-5)',
    padding: 0,
  }}
  aria-label={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
  title={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
>
  <BookmarkIcon filled={isSaved} />
</button>
```

- [ ] **Step 3: In `FixtureTable.tsx`, find the `MobileFixtureCard` save button that renders `isSaved ? '★' : '☆'`**

Add the same `BookmarkIcon` function at the top of `FixtureTable.tsx`:

```tsx
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={13}
      height={13}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 2h10a1 1 0 0 1 1 1v15l-6-3.5L4 18V3a1 1 0 0 1 1-1z" />
    </svg>
  );
}
```

Replace in `MobileFixtureCard`'s save button:

```tsx
<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    onToggleSave?.(fixture);
  }}
  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border"
  style={{
    background: isSaved ? 'rgba(0,230,118,0.12)' : 'transparent',
    borderColor: isSaved ? 'rgba(0,230,118,0.28)' : 'transparent',
    color: isSaved ? 'var(--t-accent)' : 'var(--t-text-6)',
  }}
  aria-label={isSaved ? 'Remove fixture from watchlist' : 'Save fixture to watchlist'}
>
  <BookmarkIcon filled={isSaved} />
</button>
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep -E "FixtureRow|FixtureTable"
```

Expected: no output.

---

## Task 10: Improve empty state — contextual messaging

**Files:**
- Modify: `components/shared/EmptyState.tsx`

The current `EmptyState` has a football emoji (⚽) but is otherwise plain text. Add a contextual sub-icon variant and improve the visual treatment.

- [ ] **Step 1: Update `EmptyState.tsx` with an improved layout**

```tsx
interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--t-border)',
          marginBottom: 16,
          fontSize: 28,
        }}
      >
        {icon ?? '⚽'}
      </div>
      <h3
        className="text-[15px] font-semibold mb-2"
        style={{ color: 'var(--t-text-2)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[13px] max-w-xs leading-relaxed"
          style={{ color: 'var(--t-text-4)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Update the call site in `FixtureTable.tsx` to use a contextual description**

Find:

```tsx
<EmptyState title="No fixtures" description="No matches found for the selected date or filters." />
```

Replace with:

```tsx
<EmptyState
  title="No fixtures found"
  description="Try a different date or remove your league filter to see more matches."
  icon="📅"
/>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep EmptyState
```

Expected: no output.

---

## Task 11: Permanent dimmed live counter in topbar

**Files:**
- Modify: `components/layout/Topbar.tsx`

The live counter renders only when `liveCount > 0`. Make it always visible — dimmed at 0, active when count > 0.

- [ ] **Step 1: In `Topbar.tsx`, find the conditional live count button**

```tsx
{liveCount > 0 ? (
  <button
    type="button"
    onClick={() => router.push('/football?state=Live')}
    className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold md:inline-flex"
    style={{
      background: 'rgba(0,230,118,0.12)',
      border: '1px solid rgba(0,230,118,0.3)',
      color: 'var(--t-accent)',
      cursor: 'pointer',
    }}
    aria-label={`${liveCount} live fixtures — click to view`}
  >
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--t-accent)',
        animation: 'live-pulse 1.4s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
    {liveCount} Live
  </button>
) : null}
```

- [ ] **Step 2: Replace with always-visible version**

```tsx
<button
  type="button"
  onClick={() => router.push('/football?state=Live')}
  className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold md:inline-flex"
  style={{
    background: liveCount > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
    border: liveCount > 0 ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.07)',
    color: liveCount > 0 ? 'var(--t-accent)' : 'var(--t-text-5)',
    cursor: 'pointer',
    transition: 'background 0.3s, border-color 0.3s, color 0.3s',
  }}
  aria-label={liveCount > 0 ? `${liveCount} live fixtures — click to view` : 'No live fixtures'}
>
  <span
    style={{
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: liveCount > 0 ? 'var(--t-accent)' : 'var(--t-text-5)',
      animation: liveCount > 0 ? 'live-pulse 1.4s ease-in-out infinite' : 'none',
      flexShrink: 0,
    }}
    aria-hidden="true"
  />
  {liveCount} Live
</button>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1 | grep Topbar
```

Expected: no output.

---

## Task 12: Final type-check and visual review

- [ ] **Step 1: Run full TypeScript check across the project**

```bash
cd "c:/Users/joret/Desktop/New folder/smartbets" && npx tsc --noEmit 2>&1
```

Expected: no errors. Fix any that appear before proceeding.

- [ ] **Step 2: Open the dev server and visually check each change**

Navigate to `http://localhost:3000/football` and verify:

1. Date filter has SVG chevron arrows (not `<` `>`)
2. Mobile bottom nav inactive tabs are more visible (not near-invisible)
3. Bookmaker circles show favicon images where available, text fallback otherwise
4. Odds panel `^`/`v` replaced by `↑`/`↓`
5. BET buttons are bold green with black text
6. Odds buttons on desktop are 40px tall, bookmaker name at 9px
7. Hovering an odds button shows a tooltip and green border highlight
8. League headers show red live dot when live fixtures exist in that group
9. Sidebar shows live dot next to leagues with live fixtures (if fixture context available)
10. Watchlist buttons use bookmark SVG icon
11. Empty state shows calendar icon and improved copy
12. Topbar live counter always visible, dimmed when count is 0

- [ ] **Step 3: Check mobile (resize browser to 390px width)**

Verify fixture rows, odds buttons, and bottom nav all look correct at mobile widths.
