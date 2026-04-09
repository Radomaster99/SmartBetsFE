# SmartBets Claude Guide

Read this file before making changes in this app.

## First things to understand

- This folder contains the frontend application.
- The frontend is a Next.js 16 App Router project using React 19, TypeScript, Tailwind 4, and TanStack Query.
- This app is not the system of record for sports data. It is a dashboard UI that talks to a separate backend API.
- The backend API contract is documented in the workspace root file `../api-endpoints.md`.
- Read `AGENTS.md` too. Its Next.js warning still applies.

## Workspace layout

- `../api-endpoints.md`
  - Backend API documentation for the service this frontend calls.
  - Includes sync endpoints, read endpoints, DTO shapes, and important ID conventions.
- `app/`
  - App Router pages and local route handlers.
- `app/api/`
  - Thin Next.js route handlers that proxy requests to the real backend API.
  - Treat these as a frontend BFF/proxy layer, not as the source of business truth.
- `components/`
  - UI building blocks for fixtures, odds, standings, layout, widgets, and shared states.
- `lib/api/`
  - Backend client wrappers used by route handlers and some server-side code.
- `lib/hooks/`
  - React Query hooks for client-side data fetching through local Next.js API routes.
- `lib/types/`
  - Shared DTO and filter types that mirror backend payloads.

## Product overview

SmartBets is a football-focused odds monitoring dashboard.

Primary business goal:

- Help bettors compare prices quickly and route them to the right bookmaker with as little friction and confusion as possible.
- The site is not just an information dashboard. It should become a conversion-focused comparison product where bookmaker referrals are a core outcome.

Core UX goal:

- Make the product feel obvious to heavy betting users.
- Important information should be fast to scan, easy to compare, and never hidden behind unclear navigation or unnecessary complexity.
- When in doubt, prefer clarity, speed, and confidence over feature sprawl.

Current active areas:

- Football fixtures list with filters for date, state, and league
- Fixture detail view with odds and embedded widgets
- Standings view
- League navigation grouped by country, with pinned leagues and popular leagues
- Admin sync dashboard for triggering backend sync jobs and checking freshness

Current placeholder areas:

- Tennis
- CS2

## How requests flow

Use this mental model:

1. Browser UI calls local Next.js API routes such as `/api/fixtures/query`.
2. Those route handlers call helpers in `lib/api/*`.
3. `lib/api/client.ts` forwards requests to the real backend base URL from environment variables.
4. The backend reads from its own database and exposes the contract described in `../api-endpoints.md`.

Important consequence:

- When changing frontend behavior, verify whether the change belongs in:
  - client components and hooks,
  - local Next.js proxy routes,
  - or the separate backend described in `../api-endpoints.md`.

## Key app entry points

- `app/layout.tsx`
  - Global shell with topbar, sidebar, theme init, query provider, and widget provider.
- `app/page.tsx`
  - Redirects to `/football`.
- `app/football/page.tsx`
  - Main fixtures page and the primary product entry point.
  - Reads filters from URL search params and keeps them canonical.
- `app/football/fixtures/[fixtureId]/page.tsx`
  - Fixture detail page with tabs for match, h2h, odds, and team/player widgets.
- `app/football/standings/page.tsx`
  - Standings page driven by league selection and widget rendering.
- `app/admin/sync/page.tsx`
  - Operational dashboard for sync status and manual sync actions.

## Data-fetching conventions

- Client components generally use hooks from `lib/hooks/*`.
- Hooks call local Next routes under `app/api/*`, not the remote backend directly.
- React Query is configured in `components/providers/QueryProvider.tsx`.
- The remote backend base URL is configured in `lib/api/client.ts`.

Examples:

- `useFixtures` -> `/api/fixtures/query`
- `useFixtureDetail` -> `/api/fixtures/[fixtureId]`
- `useOdds` and `useBestOdds` -> fixture odds endpoints
- `useLeagues` and `useCountries` -> list endpoints
- `useSyncStatus` -> `/api/sync-status`

## Current product state

Recent product direction changes already in the codebase:

- The product is now intentionally odds-first for betting users.
- On fixture detail pages, the default landing tab for normal use should be the odds/comparison experience rather than the match widget.
- Public user-facing surfaces should avoid admin or sync-ops language where possible. Freshness should be framed in bettor terms like "Odds updated X min ago".
- Bookmaker actions should preserve comparison context by opening in a new tab rather than replacing the current page.

Current referral plumbing:

- `app/go/[slug]/route.ts`
  - Central redirect route for bookmaker outbound clicks
  - Intended to support attribution, tracking, and future affiliate routing
- `lib/bookmakers.ts`
  - Temporary frontend-side bookmaker registry and slug mapping
  - This is a transitional solution, not the ideal long-term source of truth

## Widgets are a major subsystem

This app mixes two data sources:

- Your own backend for normalized fixture, league, odds, and sync data
- API-Sports widgets for rich match/team/player/standings embeds

Relevant files:

- `components/widgets/WidgetsProvider.tsx`
- `components/widgets/ApiSportsWidget.tsx`
- `components/widgets/widget-runtime.tsx`
- `components/widgets/WidgetConfig.tsx`

Important notes:

- Widgets depend on a widget key from environment variables.
- Widget script loading and readiness are handled globally.
- Some pages intentionally combine backend data and widget output in the same screen.
- These are web components, not normal React components. Our React wrapper creates `<api-sports-widget>` elements and sets `data-*` attributes on them.
- Widgets are already custom-themed in this project. The global config uses `data-theme="SmartBets"` and the actual theme variables and widget-specific overrides live in `app/globals.css`.
- The app also has dark and light theme support, and widget colors are coordinated with that theme system. Preserve this behavior when changing widget styling.

### Widget types used in this project

Only document the widget modes we actually use here:

- `game`
  - Used on fixture detail pages for match/event information
  - Common attrs set by our wrapper: `data-game-id`, `data-game-tab`, `data-refresh`
- `h2h`
  - Used on fixture detail pages for head-to-head views
  - Common attrs: `data-h2h`
- `team`
  - Used when a user selects a team from a fixture
  - Common attrs: `data-team-id`, `data-team-tab`, `data-team-squad`, `data-team-statistics`
- `player`
  - Used after selecting a player from the team widget
  - Common attrs: `data-player-id`, `data-player-statistics`, `data-player-trophies`, `data-player-injuries`
- `standings`
  - Used on the standings page
  - Common attrs: `data-league`, `data-season`

### How to reason about widget changes

- Prefer changing `components/widgets/ApiSportsWidget.tsx` instead of scattering raw widget markup across pages.
- When adding a new widget mode, follow the existing pattern:
  - accept typed React props,
  - map them to the correct `data-*` attributes,
  - mount a single `<api-sports-widget>` element,
  - preserve loading and error handling.
- If widget behavior is unclear, confirm against the official widget docs before changing attributes or inventing new ones.

Official widget docs:

- `https://api-sports.io/documentation/widgets/v3`

## Navigation and page behavior

- `components/layout/Sidebar.tsx`
  - Main sport navigation.
- `components/layout/FootballSidebarContent.tsx`
  - Football-specific secondary navigation.
  - Builds popular leagues, pinned leagues, country groups, and per-league links.
- The football UI stores some navigation state in `sessionStorage` and `localStorage`.
  - Example: last matches href
  - Example: pinned leagues
  - Example: theme

## Important backend assumptions from `../api-endpoints.md`

Claude should understand these before changing anything that touches API behavior:

- Read endpoints are expected to return data from the backend database, not directly from API-Football.
- Sync endpoints are the ones that pull data from API-Football and update the backend database.
- Fixture pages should prefer paged reads through `GET /api/fixtures/query`.
- Fixture detail uses API fixture IDs in routes such as `/api/fixtures/{apiFixtureId}`.
- The backend contract mixes local database IDs and API-Football IDs. Be careful not to confuse them.

Most important ID rule:

- For frontend routing and external lookups, prefer API IDs when the backend contract is built around them.
- Example:
  - `FixtureDto.id` is local
  - `FixtureDto.apiFixtureId` is external/API-facing

## Environment variables to know about

Common variables referenced by the frontend:

- `NEXT_PUBLIC_API_BASE_URL`
  - Base URL of the real backend API
