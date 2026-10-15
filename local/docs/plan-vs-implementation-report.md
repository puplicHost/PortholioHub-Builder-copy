# Plan vs Implementation — gap analysis

- Plan source: `/My SaaS/PortholioHub-Builder/Docs` (30 files read in full; inventory in §2).
- Project: `PortholioHub-Builder-copy` (this folder), commit `da9e8e9`, `git status` clean at audit start.
- Method: read-only (file reads, `rg`, `git log/status`, `tsc --noEmit` exit 0, two remote read-only probes: storage bucket list → empty; `users` count-range → 7 rows). Live server behavior cited only from `local/docs/audit-report.md` (not re-run). No file created/modified except this report. No secrets printed.
- Status values: DONE = fully matches plan · PARTIAL = exists but incomplete/different · MISSING = absent · DIFFERENT = implemented contrary to plan.

## 1. Executive summary

**Overall completion: ~28%.** Count basis: 118 discrete plan requirements inventoried below → 19 DONE (16%), 28 PARTIAL (24%, half weight), 71 MISSING (60%). Formula: (19 + 14) / 118 ≈ 28%.

**The project is really at: mid-S3 (builder functional subset) with S0–S2 foundations skipped.** It is a working vertical slice (register → build → publish-by-default → view) on a **different stack** (Next.js 16 + Supabase cloud, no Docker) carrying a **different data model** (relational sections + MarketOS-legacy workspace tables, no `Portfolio.draftDoc/publishedDoc`), **different auth identity** (email, not phone), and **no monetization, admin, notifications, media pipeline, second template, CV, CMS, landing, or hardening**.

**Top 5 gaps:**
1. **Monetization core absent (S2/Phase 3: 0%)** — no `SubscriptionRequest`, no approve flow, no computed subscription state, no gating; every portfolio is effectively published-for-free, contradicting journeys 1–4 (`02-sitemap-and-journeys.md:38–43`).
2. **Wrong auth identity + weak policy (S1/Phase 1: ~25%)** — email instead of plan-mandated phone (`04:10–23`, `planning-notes.md:27 C5`); bcrypt not argon2id (`phase-01-auth.md:15`); min length 6 not 8–128+common-list; raw session tokens not SHA-256 (`phase-01-auth.md:16`); no remember-me, no rate limiting, no `mustChangePassword`, no `/api/auth/me`, no change-password.
3. **No Draft/Published model (Phase 5 core: ~35%)** — saves mutate the live portfolio directly; no `draftDoc/publishedDoc`, no `draftVersion`/409, no publish preconditions, no username regex/reserved-list/race-409 (`phase-05-builder.md:22–25`).
4. **Public pages have no gating or SEO depth (Phase 6: ~35%)** — any `home` page renders (no PUBLISHED/subscription/adminHidden checks, `phase-06:13`); full profile incl. internals passed to client (`u/[username]/page.tsx:24–38`); no canonical/JSON-LD/noindex; sitemap lacks projects; no SSR cache.
5. **S5–S7 entirely missing (0%)** — no `/admin/*`, no Landing/CMS (`/` 404s), no FCM/notifications, no Docker/prod artifacts, no backups, no Playwright/E2E, zero test files (only `vitest.config.ts`).

## 2. Plan inventory

