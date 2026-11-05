# Security Audit — PortfolioHub Builder (Defensive, Source-Based)

## Authentication
- bcrypt cost 12 (`src/lib/auth.ts:12`).
- Session token = 32 random bytes; stored as SHA-256 hex (`hashSessionToken`); raw only in httpOnly cookie. Evidence: `src/lib/auth.ts:16-20`, `:26-37`.
- `validateSession` checks expiry + `status === 'ACTIVE'` (suspended loses access). Evidence: `src/lib/auth.ts:39-56`.
- Login uniform errors + dummy-hash timing equalization (per prior audit; verify in route). Rate limits per-email + per-IP via `RateLimitBucket`.
- `JWT_SECRET` read at module load with hard throw if missing (`src/lib/auth.ts:7-10`) — current code does NOT have the dev fallback claimed in older audit. **Verified current code differs from PRODUCTION_READINESS_AUDIT claim #6.** (Informational: claim stale.)
- Password policy 8–128 + common-passwords (per Sprint A).
- `mustChangePassword` redirect allowlist (per Sprint A).

## Authorization
- `isAdmin` flag on User; `requireAdminApi()` on 100% of admin routes (per prior audit).
- Admin mutations write `AdminAuditLog` (per prior audit).
- User ownership checks in actions (verify each).

## Session Handling
- 7-day fixed expiry (`SESSION_EXPIRES_IN`); `createSession` deletes prior sessions (single-session-per-user). Evidence: `src/lib/auth.ts:26-27`.
- `deleteAllSessions` available for password change.
- Cookie: httpOnly, SameSite=Lax, Secure in prod (per prior audit; verify cookie options in session-cookie.ts — not read here).

## CSRF
- `isSameOriginRequest` compares Origin to request Host (A15 fix). Evidence: `src/lib/csrf.ts`.
- Applied to only 4 routes (login/register/logout/change-password) per PRODUCTION_READINESS_AUDIT #5. **Gap: ~32 other mutating routes rely on SameSite=Lax only.**
- **SEC-CSRF-01 (High):** CSRF breadth. Safe fix: apply helper to all mutating handlers. Risk: break legitimate cross-origin clients (none expected for browser cookie auth).

## XSS
- No `v-html` (per gap analysis). JSON-LD escapes `<` (per prior audit). Content is plain text in JSON. Link allowlist in `src/lib/portfolio-schema.ts`. Verify no `dangerouslySetInnerHTML` except layout script (verified one inline script in layout.tsx:85-89 — hardcoded, no user input). 
- **SEC-XSS-01 (Low):** Inline script in layout is static; no user input. OK but CSP would need `script-src` accommodation.

## SQL Injection
- Prisma parameterized queries throughout. No raw SQL in app code (verify). Low risk.

## IDOR
- Public portfolio gating via `isPortfolioVisible` (status PUBLISHED, !adminHidden, ACTIVE‖GRACE). Evidence: `src/lib/visibility.ts`.
- Public DTO drops PII (`src/lib/public-profile.ts`).
- Admin endpoints guarded. User-owned portfolio ops use session user. Verify each mutation checks ownership — **REQUIRES code review of all `/api/me/*` and actions** (not fully enumerated here).
- **SEC-IDOR-01 (Medium):** Track endpoint accepts username from body without auth; only reads profile id + writes event. No ownership bypass (read-only aggregate). Acceptable but rate-limited in-memory.

## Rate Limiting
- DB-backed `RateLimitBucket` for login/register (5/15min per id, 20/15min per IP). Evidence: prior audit A2.
- `/track` in-memory throttle (60/min/IP) — not shared across instances; unbounded Map. Evidence: `src/app/api/portfolio/track/route.ts:9-23`.
- `username-available` unauthenticated, no rate limit (per prior audit). **SEC-RL-01 (Medium):** username enumeration + no throttle.

## API Permissions
- Admin routes 100% guarded (per prior audit). Non-admin → 403 verified (phase D).
- Cron routes verify `CRON_SECRET` → 503 if unset (phase A verified).

## Sensitive Data Exposure
- `admin/users/[id]/send-email` logs recipient email + full body (per prior audit). **SEC-PII-01 (Medium):** scrub logs.
- IP hashed never raw in analytics (per prior audit).
- Session tokens hashed at rest. Passwords bcrypt.
- Error responses use unified shape without stack in prod (per Sprint A).

## Security Headers
- `src/middleware.ts`: nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options (SAMEORIGIN for /u/*, DENY else), HSTS in prod. `vercel.json` also sets X-Frame-Options/Content-Type/Referrer. Evidence: middleware.ts:41-59.
- **No CSP** anywhere. **SEC-CSP-01 (High):** add Report-Only → enforce. Inline script in layout requires `script-src` accommodation.

## CORS
- Not explicitly configured; Next.js defaults (same-origin). CSRF helper handles browser mutations. OK.

## File Upload Security
- Cloudinary unsigned client-side preset (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`). **SEC-UPLOAD-01 (High):** anyone can upload unless preset restricted server-side. Suggested: signed uploads via server route or restrict preset (allowed types/size/folder).

## Environment Variable Handling
- `src/lib/env.ts` Zod validation, names only in errors. Evidence: env.ts. Good.
- `.env*` gitignored + `.vercelignore`. Good.
- `JWT_SECRET` hard-required (≥32) via env schema. Good.

## Dependency Vulnerabilities
- Not scanned in this audit (no `npm audit` run — could be considered verification; skipped to avoid network/changes). **REQUIRES SAFE TEST ENVIRONMENT:** run `npm audit` offline in isolated env.

## Error Message Leakage
- Unified error shape (`src/lib/errors.ts`), no stack in prod (per Sprint A). Good.

## Subscription Entitlement Enforcement
- `isPortfolioVisible` requires ACTIVE‖GRACE. Publish requires `canPublish`. Limits enforced in `updatePortfolio`/publish. Evidence: visibility.ts, subscriptions.ts. Good.

## Public Portfolio Privacy
- Public DTO drops userId/email/phone/draft. Evidence: `src/lib/public-profile.ts`. Good.
- Draft/hidden/ineligible → 404 via gate. Good.

## Attack Scenarios (defensive, not executed)
- CSRF: attacker site POSTs to `/api/me/*` using victim's cookie; currently only 4 routes protected. Mitigation: apply helper.
- Upload abuse: attacker uses public preset to store arbitrary files. Mitigation: restrict preset.
- Enumeration: attacker probes `username-available` to harvest usernames. Mitigation: rate limit + auth.
- Session fixation: `createSession` deletes prior sessions → OK.

## Summary of Security Findings
| ID | Severity | Area |
|---|---|---|
| SEC-CSRF-01 | High | CSRF breadth |
| SEC-CSP-01 | High | No CSP |
| SEC-UPLOAD-01 | High | Unsigned Cloudinary preset |
| SEC-RL-01 | Medium | username-available enumeration/rate limit |
| SEC-PII-01 | Medium | Admin PII logging |
| SEC-IDOR-01 | Medium | Track endpoint (acceptable, throttle) |
| SEC-XSS-01 | Low | Inline script (static) |
| Dependency audit | Requires safe env | Not run |
| JWT fallback claim | Informational | Stale (current code hard-throws) |
| Debug endpoints | Informational | Absent in current tree (verified) |