- `API_KEY`
  - Optional API key sent as `X-API-KEY` by the Next.js proxy layer
- `NEXT_PUBLIC_DEFAULT_SEASON`
  - Default football season used in filters and navigation
- `NEXT_PUBLIC_WIDGET_KEY`
- `WIDGET_KEY`
- `NEXT_PUBLIC_API_SPORTS_WIDGET_KEY`
- `API_SPORTS_WIDGET_KEY`
  - Widget auth keys for API-Sports embeds

## Product principles for future changes

- Optimize for bettor workflows, not generic sports browsing.
- Comparison and routing matter more than decorative depth.
- The user should be able to answer these questions quickly:
  - What matches matter to me right now?
  - Where is the best available price?
  - Which bookmaker should I open next?
- Reduce ambiguity in labels, filters, navigation, and CTAs.
- If a screen does not help comparison, trust, or referral conversion, question its priority.
- Best-odds presentation, bookmaker trust cues, and click-through paths are strategic features, not minor UI details.

## Known quirks

- Some UI strings show character encoding issues such as malformed dash symbols. Do not treat those as intentional.
- `api-endpoints.md` is highly valuable context even though it sits outside the app folder.
- There is at least one local team route under `app/api/teams/[teamId]/route.ts`, so do not assume the earlier route list is exhaustive without checking the tree.

## Safe working rules for Claude

- Before changing API-related code, read the relevant section in `../api-endpoints.md`.
- Before changing a route parameter or DTO usage, confirm whether the code expects a local ID or an API ID.
- Do not assume tennis or CS2 are implemented just because the routes exist.
- Preserve the existing split between local proxy routes and the real backend unless the task explicitly asks to change it.
- If a requested feature requires backend behavior that is not represented in `app/api/*` or `lib/api/*`, call that out clearly.

## Implementation decisions — read before touching these areas

### Odds logic is centralised in one hook
`lib/hooks/useFixtureOddsData.ts` is the single source of truth for all odds logic. Both the desktop side panel (`components/fixtures/FixtureDetailPanel.tsx`) and the mobile full page (`app/football/fixtures/[fixtureId]/page.tsx`) use it. Do not duplicate odds logic anywhere else. It handles:
- `useLiveOdds` + `useLiveOddsSignalR` (Bet365 live odds, only when `stateBucket === 'Live'`)
- Pre-match fallback when live odds are not yet available
- `resolvedBestOdds`, `displayOdds`, movement tracking with auto-clear timeouts
- Freshness label (`headerOddsLabel`)

### Desktop vs mobile fixture detail
- **Desktop**: clicking a fixture row opens `FixtureDetailPanel` (380px side panel). Has an "Open full page ↗" link for URL sharing.
- **Mobile**: clicking a fixture navigates to `/football/fixtures/[id]` (full page).
- Both use `useFixtureOddsData` — they are guaranteed to show the same logic.

### useFixtureWatchlist — do not reorder the effects
`lib/hooks/useFixtureWatchlist.ts` has two `useEffect` calls. The **persist effect must be declared first**, the **sync effect second**. React runs effects in declaration order. Reversing them causes a race condition where the persist effect writes `[]` to localStorage on mount before the sync effect has loaded the real data, wiping all saved matches.

### MobileSavedScreen receives entries as a prop
`components/layout/MobileSavedScreen.tsx` does NOT call `useFixtureWatchlist()` internally. It receives `entries: WatchlistFixtureEntry[]` as a prop from `AppShell`. This is intentional — a third hook instance caused a race condition that wiped localStorage. Do not add the hook back.

### CSS theme variables — known gotchas
- `--t-bg` does **not** exist. Use `--t-page-bg` or `--t-topbar-bg`.
- Dark mode values are semi-transparent (`rgba`). Full-screen overlays need an opaque fallback: `background: var(--t-page-bg, #07101a)`.
- `--t-accent` is `#00e676` (green).

### React 19 border shorthand warning
Do not mix `border` shorthand with `borderBottom` (or any specific side) on the same element — React 19 warns and it causes styling bugs on re-render. Use explicit sides: `borderTop`, `borderRight`, `borderLeft`, `borderBottom`.