| # | Document | Purpose (one line) |
|---|---|---|
| 1 | `00-project-status.md` | Living status: S3/Phase 5 in progress, decisions log pointer |
| 2 | `01-design-system.md` | Identity tokens, builder/admin layouts, fonts, RTL, card rules, template notes |
| 3 | `02-sitemap-and-journeys.md` | All routes (`/`, `/login`, `/app/*`, `/admin/*`, `/u/*`) + 5 user journeys |
| 4 | `03-architecture.md` | Nuxt modular monolith, draft/published JSON docs, perf rules, KVM1 hosting |
| 5 | `04-database-and-data-model.md` | Prisma models (User…AuditLog) + Round-2 models (DailyVisit, CV jobs, Landing) |
| 6 | `05-api-and-backend-plan.md` | Every endpoint (auth/me/builder/public/admin) + transactions + cron tasks |
| 7 | `06-security-plan.md` | Per-phase security checklist (passwords, sessions, XSS, uploads, headers…) |
| 8 | `07-integrations.md` | FCM push, wa.me links, Docker-volume storage + sharp pipeline |
| 9 | `08-testing-strategy.md` | Vitest/PW/E2E/security test obligations |
| 10 | `09-marketing-pages.md` | Landing content/SEO/rules (written last) |
| 11 | `planning-notes.md` | Confirmed stack/requirements (C1–C14), assumptions A1–A14, decisions D1–D18 |
| 12 | `AGENT-PROMPT.md` | Master build-from-scratch prompt (Nuxt, no email, 8 sprints S0–S7) |
| 13 | `phases/AGENT-RULES.md` | Binding rules: honesty statuses, i18n, security-per-phase, perf, tests |
| 14 | `phases/phases.md` | Superseded high-level list (itself declares `README.md` current, line 1) |
| 15 | `phases/README.md` | Sprint map S0–S7, continuation protocol, human-needed items |
| 16–18 | `phase-00-foundation/*` (3) | Docker/Nuxt/i18n/Prisma/health/headers/testing bootstrap + 15 acceptance criteria |
| 19 | `phase-01-auth.md` | Phone auth, argon2, hashed sessions, remember, rate limit, manifest, 15 criteria |
| 20 | `phase-02-settings-notifications.md` | PlatformSetting, notifications+FCM+bell, WhatsApp URLs, 13 criteria |
| 21 | `phase-03-plans-subscriptions.md` | Plans/requests/approve/grant/users admin, lifecycle cron, 15 criteria |
| 22 | `phase-04-media.md` | Secure uploads, sharp/WebP, quota, serving, MediaPicker, orphan cleanup, 12 criteria |
| 23 | `phase-05-builder.md` | Zod docs, builder endpoints, Basel renderer, editor state, username, publish, 17 criteria |
| 24 | `phase-06-public-pages.md` | Gating, public API, SEO, sitemap/robots, cache, 12 criteria |
| 25 | `phase-07-admin-completion.md` | Dashboard, portfolios hide/unhide, audit UI, settings, DataTable, 10 criteria |
| 26 | `phase-08-landing.md` | Bilingual landing, plans API, Playwright screenshots, 9 criteria |
| 27 | `phase-09-hardening-deployment.md` | Security review, permission matrix, E2E, backups, Caddy, ADMIN-GUIDE, 11 criteria |
| 28 | `phase-10-templates-theming.md` | Template contract + 2nd premium template + Powered-by badge, 7 criteria |
| 29 | `phase-11-analytics.md` | Cumulative DailyVisit+dedupe, numbers-only UI, 8 criteria |
| 30 | `phase-12-cv-import-export.md` | Heuristic CV import + ATS export behind `cvTools`, job queue, 9 criteria |

## 3. Phase-by-phase comparison

Format: requirement | status | plan ref | project evidence | notes.

### Phase 0 — Foundation (~20%: 1 DONE, 4 PARTIAL, 10 MISSING of 15 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| App runs (dev) + DB | PARTIAL | `01-overview.md:43` | `package.json:6` (`next dev`), Supabase live (audit-report §3) | Works, but Next.js 16, not Nuxt 3; Supabase cloud, no Docker |
| `GET /api/health` (200/503) | MISSING | `01-overview.md:44` | `src/app/api/` contains only `auth/`, `portfolio/`, `verify-email` | Referenced by `docker:health` script pointing at nonexistent route |
| Prisma migrate + seed idempotent admin | PARTIAL | `01-overview.md:45` | `supabase/migrations/0001_init.sql` + `supabase/seed.sql` (test user, not admin) | SQL-file flow, not `migrate deploy`; seed is portfolio test data |
| Weak-password seed refusal | MISSING | `01-overview.md:46` | No seed script for admin; no password-strength gate | — |
| Env validation fails fast | MISSING | `01-overview.md:47` | No validation module (`src/lib/` has no env schema; nothing imports zod — `package.json` has no `zod`) | Missing vars surface as runtime DB/auth errors |
| ar/en + dir switch, persisted | PARTIAL | `01-overview.md:48` | `I18nProvider.tsx`, `dictionary.ts` (en ~line 10, ar ~line 418), `layout.tsx` `initialDir` | Custom provider, not `@nuxtjs/i18n`; visual persistence not audited live here |
| Light/Dark, system default, no FOUC | PARTIAL | `01-overview.md:49` | `next-themes` (`package.json:43`), `ThemeProvider.tsx` | Present; FOUC behavior not verified |
| Self-hosted fonts, no CDN | DIFFERENT | `01-overview.md:50`, `planning-notes.md:54 A11` | `globals.css:1` Google Fonts `@import`; `ClassicTemplate.tsx:860` runtime font `<link>` | Direct violation of A11; only `next/font` (Inter/Space Grotesk) is local |
| Security headers on responses | MISSING | `01-overview.md:51` | No header middleware (middleware = subdomain rewrite only, `src/middleware.ts:1–42`) | No CSP/HSTS/nosniff/frame-ancestors anywhere |
| Unified error shape, no prod leak | DIFFERENT | `01-overview.md:52` | Ad-hoc `{ok, error}` JSON (`route.ts` files); dev `error.tsx:24` renders `error.message` | No `{code,message,fields?}`, no Zod 422s |
| Pagination util (≤100, meta) | MISSING | `01-overview.md:53` | Zero `pageSize`/pagination hits in `src/app/api`, `src/lib/actions` | No list endpoint exists to paginate |
| Log redaction | PARTIAL | `01-overview.md:54` | `console.error` in 13 files (all error paths, no passwords seen); no pino, no redact list | No secrets observed in logs; no systematic redaction |
| lint+typecheck+test+e2e green | PARTIAL | `01-overview.md:55` | `tsc` exit 0, `next build` exit 0 (audit-report §2); `eslint` exit 1 (89 problems); **zero test files** (`vitest.config.ts` only) | Types/build pass; lint fails; tests absent |
| Non-root prod image, private DB | MISSING | `01-overview.md:56` | No `Dockerfile`/`docker-compose.*` (ls confirmed) | Nothing to inspect; Supabase is the DB |
| Restarts keep data | PARTIAL | `01-overview.md:57` | Data in Supabase (survives); uploads = Cloudinary (survives) | True by accident of cloud services, not by tested volumes |

