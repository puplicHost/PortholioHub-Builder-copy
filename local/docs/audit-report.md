# Read-only audit report — PortfolioHub Builder copy

- Date (UTC): 2026-10-15. Machine: Cairo. DB: Supabase `eu-central-1` (Frankfurt).
- Method: `tsc`, `eslint`, `next build`, `next dev` + `curl` timings, dev-log Prisma query logs, static `rg` searches, read-only `SELECT 1` RTT probe. No project file was modified; no DB writes ran.
- Baseline `git status` before audit: clean. Report file `local/docs/audit-report.md` is the only file created.

## 1. Executive summary — top 5 slowness causes (ranked by measured impact)

1. **Cairo → Frankfurt round trips dominate every page.** Standalone `SELECT 1` median **440 ms** (409/410/429/440/440/446/446/1024). In-request queries land ~190–290 ms apart. Builder does ~12–15 sequential round trips → **4.6 s** application time; `/u/testuser` ~7 queries → **1.18 s**; analytics ~34 queries → **9.8 s**. Pure latency, not query complexity (all queries hit indexed columns; tables are tiny).
2. **Analytics page is the slowest route: 11.1 s total.** `getPortfolioAnalytics` fires 11 `COUNT`s + 1 event scan + profile/children fetches (34 SELECTs in the measured window). `Promise.all` helps, but each query still pays pool-checkout + Frankfurt RTT, and pgbouncer transaction mode serializes behind a small pool.
3. **Builder re-fetches the whole profile up to 4× per load.** `getOrCreateProfile` (`src/lib/actions/portfolio.ts`) re-runs the full `userProfile + pages + sections + projectPages + items` fetch at lines 59, 103, 157, 207 (experience/testimonials/footer ensure-blocks). Each re-fetch is 5 sequential queries. Save path (`updatePortfolio`, lines 344–363 and 422–495) loops per-section `UPDATE`s and per-project update + `deleteMany` + `createMany`.
4. **`next dev` compile cost inflates every first visit** (dev-only): `next.js: 4.1 s` cold vs `3–37 ms` warm; `proxy.ts: 183 ms` cold vs `3–10 ms` warm. Production `next build` compiled clean in 5.1 s + 9.1 s typecheck.
5. **Heavy client bundle served even to public visitors.** `BuilderClient.tsx` (2,786 lines, `use client`), `ClassicTemplate.tsx` (1,019 lines, `use client`) ships to `/u/*` visitors; 31 `use client` modules; **24 raw `<img>` tags, zero `next/image`** (6 in ClassicTemplate alone); render-blocking Google Fonts `@import` (`globals.css:1`) + runtime-injected font `<link>` (`ClassicTemplate.tsx:860`); `public/` dir missing → `/opengraph.png` and `/favicon.ico` both **404**.

## 2. Errors table

| ID | Severity | Location | Exact error text | Cause |
|----|----------|----------|------------------|-------|
| E1 | Medium | `src/app/profile/builder/BuilderClient.tsx:103`, `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx:45`, `src/components/portfolio/templates/ClassicTemplate.tsx:44` | `Error: Calling setState synchronously within an effect can trigger cascading renders` (`react-hooks/set-state-in-effect`, eslint error ×3) | `setLang`/`setTheme`/equivalent called directly in `useEffect`; extra render passes on every mount |
| E2 | Low | `src/lib/portfolio.ts` (11×: 313,324,343,344,347,348,389,394,397…), `_legacy-backend-reference/src/lib/portfolio.ts` (11×), `src/app/u/[username]/projects/[slug]/page.tsx` (6×), `ProjectPageView.tsx` (3×), `ProjectManager.tsx` (1×) | `Unexpected any. Specify a different type` (`@typescript-eslint/no-explicit-any`, 32 total) | Untyped JSON/`any` code; type-safety only, zero runtime effect (`tsc` exit 0, build exit 0) |
| E3 | Low | `src/lib/contact.ts:26` | `'raw' is never reassigned. Use 'const' instead` (`prefer-const`) | Trivial; the 1 auto-fixable item |
| E4 | Low | `src/app/profile/builder/BuilderClient.tsx:554` | `` `'` can be escaped… `` (`react/no-unescaped-entities`) | Trivial JSX escaping |
| E5 | Low | `/opengraph.png`, `/favicon.ico` → **404** (measured via curl) | `404` on assets referenced by `src/app/layout.tsx` metadata (`/opengraph.png`) and default icon | `public/` directory does not exist in the project |
| E6 | Low | `src/lib/resend/send.ts:4` | `TODO: replace with a real provider (e.g. Resend) before production` | Verification emails are a console-log stub; any user clicking “resend” gets nothing |
| E7 | Low (ops) | Terminal: `⨯ Another next dev server is already running` (seen 4× across runs) | New `npm run dev` exits because a previous `next dev` child survives wrapper kills | Stale processes hold 3001; start fails until the exact PID is killed |

