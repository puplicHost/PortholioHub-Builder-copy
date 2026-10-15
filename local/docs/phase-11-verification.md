# Sprint G verification — analytics alignment (INTERIM: static only)

- Scope: G1–G2 per `local/docs/gap-closure-plan.md` §1 (Sprint G): `DailyVisit` + `VisitDedup` model, dedupe-gated cumulative `recordVisit` with owner exclusion, track endpoint rewired, dedup cleanup cron.
- Gate state: `supabase/migrations/0006_analytics.sql` written, **not applied**. `recordVisit` degrades gracefully pre-migration (P2021 → counts legacy-style, raw event still written); full aggregate behavior needs the tables. Live battery runs after user confirms application.

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 source errors (1 stale `.next` stub for the removed old cron route; regenerates) |
| `eslint` | 28 errors / 53 warnings — identical to baseline; zero Sprint G findings |
| `prisma generate` | v5.22.0 with `DailyVisit` + `VisitDedup` (needed one back-relation fix + nullable-unique `upsert`→create-or-increment rework, both caught by tsc) |
| `next build` + live battery | PENDING user applying 0006 (gate order) |

## SQL deliverable (NOT run)

- `supabase/migrations/0006_analytics.sql` — new `daily_visits` (+ unique + index) and `visit_dedups` (+ day index), FK to `user_profiles`. Check queries in header:
  `SELECT to_regclass('public.daily_visits'), to_regclass('public.visit_dedups');` (NULL before, names after).

## Design decisions (frozen for live check)

- Dual-write during transition: dedupe-gated aggregate + raw `PortfolioViewEvent` row (dashboard incl. countries tab pixel-identical; raw growth stops only after dashboard migrates to DailyVisit — recorded future work, not this sprint).
- Owner visits excluded via session check in track route (plan criterion 3); failures silent, page never blocked (criterion 5).
- Dedupe key = sha256(portfolio|project|ip|ua|day); IP never stored raw (plan §15).
- Old `/api/cron/session-cleanup` replaced by combined `/api/cron/cleanup` (sessions + dedups>2d); `vercel.json` updated (2 daily crons, Hobby-fine).

## Visual-freeze check (Sprint G)

- No component, page, or template touched. `track/route.ts` is server-only (no UI). Zero visual surface.

## Live verification (VERIFIED — 0006 found applied via probe)

| # | Test | Result |
|---|---|---|
| 1 | Same visitor ×2 (same IP+UA) | 2× 202, **1** raw event + **1** dedup row (2nd collapsed) |
| 2 | Different UA | +1 event +1 dedup (correctly distinct) |
| 3 | `DailyVisit` accumulation | `count` increments on repeat distinct visits (2 on re-hit row) |
| 4 | Owner (seed session) tracks own portfolio | 202 accepted, **zero** new rows |
| 5 | Dashboard + builder regression | 200 both |
| 6 | Cron cleanup | Code-verified only (no `CRON_SECRET` set → 503 path already covered in Sprint A) |

Process lessons: (a) a stale dev server (pre-`generate` client) caused false 500s — killed, fresh server green; restart dev after every generate. (b) Live-found bug: Postgres unique ignores NULLs, so `projectSlug=NULL` rows duplicated instead of upserting — fixed via find-then-bump (`visits.ts`), verified (single increment). Test residue left disclosed: 3 raw events + 2 daily rows (counts 2+1) + 3 dedup rows for `testuser`, all from this battery.