### Phase 1 — Auth (~25%: 2 DONE, 4 PARTIAL, 9 MISSING of 15 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| Register/login → session | PARTIAL | `phase-01-auth.md:39` | `api/auth/register|login|logout/route.ts` + `/login`, `/register` pages (all live-verified, audit-report §3) | **Email, not phone** (`User.email`, schema lines 19–54; plan: `phone` unique E.164, `04:10–23`) |
| Password policy 8–128 + common-list, argon2id, hash-only storage | DIFFERENT | `phase-01-auth.md:15`, `:40` | `bcryptjs` (`package.json:40`); `MIN_PASSWORD_LENGTH = 6` (`register/route.ts:10,22`) | Wrong algorithm, weaker minimum, no common-password list |
| Token stored hashed (SHA-256) | DIFFERENT | `phase-01-auth.md:16` | `crypto.randomBytes(32).toString('hex')` stored raw (`auth.ts:22` + `session.create`, lines 19–30) | DB leak = session hijack; plan explicitly requires hash |
| Refresh/persist, remember 30d vs 12h idle | PARTIAL | `phase-01-auth.md:16` | Fixed 7-day sessions (`auth.ts:13`); no `remember`, no `lastSeenAt`, no idle timeout (Session model lacks all three, schema lines 70–80) | Refresh survival verified live; durations don't match plan |
| Logout kills session; old cookie → 401 | DONE | `phase-01-auth.md:41` | `logout/route.ts` + live-verified (audit-report §3) | Matches |
| Rate limit 5 fails/15min + 429 + uniform timing | MISSING | `phase-01-auth.md:18`, criterion 6 | No limiter on auth routes (only in-memory 60/min throttle in `track/route.ts:11–21`) | Brute-forceable |
| Cross-origin POST → 403 | MISSING | `phase-01-auth.md:20` | No Origin/Sec-Fetch check in any route | — |
| Change-password (+keep current session) | MISSING | `phase-01-auth.md:28` | No route; `updatePassword()` helper exists (`auth.ts:101`) but unwired | Dead helper |
| `mustChangePassword` gate | MISSING | `phase-01-auth.md:28` | Zero matches in `src` + schema | — |
| USER→`/admin` 403; guest→`/login?redirect=` | PARTIAL | `phase-01-auth.md:50` | `requireUser()` → `/login` (`guards.ts:11–15`); no `/admin` exists to protect; `getSafeRedirect()` exists (`urls.ts:11`) but login/register ignore `?redirect=` | Half the matrix is vacuous |
| `?redirect=` external ignored | PARTIAL | `phase-01-auth.md:49` | Helper exists, unused by auth pages (fixed post-login target `/profile/builder`) | Helper without caller |
| SUSPENDED account handling | MISSING | `phase-01-auth.md:21` | No `status` on User; login never checks status | — |
| `routes.manifest.ts` + test | MISSING | `phase-01-auth.md:33` | No manifest file; no test files at all | — |
| E2E ar/en register→reload→logout→login | MISSING | `phase-01-auth.md:52` | No Playwright; flows verified manually via curl only | — |
| session-cleanup task | MISSING | `phase-01-auth.md:32` | No tasks/scheduler anywhere | Expired sessions accumulate (no `deleteMany` cron) |

