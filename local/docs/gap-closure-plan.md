# Gap-closure plan (Stage 1 — NO code changes made)

- Basis: `Docs/` (30 files) + `local/docs/plan-vs-implementation-report.md` (baseline **28%** = (19 DONE + 28 PARTIAL×0.5) / 118). Same formula used throughout.
- Locked: Next.js 16 + Prisma + Supabase (fra1) · email identity + phone-as-contact · manual WhatsApp monetization · relational model + added status/hidden/version · Cloudinary stays · **visual freeze** (existing look untouched; new screens reuse tokens/components per `Docs/01-design-system.md`).
- Stage-1 rule honored: this file is the only artifact. SQL below is **specified, not created** (`supabase/migrations/0002–0006` will be written in Stage 2 after APPROVED); Prisma schema edits + `prisma generate` likewise Stage 2. No migration has been run. No secrets printed.

## 1. Item registry → build plan

`GAP` = gap-report status. `→` = what will be built/changed (files, DB, criterion satisfied).

### Sprint A — Security quick wins (13 MISSING→DONE, 1 PARTIAL→DONE)

| ID | GAP | Build/change | Criterion |
|---|---|---|---|
| A1 | MISSING hashed sessions | `lib/auth.ts`: store `sha256(token)` hex in `sessions.token` (column reused); lookup hashes first. SQL `0002` backfills existing rows via `pgcrypto` `digest()` (verify extension present first). | Phase 1 §16 + criterion 3 |
| A2 | MISSING auth rate limit | New `lib/rate-limit.ts` (DB bucket upserts on `rate_limit_buckets`, new table in `0002`); enforced in login/register (5 fails/15 min per identifier + 20/15 min per IP). Returns 429 + `Retry-After`. | Phase 1 §19 + criterion 6 |
| A3 | PARTIAL password policy | `register/route.ts`: 8–128 chars + new `lib/password.ts` + `lib/common-passwords.ts` (≥1000 entries, local list). | Phase 1 §15 + criterion 2 |
| A4 | MISSING Origin/CSRF check | New `lib/csrf.ts` (`Origin`/`Sec-Fetch-Site` vs app URL → 403); called at top of all mutating routes (`/api/auth/*`, `/api/portfolio/track`). | Phase 1 §20 + criterion 7 |
| A5 | MISSING security headers | `src/middleware.ts`: add `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` (+ HSTS in prod). CSP kept permissive for Cloudinary/Google Fonts (visual freeze) with a TODO. | Phase 0 §51 + criterion 9 |
| A6 | MISSING env validation | New `lib/env.ts` (zod object over required vars; names only, values never logged); asserted on server boot path (`instrumentation.ts` or layout module scope). New `.env.example` entries only — `.env` untouched. | Phase 0 §31–36 + criterion 5 |
| A7 | DIFFERENT error shape | New `lib/errors.ts` (`AppError{code,status,fields}` → `{code,message,fields?}`); convert the 6 existing routes + 2 server actions' catch blocks. No stack in prod. | Phase 0 §46 + criterion 10 |
| A8 | MISSING mustChangePassword | `0002` adds `users.must_change_password` (default false); `guards.ts`: logged-in flag → redirect `/change-password` (allowlist: that page + logout + `/api/auth/*`). | Phase 1 §27–28 + criterion 9 |
| A9 | MISSING change-password | `POST /api/auth/change-password` (current password required, kills other sessions) + `src/app/change-password/` page reusing LoginForm styling. | Phase 1 §28 + criterion 8 |
| A10 | MISSING `/api/auth/me` | `GET /api/auth/me` → `{id,email,displayName,mustChangePassword}` (no subscription fields yet — those arrive in Sprint C). | `05-api-and-backend-plan.md:16` |
| A11 | MISSING SUSPENDED | `0002` adds `users.status` (default `'ACTIVE'`); login verifies password first, then 403 suspended message; uniform 401 otherwise. | Phase 1 §21 + criterion 12 |
| A12 | MISSING session cleanup | `lib/tasks/session-cleanup.ts` + `POST /api/cron/session-cleanup` (Vercel Cron, `CRON_SECRET` → `.env.example` only); deletes expired only. | Phase 1 §32 + criterion 15 |
| A13 | MISSING phone at register | `0002` adds `users.phone TEXT UNIQUE` (nullable: 7 existing rows have none); `lib/phone.ts` E.164 normalize (default EG) via `libphonenumber-js` (new dep, backend-only); register form gains one required field styled like existing fields (additive, allowed). Login stays email-only per lock. | Locked decision (contact for WhatsApp) |
| A14 | PARTIAL `?redirect=` | Wire `getSafeRedirect()` into login/register forms (internal paths only). | Phase 1 criterion 11 |

