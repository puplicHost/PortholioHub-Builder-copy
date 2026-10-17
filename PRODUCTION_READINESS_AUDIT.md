# Production Readiness Audit — PortfolioHub (MarketOS)

Scope: full repository `PortholioHub-Builder-copy` (Next.js 16.2.12, React 19, Prisma 5 / Supabase Postgres, Vercel).
Method: static review of routes, guards, schema, middleware, config, and client bundles. No runtime load testing performed.

## Final Summary

After all 6 audits, output:

### Production Readiness Score
- Architecture: 7/10
- Performance: 6/10
- Security: 7/10
- Reliability: 6/10
- Scalability: 6/10
- SEO: 6/10
- Overall: 6/10

### Top 10 Must-Fix Before Launch
Ordered by severity — the 10 most important issues to fix before going live.

1. **Delete the production debug endpoints** `src/app/api/test-race/route.ts` and `src/app/api/test-verprobe/route.ts`. Both comment "TEMPORARY … Deleted after use" yet ship to prod and let any authenticated user trigger `updatePortfolio()` version bumps / writes. (Security, Reliability)
2. **Add real Open Graph images.** `/og.svg` and `/opengraph.png` are referenced (`src/app/page.tsx`, `src/app/en/page.tsx`, `src/app/layout.tsx`, `src/app/u/[username]/page.tsx`) but **do not exist in `public/`** and there is no `opengraph-image.tsx` → every social share preview is broken (404). Also replace the SVG (`og.svg`) with PNG/JPG — most crawlers reject SVG. (SEO)
3. **Ship real transactional email.** `src/lib/resend/send.ts` is a stub that only `console.log`s; email verification / resend flows never deliver. (Reliability)
4. **Add a Content-Security-Policy.** `src/middleware.ts` intentionally omits `script-src` hardening; no CSP exists anywhere. Start Report-Only → enforce. (Security)
5. **Extend CSRF protection to all mutating routes.** `isSameOriginRequest` is applied to only 4 routes (login/register/logout/change-password); the other ~32 mutating routes rely solely on `SameSite=Lax`. (Security)
6. **Remove the `JWT_SECRET` dev fallback** in `src/lib/auth.ts` (`'dev-secret-key-change-in-production'`). Fail hard in production instead of silently issuing tokens with a known key. (Security)
7. **Make `/api/portfolio/track` rate limiting durable.** It uses a per-process in-memory `Map`, which resets on every cold start and is not shared across Vercel instances. (Scalability, Security)
8. **Cache public portfolio pages.** `/u/[username]` and project pages run fully dynamic (layout reads the language cookie → every route dynamic; no `revalidate`/`unstable_cache` anywhere) — each visit hits Postgres. Add ISR / Data Cache. (Performance, Scalability)
9. **Adopt `next/image` (or Cloudinary transforms) in published templates.** 10 files render raw `<img>` (`ClassicTemplate.tsx`, `TestimonialsSlider.tsx`, `ProjectPageView.tsx`, etc.) with only 1 `next/image` in the codebase → poor LCP / bandwidth. (Performance, SEO)
10. **Add CI + error monitoring.** No `.github/` workflow exists; `eslint`/`vitest`/Playwright are configured but never run automatically, and there is no Sentry/observability — failures are only visible via `console.error`. (Reliability)