### Phase 2 — Settings & Notifications (~10%: 0 DONE, 2 PARTIAL, 11 MISSING of 13 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| `PlatformSetting` + Zod registry + admin UI + public contact endpoint | PARTIAL | `phase-02:21–22` | `SystemSetting{key,value}` model + `getPlatformName()` (`platform.ts:4–17`, cross-request cached) used for site name only | DIFFERENT name/shape; no registry, no Zod, no admin UI, no contact endpoint |
| Notification DB-first + FCM + bell + pages + test push | MISSING | `phase-02:21–35`, `07-integrations.md:3–60` | `Notification` + `FcmToken` models exist in schema but **zero** `prisma.notification`/`fcmToken` calls in `src`; no firebase deps (`package.json`); no bell/page/SW | Models are dead DDL |
| `user.registered` on signup | MISSING | `phase-02:36` | Register creates nothing but user/profile/workspace/session | No `onUserRegistered` hook point |
| WhatsApp builder from settings | PARTIAL | `phase-02:22` | `normalizeContactUrl` (`lib/contact.ts`) + wa.me float in template (`ClassicTemplate.tsx:924–934`) fed by **user content**, not platform settings | Same `wa.me` mechanism, wrong source (per-user, not platform) |

### Phase 3 — Plans & Subscriptions (0%: 0/15)

Models `Plan/Subscription/SubscriptionEvent/Payment` exist in schema (lines ~629–718) with **zero** `prisma.subscription|plan|payment` calls in `src`. Consequently MISSING: computed state, `canPublish`, plan CRUD, subscription requests + WhatsApp code flow, approve/reject transaction, grant/extend/suspend, users admin, reset-password, lifecycle cron, `/app/subscription`, DataTable admin, all 15 acceptance criteria. Publishing works with no subscription (`updatePortfolio` has no state check) — DIFFERENT from journeys 1–4 (`02:38–43`) and A2 (`planning-notes.md:42`).

### Phase 4 — Media (~30%: 1 DONE, 3 PARTIAL, 8 MISSING of 12 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| `Media` model + upload/list/delete + `GET /me/storage` | PARTIAL | `phase-04-media.md:6–28` | `Media`/`MediaFile` models in schema, unused by `src`; **no** upload/list/delete endpoints; Cloudinary unsigned upload live instead (`cloudinary.ts:13–42`, keys now in `.env`) | Plan mandates Docker volume + sharp; implementation uses Cloudinary (DIFFERENT storage) |
| Magic-bytes sniff, SVG/GIF reject, WebP≤2000px, thumbs, quota+lock, orphan lifecycle | MISSING | `phase-04-media.md:14–18`, criteria 1–5,7–8 | `validateFile()` checks extension/MIME + 50 MB only (`cloudinary.ts:67–81`); GIF allowed (plan bans); no sharp, no thumbs, no quota, no orphan tracking | — |
| `GET /uploads/:key` serving semantics | MISSING | `phase-04-media.md:20` | No such route; Cloudinary CDN URLs served directly | — |
| `MediaPicker` reusable + grid + delete + quota meter | PARTIAL | `phase-04-media.md:29` | `MediaPicker.tsx` (Supabase Storage, grid, upload) exists, **bucket `portfolio-media` verified absent** via read-only storage list (empty `names=`) | Code-only, unusable until bucket + anon INSERT policy |
| IDOR ownership on media | PARTIAL | criterion 7 | MediaPicker scopes by `${userId}/` prefix; no server-side ownership check anywhere | Prefix-only, no policy yet |
| `/dev/media` verification page | MISSING | `phase-04-media.md:29` | No dev pages | — |

