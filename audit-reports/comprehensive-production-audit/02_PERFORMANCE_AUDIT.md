# Performance Audit — PortfolioHub Builder

## Scope & Method
Static review of frontend/backend/database/caching code. No runtime profiling performed (safety). Baseline metrics referenced from `local/docs/audit-report.md` (2026-10-15, read-only audit) and `PRODUCTION_READINESS_AUDIT.md`. Re-verified against current source.

## 4.1 Frontend Performance

**Evidence:**
- `src/app/profile/builder/BuilderClient.tsx` = 4,821 lines, `'use client'` (verified `wc -l`).
- `src/components/portfolio/templates/ClassicTemplate.tsx` = 2,571 lines, `'use client'`.
- 77 files contain `'use client'` (verified grep).
- 31 raw `<img>` occurrences, 0 `next/image` imports (verified grep).
- `src/app/globals.css` uses `@import` for fonts (per prior audit S7); `ClassicTemplate.tsx` injects Google Fonts `<link>` at render.
- `NotificationBell.tsx` polls every 30 s per client (per prior audit).
- `src/lib/portfolio.ts` has 32 `no-explicit-any` lint findings (per `local/docs/audit-report.md` E2).

**Findings:**
- **PERF-FE-01 (High):** Builder monolith ships a large hydrate payload to every builder load. Evidence: 4,821-line client component. Impact: slow TTI on builder; high memory.
- **PERF-FE-02 (High):** Public visitors download builder-sized JS because `ClassicTemplate.tsx` (2,571 lines, client) renders public portfolios. Evidence: `'use client'` + size. Impact: poor LCP/INP for portfolio visitors.
- **PERF-FE-03 (High):** 31 raw `<img>`, 0 `next/image`. Evidence: grep counts. Impact: no responsive srcset, no optimization, worse LCP. Locations include ClassicTemplate lines ~344, 428, 589, 686, 873, 977 (per prior audit).
- **PERF-FE-04 (Medium):** Render-blocking fonts via CSS `@import` + runtime `<link>` injection. Evidence: `globals.css:1`, ClassicTemplate render. Impact: blocks first paint.
- **PERF-FE-05 (Medium):** Notification bell 30 s polling scales linearly with concurrent users. Evidence: NotificationBell.tsx. Impact: server load + client battery.
- **PERF-FE-06 (Low-Medium):** `set-state-in-effect` lint errors ×3 (BuilderClient:103, ProjectPageView:45, ClassicTemplate:44) cause extra render passes. Evidence: `local/docs/audit-report.md` E1.
- **PERF-FE-07 (Low):** Per-portfolio Google Fonts `<link>` injected at render (ClassicTemplate). Impact: font chain blocks first paint.

## 4.2 Core Web Vitals
No field CWV data available in this audit (no RUM/monitoring). Prior audit did not provide Lighthouse scores. **Status: REQUIRES SAFE TEST ENVIRONMENT** (run Lighthouse locally against `npm run build && npm start` with synthetic data; do not test production). Likely dominant causes: uncached dynamic SSR (TTFB), raw images (LCP), large JS (INP), font chain (FCP).

## 4.3 Image & Media Optimization
- 31 raw `<img>`, 0 `next/image`. Evidence: grep.
- Cloudinary used for uploads; client-side unsigned preset. Transformations not applied in templates (per prior audit).
- Avatar/cover images stored as full URLs without responsive variants.
- **PERF-IMG-01 (High):** No `next/image` adoption → no optimization/srcset/priority. Suggested migration in templates (ClassicTemplate, ProjectPageView, TestimonialsSlider).
- **PERF-IMG-02 (Medium):** Cloudinary transformations not used for thumbnails → large payloads.