### What's Already Good
- **Session security:** session tokens stored only as SHA-256 hashes; `httpOnly` + `SameSite=Lax` + `Secure` cookie; 7-day expiry; suspended users lose access immediately (`src/lib/auth.ts`, `src/lib/session-cookie.ts`).
- **Auth hardening:** bcrypt cost 12; enumeration-resistant login (uniform errors + dummy-hash compare); DB-backed fixed-window rate limits on login (per-email + per-IP) and register; CSRF same-origin check on auth routes (`src/app/api/auth/login/route.ts`).
- **Centralized admin guard:** every `/api/admin/**` route goes through `requireAdminApi()`; all mutations write to `AdminAuditLog` (`src/lib/admin-guard.ts`, `src/lib/audit.ts`).
- **Security headers:** `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, HSTS in prod (`src/middleware.ts`, `vercel.json`).
- **Schema quality:** 80 indexes/unique constraints, 49 `onDelete` rules, aggregate `DailyVisit` + `VisitDedup` analytics, per-user `Notification` with `dedupeKey`.
- **Data integrity:** `$transaction` on critical flows (grant-subscription, request approve, admin user ops), optimistic concurrency with conflict UI in the builder, Zod content schema with per-field size caps (`src/lib/portfolio-schema.ts`).
- **Operations:** `/api/health` DB probe (503 on failure), cron endpoints protected by `CRON_SECRET` with graceful pre-migration fallback, session cleanup job (`src/app/api/cron/*`).
- **SEO fundamentals:** canonical URLs, hreflang (ar/en/x-default), JSON-LD `Person` + `BreadcrumbList`, `robots.txt`, dynamic sitemap with published portfolios/projects, per-page `generateMetadata`.
- **Error UX:** root `error.tsx`, `not-found.tsx`, `ErrorBoundary`, unified API error shape (`src/lib/errors.ts`).
- **Tests exist:** 6 unit suites (`__tests__/`) + 2 Playwright specs (`e2e/`).
- **Env hygiene:** Zod-validated server env that names (never prints) missing vars (`src/lib/env.ts`).

### Estimated Fix Time
Total hours to fix all critical + high issues.

| Item | Est. hours |
| --- | --- |
| Remove production test endpoints | 0.5 |
| Add OG image assets (PNG + dynamic route) | 1.0 |
| Real transactional email (provider + templates) | 3.0 |
| Content-Security-Policy (Report-Only → enforce) | 3.0 |
| CSRF on all mutating routes + durable `/track` limit | 3.0 |
| Remove `JWT_SECRET` fallback | 0.5 |
| Scrub PII from admin email logging | 0.5 |
| Cache public portfolio pages (ISR/Data Cache) | 6.0 |
| `next/image` migration in templates | 5.0 |
| CI pipeline + error monitoring | 4.0 |
| **Total** | **~26.5 h (≈ 27 h)** |

---

## Audit 1 — Architecture (7/10)

**Strengths**
- Clear layering: `src/lib/*` (auth, guards, rate-limit, csrf, env, errors, subscriptions), `src/lib/actions/*` (server actions), `src/app/api/*` (route handlers), `src/components/*` (UI).
- Cross-cutting concerns centralized: `admin-guard`, `errors` (unified shape), `pagination`, `rate-limit`, `csrf`, `env`.
- Prisma singleton with dev global caching (`src/lib/prisma.ts`); `standalone` output for Docker parity.
- i18n via a subscription-based `I18nProvider` with cookie mirroring for server components.

**Weaknesses**
- Dead/incorrect module shipped: `src/lib/upload.ts` is explicitly documented "VERCEL INCOMPATIBLE" and is **not imported anywhere** (dead code).
- Debug routes in the production tree (`test-race`, `test-verprobe`).
- `BuilderClient.tsx` is a 3,586-line monolith; `ClassicTemplate.tsx` 1,296 lines — high coupling, hard to test.
- `output: "standalone"` in `next.config.ts` is a Docker setting with no benefit on Vercel.

## Audit 2 — Performance (6/10)

**Strengths**
- Firebase messaging is code-split via dynamic `import()` (`AdminFcmRegistrar.tsx`).
- Analytics track endpoint does one indexed lookup + one insert, no external calls.
- Pagination capped at 100; sitemap capped at 500 + 500.

**Weaknesses**
- **Everything is dynamic.** `src/app/layout.tsx` reads the language cookie, opting every route into dynamic rendering; no `revalidate` / `unstable_cache` anywhere → no ISR, no CDN cache.
- **Raw `<img>` everywhere** in published templates (10 files) — no responsive `srcset`, no next/image optimization.
- 3,586-line client component ships a large hydrate payload.
- Notification bell polls every 30 s per client (`NotificationBell.tsx`).
- Per-portfolio Google Fonts `<link>` injected at render (`ClassicTemplate.tsx`).
- In-memory `Map` rate limiter for `/track` grows unbounded per instance.

## Audit 3 — Security (7/10)

**Strengths**
- Session tokens hashed (SHA-256) at rest; raw token only in an `httpOnly`/`Secure`/`SameSite=Lax` cookie.
- bcrypt cost 12; uniform login errors + dummy-hash timing equalization (no account enumeration); suspended check after password.
- DB-backed rate limits on login/register; CSRF same-origin check on auth routes.
- `requireAdminApi()` on 100% of admin routes; audit logging of admin mutations.
- Security headers + HSTS (prod); IP hashed (never raw) in analytics; no secrets echoed in error responses; Zod env validation.

**Weaknesses**
- `test-race` / `test-verprobe` are reachable in production and mutate portfolio data.
- CSRF enforced on only 4 of ~36 mutating routes.
- `JWT_SECRET` falls back to a hardcoded dev value.
- No CSP (no `script-src` defense-in-depth); inline `<script>` present in `layout.tsx` and JSON-LD.
- `admin/users/[id]/send-email` logs recipient email + full body to server logs (PII).
- `username-available` is unauthenticated with no rate limit (username enumeration).
- Client-side **unsigned** Cloudinary upload preset (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) — anyone can upload to the account unless the preset is restricted server-side.

## Audit 4 — Reliability (6/10)

**Strengths**
- `/api/health` probes the DB and returns 503 on failure.
- Optimistic concurrency + conflict-resolution UI (reload/overwrite) in the builder.
- `$transaction` around multi-step writes (grant-subscription, request approve, admin user ops).
- Cron jobs verify `CRON_SECRET` and degrade gracefully for pre-migration tables (`P2021`/`P2002` handling in `visits.ts`).
- Error boundary + localized `error.tsx` / `not-found.tsx`; exponential backoff on save.
- Unit + E2E tests exist.

**Weaknesses**
- Email delivery is a stub → verification/resend emails never arrive.
- No CI; tests are never executed automatically.
- Debug endpoints can corrupt portfolio version state.
- Several silent `catch(() => {})` blocks hide failures (`lastLoginAt` update, session delete, etc.).
- No error tracking/monitoring; production issues only surface as logs.
- In-memory rate limiter and `Map` throttle reset on cold start.

## Audit 5 — Scalability (6/10)

**Strengths**
- Stateless auth (DB-backed sessions) → horizontally scalable.
- 80 indexes; aggregate `DailyVisit` + dedupe tables reduce read/write amplification.
- Rate limiter is DB-backed (shared across instances) — unlike the `/track` in-memory throttle.
- Pagination caps prevent large payloads.

**Weaknesses**
- Hot public pages are uncached → linear DB read growth with traffic.
- Fixed-window rate limit performs a transaction per attempt → write amplification and hot-row contention on keys like `login:ip:<ip>`.
- Admin user search uses unindexed `contains ... mode: insensitive` → sequential scans as users grow.
- 30 s notification polling scales linearly with concurrent users.
- `Map`-based `/track` throttle can grow unbounded within a long-lived instance.
- Serverless Prisma relies entirely on the Supabase pooler; no explicit pool tuning.

## Audit 6 — SEO (6/10)

**Strengths**
- Full metadata: titles, descriptions, OpenGraph, Twitter cards, `metadataBase`.
- Canonical URLs and hreflang (`ar` / `en` / `x-default`) on landing pages.
- JSON-LD: `Person` (portfolio) and `BreadcrumbList` (project pages), with `<` escaped.
- `robots.ts` (allows `/`, `/u/`; disallows `/profile/`, `/api/`, `/admin`) + dynamic `sitemap.ts` (only published, non-hidden profiles + referenced project pages).
- `<html lang dir>` set + `suppressHydrationWarning`.

**Weaknesses**
- **Broken OG images:** `/og.svg` and `/opengraph.png` are 404 (no asset, no `opengraph-image` route) → no social previews; `og.svg` would be rejected by most crawlers anyway.
- Uncached dynamic pages hurt crawl budget and Core Web Vitals.
- Raw `<img>` usage depresses LCP — a direct ranking factor.
- JSON-LD `Person` is minimal (no `sameAs`/`image`).
- Sitemap silently truncates at 500 profiles / 500 projects with no sitemap index.