### Phase 5 — Builder (~40%: 4 DONE, 7 PARTIAL, 6 MISSING of 17 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| Zod `.strict()` doc `schemaVersion:1`, plain-text-only, length/count caps | MISSING | `phase-05:14–19` | No `zod` dependency; `content/settings/appearance` free `Json`; no caps | — |
| All section types incl. gallery/files/contact/custom | PARTIAL | `phase-05:16` | hero/about/experience/skills/services/projects/testimonials/footer present; `gallery`, `files`, `contact` (merged into footer), `custom` absent | 8/12 types |
| Server endpoints (GET draft, PUT expectedVersion→409, publish/unpublish, username PATCH, availability, media CRUD) | MISSING | `phase-05:32` | Server Actions instead: `getOrCreateProfile/updatePortfolio/projectPage CRUD` (`actions/portfolio.ts`); direct live-save, no versioning | Different transport + no concurrency control |
| Renderer Basel view/edit, hamburger, lightbox+a11y, explicit section backgrounds, srcset/thumbs | PARTIAL | `phase-05:33–36` | `ClassicTemplate.tsx` (1019 lines, `use client`) covers 8 section types; nav exists; lightbox only in TestimonialsSlider; `:nth-child` unknown; 6 raw `<img>`, no srcset | Single `ClassicTemplate`, not `templates/basel/` + contract (`meta.ts`/`render`) — Phase 10 prereq absent |
| Editor state: history ≥50 + 800ms merge, dirty/saveStatus, 1.5s autosave queue, backoff, beforeunload, 409 modal | PARTIAL | `phase-05:37` | Undo/redo + dnd-kit present; **manual save only** (`handleSaveChanges`, `BuilderClient.tsx:522–590`); `useAutosave` hook dead (zero callers); no conflict handling | No autosave, no queue, no 409 path |
| Top bar / Left / Center / Right per spec | PARTIAL | `phase-05:39–42` | Two-pane (not three): Theme/Sections/Projects tabs; LivePreview; no floating block toolbar, no `EditableText`, no tablet mode, no Design tab (preset/meta-SEO), no consumption display | Structure exists, ~half the controls |
| Draft/Published + publish preconditions + plan limits at publish | MISSING | `phase-05:22–24` | Save = publish immediately; no status, no `canPublish`, no username regex/reserved/409-race (slugify + simple clash check, `lib/portfolio.ts:212–238`), no limits | Core publishing semantics absent |
| Default empty doc + placeholders-not-saved + `isSectionEmpty` | DIFFERENT | `phase-05:25` | New profiles get 8 sections **with translated starter content** (`actions/portfolio.ts:251–306`) | Opposite of “empty fields” rule |
| Fonts enum + presets + contrast warning; icons build-time | PARTIAL | `phase-05:26–27` | Free font dropdown (Inter+Poppins+serifs, `ThemeSettings.tsx:140–163`) + Google CDN (violates); lucide local ✓ | No restricted list, no presets, no contrast check |
| XSS/allowlists, no v-html | PARTIAL | `phase-05:45` | No `v-html`/equivalents (React escapes by default); no explicit allowlist module; contact-URL normalizer exists | Safe by framework default, not by allowlist |
| Editor i18n ar/en + canvas RTL/LTR by locale | PARTIAL | `phase-05:46` | Bilingual **content** (`{ar,en}`) + `dir` by `defaultLanguage`; editor chrome partially translated (dictionary has MarketOS leftovers) | Content is bilingual — which itself contradicts D1 single-language (`planning-notes.md:80`) |
| E2E register→subscribe→build→publish→republish | MISSING | criterion 16 | No E2E harness; subscribe/publish concepts absent | — |

### Phase 6 — Public pages (~35%: 2 DONE, 4 PARTIAL, 6 MISSING of 12 criteria)

| Requirement | Status | Plan ref | Project evidence | Notes |
|---|---|---|---|---|
| Gating PUBLISHED ∧ !adminHidden ∧ ACTIVE-user ∧ ACTIVE|GRACE → uniform 404 | MISSING | `phase-06:13`, criterion 1 | Any `home` page renders (`u/[username]/page.tsx:24–42`); no status/adminHidden/subscription fields or checks | Biggest Phase-6 gap |
| Public API returns `publishedDoc` only, no internals | DIFFERENT | `phase-06:14`, criterion 3 | No public API; page passes **full profile** (contactLinks, appearance, localized) to a client component | Draft-leak class of bug the plan was written to prevent (`03:42`) |
| `lang/dir` from content locale; SSR cache 60s + SWR; noindex for unavailable | PARTIAL | `phase-06:15–17` | `dir` set on template div (`ClassicTemplate.tsx:866`), not `<html>`; no cache (dynamic); no `noindex` | Per-component, not per-document |
| SEO: title/desc/canonical/OG/Twitter/locale/JSON-LD | PARTIAL | `phase-06:24`, criterion 5 | Title+description + relative OG (`layout.tsx:28–53`, `u/.../page.tsx:28–37`); **no canonical, no JSON-LD, no `og:locale`, OG image relative** | Metadata exists, depth missing |
| Sitemap (visible + projects) / robots (allow /u, disallow /app /admin /api) | PARTIAL | `phase-06:25`, criterion 7 | Sitemap = base + portfolios (`sitemap.ts:5–33`); robots allows `/,/u/`, disallows `/profile/,/api/,/admin` (`robots.ts:9–10`) | No project URLs; `/app` never existed so its disallow is moot |
| Performance (thumbs/srcset/lazy, hero priority, swap) + Lighthouse ≥90 | PARTIAL | `phase-06:26`, criterion 9 | `loading="lazy"` only in MediaPicker; no srcset/thumbs; hero is CSS gradient; no Lighthouse run recorded | — |
| Owner “view page” button with availability state | PARTIAL | `phase-06:27` | “View Live Portfolio” link (`BuilderClient.tsx:2224`) always opens `/u/username` | No published/gated state shown |
| Username case normalization; missing slug → 404 | PARTIAL | criterion 10 | `notFound()` on missing page/project (`page.tsx:40–42` + projects `page.tsx:40–42`); no lowercase normalization in code | 404 path exists; normalization absent |

### Phase 7 — Admin (0%)

No `/admin/*` routes (route inventory §4), no dashboard, no portfolios hide/unhide (`adminHidden` field itself absent from schema — only legacy `isAdmin` flag), no audit UI (model unused), no settings UI, no DataTable, no i18n-lint/axe/EXPLAIN work. All 10 criteria MISSING.