### Sprint B — Draft/Published + gating (14 MISSING→DONE)

| ID | GAP | Build/change | Criterion |
|---|---|---|---|
| B1–B4 | MISSING status/adminHidden/publish/unpublish | `0003`: `user_profiles.status` (default `'DRAFT'`), `admin_hidden`, `admin_hidden_reason`, `version` (default 1) + **backfill**: all rows with a published `home` page → `'PUBLISHED'` (preserves current visibility — see Risks). New `publish`/`unpublish` server actions (`actions/portfolio.ts`): publish validates preconditions (below) then sets `status='PUBLISHED'`; unpublish sets `'DRAFT'` (data kept). | Phase 5 §22 + 05-table |
| B5 | MISSING publish preconditions | Same actions: require username set, hero name non-empty, ≥1 visible section (422 list); subscription check delegated to Sprint C helper (returns pass-through until then — flagged in verification file). | Phase 5 criterion 9 (partial until C) |
| B6–B8 | MISSING username policy | `lib/portfolio.ts`: regex `^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,28}[a-z0-9]$` + `RESERVED_USERNAMES` list (admin, api, app, u, login, register, dev, uploads, www, support, settings, …) + catch P2002 → 409; new `GET /api/username-available` (rate-limited like A2). Builder shows change-warning (additive text only). | Phase 5 §24 + criterion 12 |
| B9 | MISSING optimistic concurrency | `updatePortfolio` accepts `expectedVersion`, compares to `version`, mismatch → 409 + current version; bump on write. Builder surfaces existing error toast (no new UI yet — full modal in F). | Phase 5 criterion 3 (server half) |
| B10 | MISSING public gating | New `lib/visibility.ts`: `status==='PUBLISHED' && !adminHidden` (+ subscription check in C) else uniform `notFound()`; applied in both `/u` pages. | Phase 6 §13 + criterion 1 |
| B11 | DIFFERENT internals leak | New `lib/public-profile.ts`: maps full row → public DTO (username, displayName, bio, avatar, title, location, skills, pages/sections/items, testimonials, services, appearance, localized) — drops email-adjacent/userId/draft-ish extras; `ClassicTemplate` receives DTO (same rendered output). | Phase 6 §14 + criterion 3 |
| B12 | PARTIAL SEO depth | Both `/u` pages: absolute canonical, `og:locale`, absolute `og:image`, JSON-LD `Person`/`CreativeWork` with `</script>` escaping; `noindex` on not-found/unavailable. | Phase 6 §24 + criteria 5–6 |
| B13 | PARTIAL sitemap | `sitemap.ts`: add published project pages (`lastmod` = updatedAt), keep 500-cap. | Phase 6 §25 + criterion 7 |
| B14 | MISSING `/api/health` | `GET /api/health` → `{status:'ok',db:'up'}` or 503 (read-only `SELECT 1`, 3 s timeout). | Phase 0 §50 + criterion 2 |

### Sprint C — Subscriptions (11 MISSING→DONE)

