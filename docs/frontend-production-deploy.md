# Frontend Production Deploy

This document is the production handoff for the OddsDetector frontend.

## 1. Required Frontend Env Vars

Use these exact variable names.

```env
SMARTBETS_API_BASE_URL=https://api.oddsdetector.com
NEXT_PUBLIC_API_BASE_URL=https://api.oddsdetector.com
API_KEY=your-backend-api-key
NEXT_PUBLIC_DEFAULT_SEASON=2026
NEXT_PUBLIC_WIDGET_KEY=your-api-sports-widget-key
NEXT_PUBLIC_WIDGET_FOOTBALL_URL=https://oddsdetector-widgets.b-cdn.net/
NEXT_PUBLIC_WIDGET_MEDIA_URL=https://oddsdetector-widgets-media.b-cdn.net/
ADMIN_AUTH_COOKIE_NAME=oddsdetector_admin
```

Notes:
- `SMARTBETS_API_BASE_URL` is a legacy variable name. Keep it exactly as-is until a future env cleanup pass.
- `NEXT_PUBLIC_API_BASE_URL` must be set for browser-side SignalR and live widget flows.
- `API_KEY` is server-only. It is used by Next.js route handlers and must not be exposed in public client code.
- `NEXT_PUBLIC_WIDGET_KEY` powers API-Sports widgets in the direct mode fallback.
- `NEXT_PUBLIC_WIDGET_FOOTBALL_URL` points football widget data requests to the BunnyCDN pull zone. When this is set, the frontend intentionally leaves `data-key` blank in page source for football widget config.
- `NEXT_PUBLIC_WIDGET_MEDIA_URL` points widget logo/media requests to the BunnyCDN media pull zone.
- `ADMIN_AUTH_COOKIE_NAME` must match the backend cookie name exactly.

## 2. Matching Backend Settings

These backend settings must line up with the frontend deploy:

```env
AdminAuth__CookieName=oddsdetector_admin
CORS__AllowedOrigins=https://www.oddsdetector.com
```

If the frontend is hosted on a different origin from the backend and admin cookie auth is browser-based, also set:

```env
AdminAuth__CookieSameSite=None
```

Recommended production backend settings:

```env
Swagger__Enabled=false
```

And keep a dedicated production signing key:

```env
JwtAuth__SigningKey=your-long-production-signing-key
```

## 3. What Was Tightened For Production

- The frontend no longer silently falls back to a hardcoded backend URL.
- Admin auth is now real cookie-based auth, not a visual-only gate.
- `/admin/*` and `/api/admin/*` are protected through `proxy.ts`.
- The public brand is now `OddsDetector`.
- API-Sports widgets now use the `OddsDetector` custom theme name.

## 4. Deploy Checklist

Before going live:

1. Set all required frontend env vars.
2. Set backend CORS to include the exact frontend origin.
3. Make sure backend admin auth cookie name matches `ADMIN_AUTH_COOKIE_NAME`.
4. Build the frontend with `npm run build`.
5. Smoke test:
   - `/football`
   - `/football/fixtures/{id}`
   - `/bonus-codes`
   - `/admin/login`
   - `/admin/sync`
   - live SignalR connection on the football page

## 5. Known Remaining Production Gap

Admin-managed content is still browser-local for now:

- bonus codes
- hero banners
- side ads
- popular league defaults

That means content edits are not yet global across browsers or admins. The migration plan is documented in [admin-content-backend-migration-plan.md](admin-content-backend-migration-plan.md).