### Phase 8 — Landing (0%)

No `/` route (returns 404; route inventory), no `/en`, no `GET /api/public/plans`, no legal pages. All 9 criteria MISSING. (Plan itself schedules this last — consistent.)

### Phase 9 — Hardening & Deployment (0%)

No Docker artifacts, no Caddy, no backup scripts, no `ADMIN-GUIDE.md`, no permission matrix, no attack tests, no capacity plan, no FCM-on-domain check. 11/11 MISSING. `README.md` exists but is GitHub's default init content (merge `5d0e360`), not the plan's operations README.

### Phases 10–13 (0% except noted)

- P10: single `ClassicTemplate.tsx`, not `templates/<id>/` + `meta.ts`; no 2nd template; no `limits.templates`; no badge. 0/7 (colors/font/avatar happen to be unrestricted — satisfies criterion 4 by accident, counted PARTIAL once in §3 table as criterion-level note, not phase credit).
- P11: `PortfolioViewEvent` per-event rows + charts dashboard — the plan explicitly requires cumulative `DailyVisit` + numbers-only UI (`phase-11:13–17`). Model and presentation both DIFFERENT. 0/8 on plan terms (functional analytics exists off-plan).
- P12: no CV code, jobs, or endpoints. 0/9.
- P13: no `LandingContent`, no endpoints, no admin UI. 0/10.

## 4. Routes comparison

| Planned (`02-sitemap-and-journeys.md:4–36`) | Exists in project | Verdict |
|---|---|---|
| `/` landing | No `src/app/page.tsx` → 404 | MISSING |
| `/login`, `/register` (phone+password) | `/login`, `/register` exist (email+password) | DIFFERENT (identity) |
| `/u/:username`, `/u/:username/projects/:slug` | Both exist | DONE (structure; gating/SEO partial per §3) |
| `/terms`, `/privacy` | Absent | MISSING (plan: build only with client text — correctly absent) |
| `/sitemap.xml`, `/robots.txt` | Both exist | PARTIAL (portfolios only; no projects) |
| `/app`, `/app/builder`, `/app/subscription`, `/app/notifications`, `/app/settings` | None; builder lives at `/profile/builder`, analytics at `/profile/builder/analytics` | DIFFERENT (paths) + MISSING (4/5 surfaces) |
| `/admin` + 9 sub-routes | None | MISSING (all) |
| `/api/auth/*` (register/login/logout/me/change-password) | register/login/logout only | PARTIAL (me + change-password missing) |
| `/api/me/**` (8 groups) | None | MISSING |
| `/api/builder/**` (7 endpoints) | None (Server Actions instead) | DIFFERENT (transport) + MISSING (semantics) |
| `/api/public/**` (contact/plans/u) | None (pages query Prisma directly) | MISSING |
| `/api/admin/**` (10 groups) | None | MISSING |
| `/api/uploads`, `/uploads/:key`, `/api/health` | None | MISSING |

Existing but unplanned: `/profile/builder/verify-required`, `/api/verify-email`, `/profile/builder/analytics`.

## 5. Database comparison

Live schema = `_legacy-backend-reference/prisma/schema.prisma` only (no `prisma/` at root; `find` §2); applied via `supabase/migrations/0001_init.sql` (46 tables). Plan model = `04-database-and-data-model.md:10–123` + revisions.