| ID | GAP | Build/change | Criterion |
|---|---|---|---|
| C1 | DIFFERENT Plan shape | `0004`: `plans` += `duration_days INT`, `limits JSONB`, `name_i18n JSONB` (legacy columns kept; NULL = free defaults from code). Prisma model extended. | Phase 3 §23 |
| C2–C3 | MISSING request + code flow | `0004`: new `subscription_requests` (+ partial unique `userId WHERE status='PENDING'`, 6-char base32 `code` generated in code). `POST /api/me/subscription-requests` → `{request, whatsappUrl}` via new `lib/whatsapp.ts` (digits-only + `encodeURIComponent`, template from settings); `DELETE` cancels. | Phase 3 §27 + criterion 4, 6 |
| C4 | MISSING state computation | New `lib/subscriptions.ts`: `getSubscriptionState` (NONE/ACTIVE/GRACE/EXPIRED/SUSPENDED per Phase 3 §12 incl. boundary rules), `canPublish` (ACTIVE‖GRACE), `isPortfolioVisible`, `getEffectiveLimits` (from `planSnapshot`, else free defaults). Wired into B5 publish + B10 gating now. | Phase 3 §20 + criteria 1–2 |
| C5–C8 | MISSING approve/reject/grant/extend/suspend | `0004`: `subscriptions` += `plan_snapshot JSONB`, `request_id UNIQUE`, `created_by`; `POST /api/admin/requests/:id/approve` (transaction: PENDING-lock → dates per A4 → Subscription + Payment + AuditLog → notify, FCM failure non-fatal), reject with reason; grant/extend/suspend endpoints. Pragmatic note: these are admin routes built in C, UI in D. | `05:62–66` + criteria 3, 5, 11 |
| C9 | MISSING lifecycle cron | `lib/tasks/subscription-lifecycle.ts` (`runLifecycle(now)`, idempotent via Notification `dedupeKey`) + `POST /api/cron/subscription-lifecycle` (disabled without `CRON_SECRET`); reminders 7/3d, GRACE + EXPIRED to user+admin. | Phase 3 §30 + criterion 7 |
| C10 | MISSING `/profile/subscription` | New page (namespace deviation `/profile/*` kept deliberately): status card, plans grid (from `GET /api/me/plans`), request flow with code + WhatsApp deep-link + cancel, history list. Tokens/components reused; no look change elsewhere. | Phase 3 §33 |
| C11 | MISSING limits at publish | `updatePortfolio`/publish path calls `getEffectiveLimits` (projects/sections/storage counts) → 403 `SUBSCRIPTION_REQUIRED`/limit errors; UI shows consumption text (additive). | Phase 5 criteria 9–10 |

### Sprint D — Admin panel (10 MISSING→DONE)

New `src/app/admin/` layout (collapsible sidebar + header search/bell-slot/lang-theme per `01-design-system.md` §7, built from existing `ui/*` + CSS vars) + `guards.requireAdmin` (role check; `isAdmin` flag exists on User). Routes+pages: dashboard (real counters + 2 short lists, no charts per plan), users (+detail, suspend, reset-password one-time display, revoke-sessions), requests queue (approve/reject UI on C endpoints), subscriptions, payments, plans CRUD, portfolios (hide/unhide + reason → `adminHidden` fields from B), audit-log UI, settings UI per `lib/settings-registry.ts` (contact/platform/subscription/upload groups, Zod-validated — adds `zod` dep, backend-only, plan-mandated). Shared `DataTable` (server pagination ≤100, URL-synced state, empty/loading/error) + `lib/pagination.ts`. `lib/audit.ts` writes on every admin mutation (C endpoints call it too). Matches plan admin nav (Dashboard, Users, Requests[badge], Subscriptions, Payments, Plans, Portfolios, Notifications, Audit log, Settings). Criteria: Phase 7 (1–10 incl. i18n-lint + axe self-check documented) + Phase 3 admin criteria.

### Sprint E — Notifications + settings (4 MISSING→DONE; FCM deferred)

