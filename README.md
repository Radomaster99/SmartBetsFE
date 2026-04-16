# OddsDetector Frontend

Next.js 16 frontend for live football odds monitoring, fixture detail workflows, admin-controlled content, and API-Sports widgets.

## Commands

```bash
npm install
npm run dev
npm run build
npm run start
```

## Production Docs

- Deploy checklist and exact env vars: [docs/frontend-production-deploy.md](docs/frontend-production-deploy.md)
- Admin content backend migration plan: [docs/admin-content-backend-migration-plan.md](docs/admin-content-backend-migration-plan.md)

## Required Frontend Env Vars

These are the exact frontend-side variables the current code expects.

```env
SMARTBETS_API_BASE_URL=https://api.oddsdetector.com
NEXT_PUBLIC_API_BASE_URL=https://api.oddsdetector.com
API_KEY=your-backend-api-key
NEXT_PUBLIC_DEFAULT_SEASON=2026
NEXT_PUBLIC_WIDGET_KEY=your-api-sports-widget-key
ADMIN_AUTH_COOKIE_NAME=oddsdetector_admin
```

Important:
- `SMARTBETS_API_BASE_URL` is still the real server-side env key. The name is legacy, but the code still uses it.
- `NEXT_PUBLIC_API_BASE_URL` is required for browser-side live SignalR and direct public backend calls.
- `ADMIN_AUTH_COOKIE_NAME` must match the backend `AdminAuth__CookieName`.

## Production Notes

- Admin auth now uses the backend httpOnly cookie session flow.
- `/admin/*` and `/api/admin/*` are protected by `proxy.ts`.
- Browser-local admin content still needs a backend migration before it becomes global for all admins and all devices.