| Planned table/field | Project equivalent | Verdict |
|---|---|---|
| `User{phone unique, name, role, status, mustChangePassword, locale}` | `User{email unique, displayName, isAdmin, emailVerified}` (schema lines 19–54) | DIFFERENT — identity column, role enum, status, locale, mustChangePassword all absent |
| `Session{tokenHash, remember, lastSeenAt, ua, ip}` | `Session{token raw, expiresAt}` (schema 70–80) | DIFFERENT — raw token storage; metadata fields absent |
| `RateLimitBucket` (revision) | Absent (all 46 models inventoried; zero `rg` hits) | MISSING |
| `Plan{name{i18n}, priceEgp, durationDays, limits{…}, isActive, sortOrder}` | Legacy `Plan{priceEgp, priceEgpAnnual, workspaceLimit, postsPerMonth, storageMb, trialDays, features}` — unused by `src` | DIFFERENT shape + dead |
| `SubscriptionRequest{code, PENDING, partial-unique}` | Absent | MISSING (plan's monetization key) |
| `Subscription{startsAt/endsAt/graceEndsAt/canceledAt/planSnapshot/requestId}` | Legacy `Subscription{status/startedAt/expiresAt/trial/…}` — unused | DIFFERENT + dead |
| `Payment{manual, subscriptionId unique, confirmedBy}` | Legacy `Payment{provider/orderId/…}` — unused | DIFFERENT + dead |
| `Portfolio{username unique, DRAFT/PUBLISHED, adminHidden(+Reason), draftDoc/publishedDoc/schemaVersion, draftVersion}` | `UserProfile{username} + ProfilePage + PageSection + ProjectPage/Item + Testimonial + Service` | DIFFERENT — relational doc vs versioned JSON docs; no status/hidden/version fields |
| `Media{kind/mime/storageKey/thumbKey/orphanedAt}` | Legacy `Media{cloudinaryId/url/workspaceId}` + `MediaFile{path/publicUrl}` — unused by `src` | DIFFERENT + dead; live uploads go to Cloudinary (no record) or nowhere |
| `Notification{title{i18n}/dedupeKey/readAt}` | `Notification{title/body/link/isRead}` — unused | DIFFERENT + dead |
| `DeviceToken` / `PlatformSetting` / `AuditLog` | `FcmToken` / `SystemSetting{key/value}` / `AdminAuditLog` — all unused | DIFFERENT names, dead |
| `DailyVisit` + `VisitDedup` (Round 2) | `PortfolioViewEvent` per-event rows | DIFFERENT — exact anti-pattern the plan bans (`03:71`) |
| `LandingContent`, `CvImportJob`, `CvExportJob` | Absent (zero `rg` hits incl. schema) | MISSING |
| Enums `Role/UserStatus/RequestStatus/PortfolioStatus/MediaKind` | Zero `enum` in schema (`rg "^enum "` empty) — all statuses are strings | DIFFERENT |
| `@@index` on all filter/sort/join columns | Verified complete for used columns (audit-report §8) | DONE (the one DB-plan item fully met) |
| Soft-delete users, cascade rules (§137) | `onDelete: Cascade/SetNull` present per-relation in schema | PARTIAL (declared in DDL; user-deletion flow untested) |

Seed (`supabase/seed.sql`): test user + profile + home page + 3 sections + workspace — portfolio test fixture, not the plan's admin-seed (`phase-00:41`).

## 6. Integrations and non-functional comparison

| Area | Plan | Project | Verdict |
|---|---|---|---|
| AuthN identity | Phone + password, no email anywhere (`planning-notes.md:7`, `AGENT-RULES.md:4`) | Email + password; verification flow built (then neutered: register forces `emailVerified=true`, gate removed) | DIFFERENT (violates explicit no-email rule) |
| Storage | Docker volume + sharp/WebP + quota + orphan cleanup (`07:67–70`, Phase 4) | Cloudinary unsigned (live) + Supabase-Storage `MediaPicker` (bucket absent remotely) | DIFFERENT + PARTIAL |
| Email | None, ever | Console-log stub (`resend/send.ts:4` TODO) + dormant verify routes | EXTRA against plan (harmless, unused) |
| Payments/subscriptions | Manual WhatsApp + admin approve | None | MISSING |
| Analytics | Cumulative, numbers-only, all plans (D9) | Per-event rows + charts dashboard | DIFFERENT (model + presentation) |
| SEO | Canonical/OG/Twitter/locale/JSON-LD/hreflang/sitemap+projects | Title/desc + relative OG; sitemap portfolios-only | PARTIAL (~30%) |
| i18n | ar/en full chrome, RTL-first, logical props, self-hosted fonts | ar/en dictionaries + `dir` handling; Google Fonts CDN; unrestricted font list | PARTIAL (~60%; A11 violated) |
| Perf | KVM1 rules: indexes, no N+1, short public cache, aggregate counters | Indexes DONE; N+1 mostly avoided but chatty sequential RTTs (Cairo→Frankfurt 440 ms median); no public cache; per-event rows | PARTIAL (~40%; see audit-report §1–5) |
| Security | 06-plan table (argon2, hashed sessions, rate limit, CSRF+Origin, Zod strict, allowlists, upload sniffing, headers, audit) | bcrypt-6, raw tokens, no rate limit on auth, no CSRF check, no Zod, no allowlist module, MIME-only upload check, no security headers, no audit writes | PARTIAL (~15%; only generic 401 + httpOnly cookies match) |
| Scalability/hosting | Hostinger KVM1, Docker, Caddy, backups, capacity plan | Supabase cloud (Frankfurt), Vercel-style Next, no Docker/Caddy/backups | DIFFERENT (hosting decision inverted; latency profile is the cost) |
| Testing | Vitest + Playwright + E2E + security tests, Dockerized | `vitest.config.ts` + zero test files; no Playwright | MISSING |
| API conventions | Zod + `{code,message,fields?}` + mandatory pagination + manifest | `{ok,error}` ad-hoc, no validation lib, no pagination, no manifest | DIFFERENT |

## 7. Extra items not in the plan

1. **Workspace system** (`Workspace`, `WorkspaceMember`, auto-create on register/first visit, `ensurePersonalWorkspace`) — the plan has no workspaces; largest conceptual extra.
2. **Email identity + verification flow** (routes, stub, verify-required page) — explicitly banned by plan, then half-removed.
3. **Cloudinary uploads** (live, keys in `.env`) + Supabase-Storage `MediaPicker` (code-only).
4. **Analytics dashboard with charts** (plan v1 forbids charts) on a non-conforming event model.
5. **Orphaned `WorkspacePickerModal` + `getAdminWorkspaceContent`** (dead after MediaPicker swap).
6. **`jose` JWT helpers, `next-themes`, `dnd-kit`** — library choices with no plan equivalent.
7. **`/profile/*` route namespace** (plan: `/app/*`), `TrackBeacon` keepalive, `unstable_cache` platform name, `groupBy` analytics, placeholder `public/` assets, `audit-report.md` itself.
8. Dead code: `useAutosave` hook (zero callers), `updatePassword`/`createPasswordResetToken` helpers (unwired), `docker:*` npm scripts (no Docker files).

## 8. Contradictions / ambiguities inside the plan

1. `phases/phases.md:1` declares itself outdated vs `README.md` — resolved by its own note; use README.
2. `00-project-status.md:5` (“no phases officially complete”) vs `:3` (“S3/Phase 5 complete, partially verified”) vs `:12` (“implementation has not started”) — mutually inconsistent statuses in one file.
3. `00-project-status.md:7` approves admin login **by email** while `planning-notes.md:7` + `AGENT-RULES.md:4` ban email “anywhere” — approved deviation, but unbounded wording.
4. `02:8` + C5 mandate phone auth, yet `05:13` register spec lists `name, phone` while `04:10` User has `name` — consistent; no contradiction, but the project implemented email instead.
5. `05:75` (D4: serve uploads without ownership check) vs `05:46` (serve only if linked/visible) — resolved by revision note, keep D4.
6. D1 single-language content (`planning-notes.md:80`) vs Q2 “revisit after Phase 5” (`00:6`) — decision is explicitly temporary; implementation went bilingual anyway.
7. `/app/*` namespace (`02:14–21`) vs `/profile/*` reality — no plan cover for the rename; treat as unapproved deviation.
8. Stack statements assume Nuxt/Vue/PHP-style shaken (`unplugin-icons`, `shared/`, Nitro tasks) — inapplicable verbatim to the Next.js implementation; comparison done on intent.

## 9. Could not verify

- Live runtime behavior (page timings, redirect chains, builder saves) — no server started this session; cited from `local/docs/audit-report.md` §§2–3 where available, else code-reading only.
- Supabase remote state beyond two read-only probes (bucket list empty; `users` count-range 7 rows) — RLS/policies, Storage policies, seed-row contents not inspected.
- Visual/UX requirements (RTL rendering, themes, mobile drawers, lightbox a11y, contrast AA) — no browser available.
- FCM/WhatsApp/real-email paths — no credentials or devices; code absence is the evidence.
- Whether `supabase/migrations/0001_init.sql` matches the live DB exactly (no `migrate status` run — would needphyr DB introspection beyond read-only SELECTs; the file is the applied artifact per prior session).

## 10. Recommended next steps (prioritized, not applied)

1. **Decide the stack question explicitly.** The plan mandates Nuxt 3 + Docker + phone auth; the project is Next.js + Supabase + email. Either re-align or formally amend the plan — every subsequent gap (auth, hosting, i18n lib, tasks) flows from this undecided fork. (Plan ref: `AGENT-PROMPT.md:13`, `planning-notes.md:6`.)
2. **S2 monetization before more product polish** (`README.md` sprint order): `SubscriptionRequest` + WhatsApp code + approve transaction + computed state + publish/subscription gating. Without it, Phase 5 criterion 9 and journeys 1–4 cannot pass.
3. **Replace the data-model core or adopt it:** either implement `Portfolio{draftDoc/publishedDoc/draftVersion}` + `Media{storageKey}` + `DailyVisit` per `04`, or record the relational model as the new canonical design and update `04`/`05`/Phase 5–6 criteria accordingly.
4. **Close the security deltas that are cheap:** SHA-256 session storage, auth rate limiting, 8-char minimum, security headers, upload allowlist — all Phase 1/4 criteria, no architecture needed (`06-security-plan.md` rows).
5. **Finish S3 honestly:** username regex + reserved list + 409 races, publish preconditions, sitemap projects + canonical/JSON-LD, second template under contract — then write the missing `local/docs/phase-05-verification.md` the plan requires (`README.md:42`).
6. **Defer S5–S7 correctly:** admin, landing/CMS, CV, hardening stay at 0% by plan order; do not build landing content before S4 differentiators exist (`README.md:18` rationale).