Runtime errors observed during audit: **none** — zero 500s, zero Prisma errors, zero redirect loops across `/`, `/login`, `/register`, `/profile/builder` (±session), `/u/testuser`, `/profile/builder/analytics`, `GET /api/auth/login` → 405, `GET /api/portfolio/track` → 405, `GET /api/verify-email` (no token) → 307 to `/login?error=invalid_token`. `tsc --noEmit` exit 0 (0 errors). `next build` exit 0. `eslint` exit 1 with 89 problems (37 errors above + 52 warnings: `no-unused-vars` ×28, `no-img-element` ×24).

## 3. Slowness findings table

| ID | Impact | Evidence (measured) | Location | Why it is slow |
|----|--------|---------------------|----------|----------------|
| S1 | Highest | RTT 409–1024 ms, median **440 ms**; inter-query gaps ~190 ms in dev log; builder app-time 4.6 s, /u 1.18 s, analytics 9.8 s | All Prisma paths → Supabase pooler `aws-1-eu-central-1` | Every query pays Cairo→Frankfurt TLS+Supavisor+PG round trip; access is chatty (S4) with no cache |
| S2 | High | `/profile/builder/analytics` → 200 in **11.1 s** (`application-code: 9.8 s`, TTFB 6.5 s); 34 SELECTs in request window (11 COUNTs on `portfolio_view_events`) | `src/lib/actions/portfolio.ts:734–836` (`getPortfolioAnalytics`) | 12-way `Promise.all` still pays per-query checkout + RTT; small Prisma pool queues behind pgbouncer transaction mode |
| S3 | High | `/profile/builder` (seed, warm) → 200 in **3.9–4.6 s** (`application-code: 4.6 s`), 78 KB RSC; dev log shows repeated `user_profiles`/`profile_pages`/`page_sections`/`project_pages` SELECT groups | `src/lib/actions/portfolio.ts:30–310` (re-fetches at 59/103/157/207) | Up to 4 full profile+includes loads (≈5 queries each) run sequentially per page view, even when nothing needs migrating |
| S4 | Medium | Save ships entire profile; server loops `pageSection.update` per section (`:344–363`) and per project update + `deleteMany` + `createMany` (`:422–495`) | `updatePortfolio`, `src/lib/actions/portfolio.ts:312–508`, called from `BuilderClient.tsx:522–590` (`handleSaveChanges`, manual click, no debounce needed) | O(sections + projects + items) sequential writes per save, each a Frankfurt round trip |
| S5 | Medium | `/u/testuser` (warm) → 200 in **1.13–1.28 s** (`application-code: 1182 ms`); log shows `system_settings` + `user_profiles` ×2 + `profile_pages` + `page_sections` + `project_pages` | `src/app/u/[username]/page.tsx:7–19` (`generateMetadata` full-row fetch, no `select`) + `:21–38` (second full fetch with all JSON columns) | Same row fetched twice sequentially; full `appearance`/`localized`/`contact_links` JSON pulled for metadata that needs only title/description; plus 1st query is always the layout's platform-name lookup |
| S6 | Medium | Layout metadata + every page pays `system_settings` SELECT (visible in all three measured windows); `cache()` in `src/lib/platform.ts:4–17` dedupes only within one request | `src/lib/platform.ts`, `src/app/layout.tsx:13` (`force-dynamic` → runs on **every** request) | Uncacheable-per-request lookup on the critical path of all routes; `force-dynamic` also disables all static optimization |
| S7 | Medium | 31 `use client` modules; biggest prod chunks 410 KB / 228 KB / 150 KB (`.next/static` total 1.8 MB); 24 `<img>`, 0 `next/image`; fonts `@import` + runtime `<link>` injection | `BuilderClient.tsx` (2786 lines), `ClassicTemplate.tsx` (1019, client-rendered for public visitors), `globals.css:1`, `ClassicTemplate.tsx:126–140,860` | Public visitors download builder-sized JS; unoptimized images hurt LCP (lint `no-img-element` ×24); font chain blocks first paint |
| S8 | Low | `proxy.ts: 183 ms` cold → `3–10 ms` warm; `next.js: 4.1 s` cold → `3–37 ms` warm; build `✓ Compiled successfully in 5.1 s` | `src/middleware.ts` (string ops + one `new URL`, zero DB/network — verified, no `prisma` import) | Middleware itself is cheap; the cold numbers are one-time compile, not per-request cost |

