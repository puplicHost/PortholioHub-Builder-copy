# Sprint E verification — notifications + settings (Phase 2 remainder)

- Scope: E1–E4 per `local/docs/gap-closure-plan.md` §1 (Sprint E). FCM live push intentionally deferred (no Firebase infra).
- No SQL migration needed: `notifications` columns + partial unique and `fcm_tokens` shape already landed in `0004` (applied); `systemSetting` registry is code-only.

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint` | 28 errors / 53 warnings — identical to baseline; 3 self-found `set-state-in-effect` fixed via proven IIFE pattern (one exhaustive-deps accommodation: polling effect lists `open`, harmless refetch) |
| `next build` | PENDING (runs with Sprint G/H gate; dev-HMR covered all new routes this round) |

## Live battery (VERIFIED on dev, HMR-current)

| # | Test | Result |
|---|---|---|
| 1 | Register fresh user (fires `user.registered`) | 201; admin-addressed bilingual row in DB (`{"en":"New user registered",…}`) |
| 2 | Own list + unread-count | 200 `[]`, unread 0 |
| 3 | IDOR: mark another user's notification | **404** (ownership-scoped `updateMany`) |
| 4 | Read-all (empty) + duplicate register | 200 `marked:0`; 409 (pre-notify, no dup rows) |
| 5 | `/profile/notifications` page | 200 |
| 6 | Bell in builder + admin header | rendered (`aria-label="Notifications"` ×1); dropdown/polling are client interactions (user click-through at end) |
| 7 | Seed regression | login 200, builder 200, `/u/testuser` → Not-Found page (correct: NONE subscription gating from Sprint C) |

## Visual-freeze check (Sprint E)

- `src/components/**`: no existing file touched (new `notifications/*` only). `src/app/**` existing touched: `admin/layout.tsx` + `BuilderClient.tsx` (one bell icon button each, existing styles), `register/route.ts` (server-only hook). No existing look changed.

## Deferred (unchanged)

FCM sending + device UX + SW (needs Firebase human items); `POST /api/me/devices` + public contact endpoint were plan Phase-2 items not in Sprint E scope — carried to a later pass if wanted.
