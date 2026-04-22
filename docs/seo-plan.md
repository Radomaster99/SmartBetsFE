# OddsDetector SEO Plan

**Last updated:** 2026-04-22
**Baseline score:** ~6.5/10
**Target:** 10/10 technical SEO maturity + growing organic traffic

---

## Technical Fixes Completed (2026-04-22)

| Fix | File | Impact |
|-----|------|--------|
| Root description rewritten — removed "admin-controlled" language | `app/layout.tsx` | SERP snippet quality for all pages |
| WebSite + Organization JSON-LD added globally | `app/layout.tsx` | Brand knowledge panel eligibility |
| Default OG image created (1200×630) | `app/opengraph-image.tsx` | Social card previews on all pages |
| Bonus codes page: metadata + BreadcrumbList schema added | `app/bonus-codes/layout.tsx` | Page now indexable with correct signals |
| Tennis + CS2 placeholder pages set to noindex | `app/tennis/page.tsx`, `app/cs2/page.tsx` | Crawl budget saved |
| SportsEvent.eventStatus corrected to schema.org URIs | `app/football/fixtures/[fixtureId]/page.tsx` | Structured data validation |
| SportsEvent.location.address corrected to PostalAddress | `app/football/fixtures/[fixtureId]/page.tsx` | Structured data validation |
| SportsEvent: added organizer + description fields | `app/football/fixtures/[fixtureId]/page.tsx` | Richer event markup |
| CollectionPage schema enriched with inLanguage + sport | `app/football/standings/[leagueId]/[season]/[slug]/page.tsx` | Schema completeness |
| /football/leagues redirect removed from sitemap | `app/sitemap.ts` | Crawl signal clarity |
| /football/fixtures priority raised to 0.9, hourly | `app/sitemap.ts` | Crawl frequency for primary commercial page |

---

## 30-Day Plan (May 2026)

### Submit to search engines
- [ ] Submit sitemap (`/sitemap.xml`) to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for key pages in GSC: `/`, `/bonus-codes`, `/football/standings`, `/football/fixtures`
- [ ] Validate all structured data in Google Rich Results Test
- [ ] Validate OG images in Twitter Card Validator and Facebook Sharing Debugger

### Validate and monitor
- [ ] Check GSC Coverage report for any new crawl errors after deploy
- [ ] Check GSC Enhancements > Breadcrumbs and Sitelinks Searchbox
- [ ] Check GSC Enhancements > Events (SportsEvent) — may appear within 4–6 weeks
- [ ] Set up GSC email alerts for crawl errors

### Content quick wins
- [ ] Write a 300-word intro paragraph for `/bonus-codes` (currently hero copy only — no static text for crawlers). This is the highest-value content gap for a betting comparison page.
- [ ] Add a server-rendered `<p>` summary to `/football/fixtures` visible before JS loads — crawlers currently see almost no static content on the primary commercial page.

---

## 60-Day Plan (June 2026)

### Per-league landing pages
The highest-value SEO opportunity: dedicated static pages for top leagues with real copy, current standings summary, and upcoming fixtures. Target queries like "Premier League odds", "Champions League fixtures odds".

Candidate leagues (verify traffic potential in GSC/Ahrefs after 30 days of data):
- Premier League
- Champions League
- La Liga
- Bundesliga
- Serie A

Each page needs:
- `generateMetadata` with league-specific title + description
- BreadcrumbList JSON-LD
- SportsOrganization JSON-LD
- 200-word static intro paragraph (server-rendered)
- Internal links to team pages and the fixture list filtered to that league

### Fixture page static SSR content
`FixtureDetailPage` currently renders very little static HTML — most content is client-side via `FixtureDetailPageClient`. Add a server-rendered match summary (teams, kickoff time, league, venue) above the client component so crawlers see real content without executing JavaScript.

### Internal linking improvements
- Add "View all [League] fixtures →" links on league standings pages pointing to `/?leagueId=X`
- Add "See odds →" links on team pages pointing to the fixture list filtered by team
- Add "More [League] fixtures →" contextual link on fixture detail pages
- Add links between `/bonus-codes` and the fixture list (e.g. "Use your bonus code on today's Premier League fixtures")

---

## 90-Day Plan (July 2026)

### Programmatic SEO
Evaluate whether backend data supports:
- `/football/teams/` index page with league-filtered team lists (targets "Premier League teams odds" queries)
- `/football/fixtures/[date]/` date-based fixture index pages (targets "football fixtures today" queries)

Both require checking backend API support in `../api-endpoints.md` before building.

### Link building
- Submit OddsDetector to betting comparison directories (OLBG, Oddschecker ecosystem)
- Identify sports data / football stats sites that accept resource links
- Consider a free data feature (e.g. "best available odds tracker" widget) that earns natural links from football blogs

### Schema expansion
- Add `ListItem` schema to the fixtures list page for structured event listing in search results
- Evaluate `PriceSpecification` / `Offer` schema on bonus codes entries if schema.org adds clear betting offer support
- Add `ItemList` schema to the league standings list page

---

## KPIs to Track

| KPI | Tool | Target |
|-----|------|--------|
| Organic sessions | GSC / Analytics | Baseline → track week-over-week growth |
| Indexed pages | GSC Coverage | All key pages indexed, 0 server errors |
| Rich result appearances | GSC Enhancements | Breadcrumbs, Events, Sitelinks Searchbox |
| CTR from SERP | GSC Performance | >3% average for commercial queries |
| Core Web Vitals | GSC / PageSpeed Insights | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| Crawl errors | GSC Coverage | 0 server errors, 0 redirect chains in sitemap |
| Structured data errors | GSC Enhancements | 0 errors on SportsEvent, BreadcrumbList, WebSite |

---

## Google Search Console Submission Checklist

- [ ] Add property for `https://www.oddsdetector.com`
- [ ] Verify ownership via HTML tag or DNS TXT record
- [ ] Submit sitemap: `https://www.oddsdetector.com/sitemap.xml`
- [ ] Request indexing for: `/`, `/bonus-codes`, `/football/fixtures`, `/football/standings`
- [ ] Check Enhancements > Breadcrumbs
- [ ] Check Enhancements > Events (SportsEvent schema — fixture pages)
- [ ] Check Enhancements > Sitelinks Searchbox (WebSite schema)
- [ ] Set up Core Web Vitals monitoring
- [ ] Set up crawl error email alerts

## Bing Webmaster Tools Checklist

- [ ] Add site at `https://www.bing.com/webmasters`
- [ ] Submit sitemap: `https://www.oddsdetector.com/sitemap.xml`
- [ ] Import GSC property if available (Bing supports direct GSC import)
- [ ] Check IndexNow integration (Next.js can auto-ping Bing on deploy via IndexNow plugin)