## 4.4 Backend Performance
- `src/app/layout.tsx` reads language cookie → all routes dynamic (no static optimization). Evidence: layout.tsx:13-16 comment.
- `src/lib/actions/portfolio.ts` (1,434 lines): `getOrCreateProfile` re-fetches full profile up to 4× (lines ~59, 103, 157, 207) (per prior audit S3). `updatePortfolio` loops per-section updates and per-project deleteMany+createMany (S4).
- `getPortfolioAnalytics` (lines ~734-836) runs 11 COUNTs + event scan + profile/children fetches (~34 SELECTs) (per prior audit S2).
- `/u/[username]/page.tsx` fetches full profile twice (metadata + page) without `select` (S5).
- `src/lib/platform.ts` uses `unstable_cache` (300 s) + React `cache()` — already optimized (verified). Earlier audit claim "uncached" is partially stale.
- `src/lib/visits.ts` recordVisit is dedupe-gated; OK.

**Findings:**
- **PERF-BE-01 (High):** Builder profile re-fetch (up to 4×) → ~4.6 s application time. Evidence: prior audit S3 + code.
- **PERF-BE-02 (High):** Analytics 11 COUNT fan-out → ~9.8 s. Evidence: prior audit S2.
- **PERF-BE-03 (Medium):** `/u` double full-row fetch + over-fetch. Evidence: prior audit S5.
- **PERF-BE-04 (Medium):** Save path O(sections+projects+items) sequential writes. Evidence: prior audit S4.
- **PERF-BE-05 (Low):** `revalidatePath` called on save; OK but broad.

## 4.5 Database Performance
- Prisma 5.22, Supabase pooler. Index coverage reported complete (80 indexes/unique, 49 onDelete) per PRODUCTION_READINESS_AUDIT.
- `RateLimitBucket` fixed-window transaction per attempt → write amplification/hot-row contention (per audit).
- Admin user search uses unindexed `contains ... mode: insensitive` → sequential scans as users grow.
- Notification polling → linear DB read growth.
- No `?schema=` mismatch (verified OK).
- **PERF-DB-01 (Medium):** Analytics COUNT fan-out + pool queueing.
- **PERF-DB-02 (Medium):** Hot-row contention on rate limit keys.
- **PERF-DB-03 (Low-Medium):** Admin search sequential scans at scale.
- **PERF-DB-04 (Low):** Serverless Prisma relies on pooler; no explicit pool tuning.

Network: Cairo→Frankfurt median 440 ms (per `local/docs/audit-report.md` §5, measured). ≥90% of server time is RTT × query count. Reducing query count is the highest-leverage fix.

## 4.6 Caching & Rendering Strategy
- No explicit `force-dynamic` (layout relies on cookie read → implicit dynamic). Evidence: layout.tsx:13-16.
- `platform.ts` uses `unstable_cache` (300 s) + React `cache()`.
- `src/app/u/[username]/page.tsx` and project page use React `cache()` for per-request dedupe.
- No ISR/`revalidate` on public pages; no `s-maxage` cache headers.
- **PERF-CACHE-01 (High):** Public portfolio pages uncached → linear DB growth with traffic. Suggested ISR/Data Cache with invalidation on publish.
- **PERF-CACHE-02 (Medium):** Landing page likely dynamic due to layout cookie; could be static.
- **PERF-CACHE-03 (Low):** `output: 'standalone'` has no benefit on Vercel (Docker parity only).

## Summary of Performance Findings
| ID | Severity | Area |
|---|---|---|
| PERF-FE-01 | High | Builder monolith |
| PERF-FE-02 | High | Public client bundle |
| PERF-FE-03 | High | Raw images |
| PERF-BE-01 | High | Builder re-fetch |
| PERF-BE-02 | High | Analytics fan-out |
| PERF-CACHE-01 | High | Uncached public pages |
| PERF-IMG-01 | High | No next/image |
| PERF-FE-04/07 | Medium | Fonts |
| PERF-BE-03/04 | Medium | /u fetch, save writes |
| PERF-DB-* | Medium/Low | Index/contention |
| PERF-FE-05/06 | Medium/Low | Polling, setState-in-effect |