`0005`: `notifications` += `dedupe_key`, `read_at`, partial unique `(user_id, dedupe_key)`; `title`/`body` → JSONB `{ar,en}` via `USING to_jsonb` (table empty — verification step asserts 0 rows first); `fcm_tokens` += `platform`, `user_agent`, `last_seen_at` (reused as DeviceToken store). New `lib/notify.ts` (DB-first, per-recipient rows, `dedupeKey`); `user.registered` hook in register route (admin recipients); bell component (badge 99+, dropdown 10, polling 60s + focus refetch) in admin layout + builder top bar slot (additive); `/profile/notifications` page (paginated, filters, read/read-all); WhatsApp/contact reads move to settings registry (user content paths untouched). **FCM sending: intentionally deferred** (needs Firebase human items per `phases/README.md:51`; code will be interface-ready). Criteria: Phase 2 (1–11 except live-push 12).

### Sprint F — Builder gaps (6 MISSING→DONE)

New `lib/portfolio-schema.ts` (zod `.strict()` doc `schemaVersion:1`, per-type schemas, length/count caps, link allowlist) enforced in `updatePortfolio`/publish (422 with field paths). Sections `gallery`/`files`/`contact`-split/`custom`: extend `PageSection` content shapes (JSON — no migration) + editor panels + `ClassicTemplate` `renderSection` cases (additive branches; existing sections untouched). Autosave: wire dead `useAutosave` (2 s debounce, single-flight queue, backoff, beforeunload) + `expectedVersion` conflict modal (completes B9 criterion 3). Fonts/presets: **additive only** — new preset swatches + keep current free dropdown exactly as-is (current look frozen → plan's restricted-list item recorded PARTIAL, see §3 ceiling note). Criteria: Phase 5 (5–8, 13–15, 1–2, 4).

### Sprint G — Analytics alignment (2 MISSING→DONE, visuals frozen)

`0006`: `daily_visits(portfolio_id, project_slug, day DATE, count)` + unique + index; `visit_dedups(key PK, day)` + day index. New `lib/visits.ts` (`recordVisit`: owner excluded via session check, `sha256` dedupe key, `ON CONFLICT DO NOTHING` + conditional upsert-increment) called from `track/route.ts` (replaces raw insert; silent failure preserved); nightly cleanup folded into session-cleanup cron file (second handler, same endpoint family — separate route `/api/cron/visit-dedup-cleanup` or one route, decided in Stage 2). Dashboard keeps reading existing aggregates mapped to identical numbers (UI pixels untouched). Criteria: Phase 11 (1–8 except chart-less UI already satisfied by current numbers).

### Sprint H — Landing + legal + tests + guide (8 MISSING→DONE)

`src/app/page.tsx` + (plan wants `/en`: implement `/en` route reusing the same component with `lang='en'` + `hreflang` links — additive, no existing route changes) from `09-marketing-pages.md` sections but **only real features**; CTAs → `/register`, `/u/testuser` (seed demo, clearly demo), WhatsApp from settings; `GET /api/public/plans` (active plans, public fields); `/terms`, `/privacy` stubs rendering neutral pending-content (no links point to them until client text arrives); OG image reuse `public/opengraph.png`; `src/routes.manifest.ts` + test failing on undeclared routes; Vitest unit (state boundaries, username/phone rules, WhatsApp URL, dedupe idempotency) + one Playwright smoke (register→builder→/u) with browser install in Stage 2; `Docs/ADMIN-GUIDE.md` (Arabic). Criteria: Phase 8 (1–9 modulo human content), Phase 9 §10, Phase 1 criterion 13 (manifest).

## 2. Sprint order, shippability, expected conformance

Each sprint ends with: `tsc`, `eslint` (no NEW errors vs 36-error baseline), `next build`, live seed flow (login→builder→`/u/testuser`) + feature check, `local/docs/phase-XX-verification.md`, SQL files handed over and confirmed applied before dependent code runs.

| Sprint | Ships | New DONE (cum.) | Expected % |
|---|---|---|---|
| (baseline) | — | 19 | 28% |
| A Security quick wins | safe auth + headers + me/change-pw + phone field | +14 → 33 | **~40%** ((33+13.5)/118) |
| B Draft/Published + gating | publish lifecycle, username policy, gated public pages, SEO depth, health | +14 → 47 | **~51%** ((47+13.5)/118) |
| C Subscriptions | paid flow end-to-end (request→approve→gated publish) | +11 → 58 | **~61%** ((58+13.5)/118) |
| D Admin panel | full back-office on plan layout | +10 → 68 | **~69%** ((68+13.5)/118) |
| E Notifications | DB-first notify + bell + pages (no live push) | +4 → 72 | **~72%** ((72+13.5)/118) |
| F Builder gaps | sections, autosave/conflict, Zod caps | +6 → 78 | **~77%** ((78+13.5)/118) |
| G Analytics alignment | cumulative visits behind same UI | +2 → 80 | **~79%** ((80+13.5)/118) |
| H Landing/tests/guide | public home, legal stubs, manifest, tests | +8 → 87 | **~85%** ((87+13.5)/118) |

PARTIAL count movement: A14 (`?redirect`) is the single PARTIAL→DONE conversion (28 → 27); H adds only new DONEs. Final: DONE 87, PARTIAL 27, MISSING 3 → (87+13.5)/118 = **85.2% ≈ 85% ceiling**.

## 3. Reachable ceiling + intentionally-not-aligned list

Ceiling **~85%**. The rest stays out for these recorded reasons (not oversights):

1. **Nuxt/Vue/Nitro stack artifacts** (pnpm, shadcn-vue, Nitro tasks, `shared/`, `server/` layout, Nuxt i18n) — locked out: stack stays Next.js.
2. **Docker/Caddy/compose/prod image/mem limits/host backups** — locked out: Supabase + Vercel fra1 (Supabase owns PITR/physical backups).
3. **Phone-number LOGIN + SMS** — locked out: email identity; phone is contact-only (plan A7 already waives SMS).
4. **argon2id** — locked out in favor of `bcryptjs`: existing hashes would all break; no UI/bundle impact either way; risk outweighs compliance gain.
5. **Email-verification re-enable** — locked out: stays disabled by decision.
6. **D1 single-language content** — implementation keeps bilingual `{ar,en}` content (superset of D1; temporary decision expired in practice).
7. **`/app/*` namespace + `/app` overview/journeys dashboards** — `/profile/*` kept (rename = route churn, zero functional gain).
8. **FCM live push + devices UX** — needs Firebase human items (`phases/README.md:51`); interface-ready only.
9. **Second premium template + `limits.templates` + Powered-by badge** (Phase 10) — no sprint covers it; needs product/pricing input + design work.
10. **CV import/export + jobs** (Phase 12), **Landing CMS + social registry** (Phase 13) — unscoped phases; would be Sprints I/J.
11. **Full E2E matrix + load test + KVM1 capacity plan** — beyond H's smoke/unit scope.
12. **`dev/*` pages, styleguide, PWA icons** — dev-only plan items, intentionally skipped.
13. **Remember-me 30d / idle-12h sliding** — fixed 7-day sessions kept (simpler; recorded deviation from Phase 1 §16).
14. **Strict 300-line files / no-`any` purity** (AGENT-RULES) — existing giants (`BuilderClient` 2786 lines, 36 lint errors) refactored only where touched.

## 4. SQL migration specs (to be written as files in Stage 2)

- `supabase/migrations/0002_auth_security.sql`: `users` += `phone TEXT UNIQUE` (nullable), `status TEXT NOT NULL DEFAULT 'ACTIVE'`, `must_change_password BOOLEAN NOT NULL DEFAULT false`; `sessions` backfill `token = encode(digest(token,'sha256'),'hex')` (requires `pgcrypto` — pre-check `SELECT * FROM pg_extension WHERE extname='pgcrypto'`), += `remember BOOLEAN DEFAULT false`, `last_seen_at`, `user_agent`, `ip`; new `rate_limit_buckets(key TEXT PK, count INT NOT NULL, reset_at TIMESTAMPTZ NOT NULL)`. Prisma: extend `User`, `Session`, add `RateLimitBucket`; `prisma generate`.
- `supabase/migrations/0003_portfolio_status.sql`: `user_profiles` += `status TEXT NOT NULL DEFAULT 'DRAFT'`, `admin_hidden BOOLEAN NOT NULL DEFAULT false`, `admin_hidden_reason TEXT`, `version INT NOT NULL DEFAULT 1`; **backfill** `status='PUBLISHED'` for rows with a published `home` page. Prisma: extend `UserProfile`.
- `supabase/migrations/0004_subscriptions.sql`: new `subscription_requests` (+ partial unique `user_id WHERE status='PENDING'`); `plans` += `duration_days INT`, `limits JSONB`, `name_i18n JSONB` (nullable, code falls back to free defaults); `subscriptions` += `plan_snapshot JSONB`, `request_id TEXT UNIQUE`, `created_by TEXT`. Prisma: extend `Plan`, `Subscription`, add `SubscriptionRequest`.
- `supabase/migrations/0005_notifications.sql`: `notifications` += `dedupe_key TEXT`, `read_at TIMESTAMPTZ`, partial unique `(user_id, dedupe_key)`; `title`/`body` → JSONB `{ar,en}` via `USING to_jsonb` **after asserting 0 rows**; `fcm_tokens` += `platform`, `user_agent`, `last_seen_at`. Prisma: extend both models.
- `supabase/migrations/0006_analytics.sql`: new `daily_visits` (+ unique + index per plan) and `visit_dedups` (+ day index), `day DATE`. Prisma: add both models.
- No migration for B-username/F-sections/H-landing (columns/JSON/routes already exist or are code-only). No destructive statements anywhere (no DROP/DELETE; conversions guarded by row-count asserts documented in each file header).

## 5. Risks (what could break login → builder → /u/testuser, and mitigations)

1. **Session backfill (`0002`)** locks users out if `digest()` mismatches app-side SHA-256 → mitigate: Node `crypto` hex vs `encode(digest,'hex')` are identical formats; verify post-apply with one test login before proceeding (Stage 2 gate); rollback = re-login (passwords untouched).
2. **Status backfill (`0003`)** — any profile missed by the backfill flips to DRAFT → `/u` 404s. Mitigate: backfill predicate covers every row with a published home page; verification step lists `status` counts per value before/after.
3. **`version` optimistic checks** — stale tabs get 409 modals (intended per plan) but could annoy: mitigate by sending `expectedVersion` only from the new builder code path (old concurrent saves impossible—same deployment).
4. **Security headers vs CDN** — `frame-ancestors 'none'` + tight CSP could block Cloudinary/Google Fonts (visual freeze!). Mitigate: headers-only (no CSP `script-src` tightening) in Sprint A; any CSP goes in as report-only first.
5. **Rate-limit table hot path** adds ~1 RTT to login/register only (never to page loads) — accepted, documented in verification file.
6. **Phone UNIQUE with legacy NULLs** — Postgres allows multiple NULLs in unique columns; new registrations validated app-side. No conflict.
7. **Visual freeze** — enforced by rule: new screens compose `ui/*` + CSS vars only; each sprint report lists touched `src/components` + `src/app` files with a look-unchanged statement; `builder/*` visuals untouched except additive text.
8. **`.env` freeze** — new names (`CRON_SECRET`, Firebase placeholders, `UPLOADS_*` unused) go to `.env.example` only; Vercel dashboard values unchanged.
