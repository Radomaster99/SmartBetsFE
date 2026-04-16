# Admin Content Backend Migration Plan

This plan covers the frontend-controlled content that is still stored in browser `localStorage` and therefore is not global yet.

## 1. Current Browser-Local Content

The following content is currently local to one browser profile:

- Bonus codes
  - `lib/bonus-codes.ts`
- Hero banners
  - `lib/hero-banners.ts`
- Side ads
  - `lib/side-ads.ts`
- Popular league defaults
  - `lib/popular-leagues.ts`

Current consequence:
- Admin edits are visible only in the browser that created them.
- A second admin, another machine, or production visitors will not see those edits automatically.

## 2. Target State

Admin content should become:

- server-backed
- shared across all admins
- visible to all visitors
- still editable from the existing admin UI

Frontend goal:
- public pages read content from backend read endpoints
- admin pages read and write content through admin endpoints
- `localStorage` becomes only a temporary migration fallback, not the source of truth

## 3. Recommended Backend Shape

Use one public read layer plus one admin write layer.

### Public read endpoints

```text
GET /api/content/bonus-codes
GET /api/content/hero-banners
GET /api/content/side-ads
GET /api/content/popular-leagues
```

### Admin endpoints

```text
GET   /api/admin/content/bonus-codes
PUT   /api/admin/content/bonus-codes

GET   /api/admin/content/hero-banners
PUT   /api/admin/content/hero-banners

GET   /api/admin/content/side-ads
PUT   /api/admin/content/side-ads

GET   /api/admin/content/popular-leagues
PUT   /api/admin/content/popular-leagues
```

`PUT` is the cleanest fit because the current admin UI already edits whole documents, not tiny field-level patches.

## 4. Recommended DTO Reuse

The frontend already has stable shapes that can be reused as backend contracts.

### Bonus codes

- `BonusCodesPageConfig`
- `BonusCodeEntry`

Source:
- `lib/bonus-codes.ts`

### Hero banners

- `HeroBannerConfig[]`
- `HeroBannerLayoutConfig`

Source:
- `lib/hero-banners.ts`

### Side ads

- `SideAdsConfig`

Source:
- `lib/side-ads.ts`

### Popular leagues

- `PopularLeaguePreset[]`

Source:
- `lib/popular-leagues.ts`

## 5. Frontend Migration Phases

### Phase 1: Read-through backend support

Frontend changes:
- public pages first try backend read endpoints
- if backend content is missing, fallback to current local defaults
- admin pages still work with current UI

Goal:
- ship backend storage without breaking the current frontend

### Phase 2: Admin writes go server-side

Frontend changes:
- admin save actions switch from `localStorage` writes to admin `PUT` endpoints
- success refreshes public/admin query caches
- local browser storage becomes a non-authoritative backup only

Goal:
- make edits global without redesigning the admin UI

### Phase 3: Controlled local migration

Recommended approach:
- keep old `localStorage` keys untouched
- add an admin-only import action if you want to preserve an existing browser’s drafted content
- do not automatically overwrite backend data from local storage on page load

Reason:
- automatic browser-to-backend overwrites are risky in production

### Phase 4: Retire local-only persistence

Once backend content is live and verified:
- stop reading browser-local admin content by default
- keep only optional export/import utilities if useful

## 6. Important Product Decision

Do not rename existing `smartbets:*` localStorage keys during the migration itself.

Reason:
- renaming those keys now adds migration risk
- the brand rename to `OddsDetector` is user-facing
- storage keys are internal and can be cleaned up later in a separate data migration pass

## 7. Lowest-Risk Rollout Order

1. Backend adds read endpoints.
2. Frontend consumes read endpoints with fallback.
3. Backend adds admin write endpoints.
4. Frontend switches admin saves to backend.
5. Admin manually verifies live content on production.
6. Local-only storage is retired later.