## 4. Query inventory

| Page / path | Prisma queries (in order) | Count (round trips) | Issues |
|---|---|---|---|
| `layout` (every request) | `systemSetting.findUnique({key:'platform.name'})` | 1 | S6: uncacheable per-request; `force-dynamic` forces it always |
| `/login`, `/register` (GET) | `systemSetting` (via layout) | 1 | None (no auth check, correct) |
| `/profile/builder` (seed) | `session.findUnique+user` → `workspace.findFirst` → `workspaceMember.findFirst` → `userProfile.findUnique` + includes (`pages`,`sections`,`projectPages`,`items` = 4 more) → `systemSetting` → up to 3 more full profile+includes re-fetches (ensure blocks) | ~9 typical, ~14 worst case, all sequential | S1/S3: sequential RTTs; re-fetch pattern; full-column selects |
| `/u/[username]` | `userProfile.findUnique` (metadata, full row) → `userProfile.findUnique` + includes (page) → `systemSetting` | ~7 sequential | S5: double fetch, over-fetch (no `select`) |
| `/u/[username]/projects/[slug]` | Same pattern as `/u` + `projectPage.findFirst` + items (code: `ProjectPageView`, `page.tsx`) | ~8 (not timed — no seeded project rows exist) | Same as S5 |
| `/profile/builder/analytics` | `session+user` → workspace/member → `userProfile` (ids) → 11× `portfolioViewEvent.count` + 1× `findMany` (one `Promise.all`) + `systemSetting` | ~17 statements, partially parallel | S2: count fan-out + pool queueing |
| `POST /api/auth/login` | `user.findUnique` → `session.deleteMany` + `session.create` (inside `createSession`) → `user.update(lastLoginAt)` | 4 sequential | Fine; measured 200 in ~3 s cold (compile included) |
| `POST /api/auth/register` | `user.findUnique` → `user.create` + `profile.create` → `workspace.findFirst` → `workspace.create` → `session.deleteMany` + `session.create` | 7 sequential | Fine; necessary order; measured 201 |
| `POST /api/portfolio/track` | `userProfile.findUnique` (id only ✓) → optional `projectPage.findUnique` (id only ✓) → `viewEvent.create` | 2–3, minimal selects (good) | None; GET correctly 405; 60/min IP throttle in-memory (multi-instance unsafe — noted, low) |
| `/sitemap.xml` | `userProfile.findMany(take:500)` | 1, only on sitemap hits | Unbounded-ish but capped; fine |

N+1 check: no query-inside-render-loop except the save path (S4) and the ensure-block re-fetches (S3). `getPortfolioAnalytics` 12 counts are properly in one `Promise.all` (`:763–780`) — pattern OK, volume is the problem.

## 5. Latency analysis

- Measured standalone round trip (new client, `SELECT 1` ×8): **409, 410, 429, 440, 440, 446, 446, 1024 ms → median 440 ms**. The 1024 ms outlier shows tail sensitivity (pool checkout / TLS).
- Measured inter-query gap inside requests (dev-log timestamps, e.g. `00:08:03.518 → .709 → .910 → 04.102`): **~190 ms** per sequential query on a warm pool.
- Cost model (warm pool, sequential): builder ≈ 12–15 × ~190–290 ms ≈ **2.3–4.3 s** (observed app 4.6 s ✓); `/u` ≈ 6–7 × ~190 ms ≈ **1.1–1.3 s** (observed 1.18 s ✓); analytics ≈ 34 statements ≈ **9.8 s** observed ✓.
- Conclusion: with ~10 rows per table, query *complexity* contributes ~0 ms; **≥90% of server time is pure Cairo→Frankfurt latency × query count**. Halving query count roughly halves page time; no index or SQL tuning can move this (indexes already complete — see §8).

