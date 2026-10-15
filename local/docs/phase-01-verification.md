# Sprint A verification — FINAL (security quick wins, Phase 1 slice)

- Scope: A1–A14 per `local/docs/gap-closure-plan.md` §1 + A15 CSRF hardening fix (added during review).
- Prerequisite confirmed by user: `0002_auth_security.sql` applied (probe: all 7 columns present, `rate_limit_buckets` exists). `0002b_make_admin.sql`: user-side, untouched by automation.
- Live server: `npm run dev` (PID 689437, since stopped). No secrets printed anywhere.

## Static checks (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint` | 34 errors / 54 warnings — 0 new vs baselines (all pre-existing `any`/img issues); one self-found warning fixed |
| `prisma generate` | v5.22.0 with `User.phone/status/mustChangePassword`, `Session.remember/lastSeenAt/userAgent/ip`, `RateLimitBucket` |
| `next build` | NOT run yet — runs after this report per gate order (sitemap touches DB; build only on applied schema, which is now confirmed, so it is unblocked next) |

## Live battery (VERIFIED, seed user + fresh addresses)

| # | Test | Result |
|---|---|---|
| 1 | Cross-Origin POST login (`Origin: https://evil.com`) | **403** `{"code":"CSRF_REJECTED"…}` — attack blocked |
| 2 | Same-origin login | **200** `{"ok":true,"mustChangePassword":false}` + httpOnly cookie |
| 3 | Wrong password (existing + missing user) | **401** uniform `INVALID_CREDENTIALS` both cases |
| 4 | 6× wrong password, fresh email | 5× **401** → 6th **429** + `Retry-After: 894` header |
| 5 | `GET /api/auth/me` with/without cookie | **200** full shape (`phone:null` on pre-0002 row — expected) / **401** |
| 6 | Change-password: wrong current → **400**; common new (`password`) → **400**; ok → **200**; current session alive (builder 200); old password **401**; restored `Test1234!` → **200** | All pass; `seed-sessions=1` after (no strays) |
| 7 | `POST /api/cron/session-cleanup` without secret | **503** `CRON_DISABLED` (no `CRON_SECRET` set — correct) |
| 8 | Seed flow regression | builder 200 (`testuser` ×2, no redirect markers); `/u/testuser` 200 (seeded strings ×2) |

## A15 — CSRF Host-comparison fix (review follow-up, VERIFIED)

- Problem: `isSameOriginRequest` compared `Origin.host` to configured `APP_URL` host → every browser context off the canonical host:port (`:3001`, `127.0.0.1`, previews) got `CSRF_REJECTED` on all auth POSTs (reproduced in logic demo).
- Fix (`src/lib/csrf.ts` + 4 routes): compare Origin to the request's **own Host header**; APP_URL fallback only when Host absent (fail-closed otherwise); Sec-Fetch-Site dead branch removed; all four routes use `Errors.csrf()` factory.
- Re-verified on real code via `tsx` (8 cases): `:3000` ALLOW, `:3001` ALLOW, `127.0.0.1` ALLOW, `evil.com` 403, no-Host+good-origin ALLOW, no-Host+evil 403, no-Origin ALLOW, garbage 403. `tsc` 0, `eslint` clean on all 5 files.
- Live proof: same-origin `:3001` login → 200 (would have been 403 before).

## Visual-freeze check (unchanged from interim)

- `src/components/**`: zero files touched. `src/app/**`: additive/invisible only (phone field, Suspense wrappers, error-field names, new change-password page copying login card 1:1).

## Conformance

**28% → ~39%** ((32 DONE + 27 PARTIAL×0.5)/118). Ready for Sprint B green light. Next: `next build` + Sprint B (0003 with status-count check query + backfill).
