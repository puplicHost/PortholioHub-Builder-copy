# Sprint B verification — Draft/Published + gating (INTERIM: static only)

- Scope: B1–B14 per `local/docs/gap-closure-plan.md` §1 (Sprint B), except B5-subscription (passes through to Sprint C by plan).
- Gate state: `supabase/migrations/0003_portfolio_status.sql` written, **not applied**. Sprint B code reads the new columns → live checks run only after user confirms application.

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint` | 28 errors / 53 warnings — **zero new** (baseline 34/54; rewrites removed 6 pre-existing `as any` errors; 2 self-found items fixed: `prefer-const`, rest-sibling warnings) |
| `prisma generate` | v5.22.0 with `UserProfile.status/adminHidden/adminHiddenReason/version` |
| `next build` + live seed flow | PENDING user applying 0003 (gate order) |

## SQL deliverable (NOT run)

- `supabase/migrations/0003_portfolio_status.sql` — 4× ADD COLUMN (safe defaults) + backfill `status='PUBLISHED'` for rows with a published `home` page. Check query (before/after counts) embedded in the file header:
  `SELECT status, count(*) FROM user_profiles GROUP BY status ORDER BY 1;`

## What was built (code, untested-live)

- `publishProfile`/`unpublishProfile` + preconditions (`username`, hero name, ≥1 visible section); Publish button saves then publishes, toggles to Unpublish; toasts on both paths.
- `updatePortfolio`: `expectedVersion` check → `{conflict:true}` (+ P2002 race catch); version bumped + returned; client stores it (stale saves will surface, full modal in F).
- Username policy (`USERNAME_PATTERN` + 45-name reserved list) enforced in `updatePortfolio` + new `GET /api/username-available`.
- `lib/visibility.ts` gate (status/hidden; subscription joins in C) applied in both `/u` pages; `toPublicProfile` DTO strips `userId/status/adminHidden*/version` (template reads none of them — verified by grep).
- SEO: absolute canonical, `og:locale` (ar_EG/en_US by content), absolute OG image w/ avatar, JSON-LD Person/breadcrumb with `</script>` escaping, `noindex` on misses. Sitemap += published projects of visible profiles. New `GET /api/health` (200/503, no leak).

## Visual-freeze check (Sprint B)

- `src/components/**`: zero files touched. `src/app/**` touched: `u/[username]/page.tsx` + `projects/[slug]/page.tsx` (data layer + head tags only; rendered tree identical), `BuilderClient.tsx` (Publish label toggles Publish/Unpublish by status — same button/slot), `sitemap.ts` (no UI). New files: `visibility.ts`, `public-profile.ts`, `username-available/route.ts`, `health/route.ts`.

## Live verification (VERIFIED — 0003 found applied, backfill preserved visibility)

| # | Test | Result |
|---|---|---|
| 1 | `next build` | exit 0, all routes incl. new `/api/username-available`, `/api/health` |
| 2 | `GET /api/health` | 200 `{"status":"ok","db":"up"}` |
| 3 | Username policy API | taken → taken-msg; `Admin` → reserved; fresh → `available:true` |
| 4 | Gating: fresh DRAFT user page | Not-Found page (dev serves HTTP 200 with notFound body — known Next-dev quirk, documented in audit-report) |
| 5 | Seed status after backfill | `PUBLISHED`, version 1 |
| 6 | Version conflict (stale `expectedVersion`) | `{success:false, conflict:true, currentVersion}` |
| 7 | Reserved username on save | `{success:false, error:'This username is reserved'}` |
| 8 | Unpublish → page shows Not Found; publish → 200 portfolio + canonical + JSON-LD | Full cycle green (versions 2→3) |
| 9 | Seed flow regression | builder 200, `/u/testuser` 200 with seeded content |

Method note: publish/unpublish/conflict exercised via a temporary `/api/test-sprint-b` scaffold invoking the real action code, removed afterwards (`git status` clean of it).