## 6. Dev-only slowness vs real slowness

- Dev-only: cold compile (`next.js: 4.1 s`, `proxy.ts: 183 ms`), double render of `/profile/builder` in dev (two identical `200 in 4.6 s` lines for one curl — dev artifact), verbose `prisma:query` console logging, Turbopack/webpack compile of 2,786-line client component on first hit.
- Real (survives `next build`, which passed): RTT-dominated sequential queries (S1–S6), 1.8 MB static / 410 KB biggest chunk, 24 unoptimized `<img>`, render-blocking fonts, missing `public/` assets, per-request platform lookup + `force-dynamic`, analytics count fan-out, save-path write loops.

## 7. Needs a change (not done) — prioritized

1. **Cut per-request round trips (biggest gain).** `src/lib/actions/portfolio.ts` — collapse the three ensure-blocks into one migration pass with a single re-fetch (or none when nothing changed); `src/app/u/[username]/page.tsx` — one `userProfile` fetch shared by `generateMetadata` + page (or `select` only needed columns in metadata). Expected: builder −50–70% server time, `/u` −~30%.
2. **Cache the platform name.** `src/lib/platform.ts` — memoize across requests (short TTL / `unstable_cache`), it backs every page via layout. Expected: −1 RTT (~200–440 ms) on all routes.
3. **De-fan analytics.** Replace 11 `COUNT`s with 1–2 `groupBy` queries (`src/lib/actions/portfolio.ts:763–780`); add a composite covering if needed (indexes already exist). Expected: analytics 9.8 s → ~1–2 s.
4. **Reconnect + pool for the region.** Move Supabase to nearest region when possible, or put a read replica / PgBouncer-side statement cache; raise Prisma `connection_limit` cautiously. Expected: proportional to RTT reduction (e.g. 440→60 ms ≈ 7× on DB portion).
5. **Public template to RSC + `next/image`.** `ClassicTemplate.tsx` (`use client`, 1019 lines) → server component; replace 24 `<img>` (notably `:344,428,589,686,873,977`) with `next/image`; self-host Cairo font, drop runtime `<link>` injection (`:126–140,860`) and CSS `@import` (`globals.css:1`). Expected: smaller visitor bundle, faster LCP.
6. **Save path: diff-based writes.** `updatePortfolio` + `BuilderClient.handleSaveChanges` (`:522–590`) — send only changed sections/projects instead of full-profile loops. Expected: saves from O(n) round trips to O(changed).
7. **Fix lint errors that cost renders:** `set-state-in-effect` ×3 (`BuilderClient:103`, `ProjectPageView:45`, `ClassicTemplate:44`); remove dead `useAutosave` hook (`src/hooks/useAutosave.ts`, zero callers) or wire it; add missing `public/` assets (`favicon.ico`, `opengraph.png` referenced by layout metadata).
8. **Hygiene:** replace in-memory track throttle with DB/Upstash rate limit for multi-instance; wire real email provider (`src/lib/resend/send.ts:4` TODO); kill stale `next dev` processes (E7) — use exact PIDs, never pattern-match own shell.

## 8. Things verified as OK

- `tsc --noEmit` exit 0; `next build` exit 0 (16 routes, incl. all new auth/verify routes); Prisma singleton via `globalThis` (`src/lib/prisma.ts:1–15`); app uses pooled `DATABASE_URL` (port 6543 + `pgbouncer=true`, masked check) and `DIRECT_URL` 5432 for migrations; no `?schema=` mismatch (absent on both sides → `public`).
- **Index coverage complete**: every `where`/`orderBy` field on hot paths has an index in `supabase/migrations/0001_init.sql` (`sessions.token`, `users.email`, `user_profiles.user_id/username`, `profile_pages.(profile_id,slug)`, `page_sections.page_id`, `project_pages.(profile_id,slug)`, `project_items.project_id`, `portfolio_view_events` composites, `workspaces.owner_id`, `workspace_members.*`, `system_settings.key`).
- No missing-file dynamic imports (all 3 resolve); no removed-package imports; no `/workspace` route references left in `src`; all `process.env.*` keys resolve (unset ones have code defaults); middleware does zero DB/network; `TrackBeacon.tsx:1–86` is non-blocking and guarded; `updateProfile` is `useCallback`d (`BuilderClient.tsx:594`); saves are manual-click, not per-keystroke.
