# Sprint C verification — subscriptions & monetization (INTERIM: static only)

- Scope: C1–C11 per `local/docs/gap-closure-plan.md` §1 (Sprint C) + admin billing pages (requests/subscriptions/payments/plans) + lifecycle cron + vercel.json cron entry.
- Gate state: `supabase/migrations/0004_subscriptions.sql` written, **not applied**. Sprint C code reads the new tables/columns → live checks run only after user confirms application.

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 (2 genuine errors found + fixed: missing Prisma back-relation, unselected `request.id`) |
| `eslint` | 28 errors / 53 warnings — identical to Sprint B baseline; 4 self-found items fixed (unused imports, set-state-in-effect, dead variable) |
| `prisma generate` | v5.22.0 with `Plan.durationDays/limits/nameI18n`, `Subscription.planSnapshot/requestId/createdBy`, `Payment.confirmedBy/confirmedAt`, `Notification {Json titles, dedupeKey, readAt}`, `SubscriptionRequest` |
| `next build` + live battery | PENDING user applying 0004 (gate order) |

## SQL deliverable (NOT run)

- `supabase/migrations/0004_subscriptions.sql` — new `subscription_requests` (+ code unique + PENDING partial unique), `plans` += 3 nullable columns, `subscriptions` += 3 columns, `payments` += 2 columns, `notifications` title/body → JSONB + `dedupe_key`/`read_at` + partial unique (notification columns folded in from planned 0005 so Sprint C is self-contained — table is empty). Check queries in file header:
  `SELECT count(*) FROM subscription_requests;` (fails before, 0 after) +
  `information_schema` column probe.

## What was built (code, untested-live)

- Engine: `lib/subscriptions.ts` (computed NONE/ACTIVE/GRACE/EXPIRED/SUSPENDED with boundary rules, `canPublish`, `getEffectiveLimits` from snapshot→live→free defaults), `lib/whatsapp.ts` (digits-only + encoded wa.me links + request message).
- User APIs: `me/plans`, `me/subscription-requests` (POST w/ 6-char code + WhatsApp URL + 409 on second pending; DELETE cancel), `me/subscription`, `me/subscription/history` (paginated).
- Admin APIs: requests list/approve (single transaction: PENDING-lock → A4 dates → Subscription+Payment+request+audit; double-approve → 409)/reject; subscriptions list/grant/extend/suspend/unsuspend; payments list; plans GET/POST/PATCH/DELETE (delete refused when subscriptions exist).
- Publish path: `publishProfile` enforces `canPublish` + plan limits + 30/50/60 safety caps; `updatePortfolio` enforces safety caps every save; visibility gate now takes subscription state (both `/u` pages).
- Lifecycle: `runLifecycle` (7/3d reminders, grace+expired to user+admins, dedupe-guarded) + Bearer-protected cron route + `vercel.json` 2nd daily schedule (Hobby-fine: daily cadence).
- UI: `/profile/subscription` (status card, plans grid, request+WhatsApp+cancel, history); admin Requests/Subscriptions/Payments/Plans pages + sidebar links + dashboard shortcuts.

## Visual-freeze check (Sprint C)

- `src/components/**`: no existing file touched (new `admin/*` ×4 + shared `SettingsForm` extended for arrays — same inputs). `src/app/**` existing touched: `u/[username]` pages (data layer + gate args only), `BuilderClient` untouched this sprint, admin dashboard (link card swap only). No existing look changed.

## Live verification (VERIFIED after 0004 applied)

| # | Test | Result |
|---|---|---|
| 1 | `next build` | exit 0, 57 routes |
| 2 | Fresh register → `me/subscription` | 200 `NONE`, nulls |
| 3 | `me/plans`, `me/subscription/history` | 200 `[]` + paginated meta |
| 4 | Request with bad plan | 400 `Plan is not available` |
| 5 | Publish without subscription (seed) | `{success:false, subscriptionRequired:true}` |
| 6 | `/u/testuser` with NONE | Not-Found page (gating live) |
| 7 | Admin APIs as non-admin | 403 all (incl. corrected `subscription-requests` path; one false 404 was my wrong test URL) |
| 8 | Cron without secret | 503 |
| 9 | Seed flow regression | builder 200 |
| 10 | Admin happy paths (plan create, request→approve→subscription+payment+audit, grant/extend/suspend) | CODE-VERIFIED only — needs admin session (no test admin available without sharing passwords); recommended user click-through |

Process lesson: a stale dev server (pre-`generate` in-memory Prisma client) caused false 500s; killed it, fresh server green. Rule: restart dev after every `prisma generate`.
