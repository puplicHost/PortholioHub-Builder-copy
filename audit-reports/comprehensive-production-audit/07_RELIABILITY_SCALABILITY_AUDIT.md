# Reliability & Scalability Audit — PortfolioHub Builder

## Reliability

**Error boundaries:** root `error.tsx`, `not-found.tsx`, `ErrorBoundary` component. Good.
**Loading boundaries:** `loading.tsx`. Suspense usage not fully audited.
**Server errors:** unified error shape (`src/lib/errors.ts`). Good.
**DB connection failures:** `/api/health` returns 503. Good.
**External service failures:** Cloudinary/Firebase failures — verify handling (not fully audited). **REL-EXT-01 (Medium):** upload failures should surface to user; verify.
**Auth expiration:** validateSession deletes expired session; client redirect? Verify.
**Autosave failure recovery:** backoff 5s→60s cap + beforeunload guard + conflict modal. Phase F4 verified. Good.
**Retry behavior:** backoff present for autosave. Other mutations: verify retry/idempotency.
**Transaction failures:** `$transaction` on critical flows; save path atomicity unverified (see DB audit).
**Cron safety:** Cron routes verify CRON_SECRET; lifecycle idempotent via dedupeKey; cleanup graceful for pre-migration tables (P2021/P2002). Good.
**Idempotency:** Notification dedupeKey, VisitDedup key, request code unique, subscription requestId unique. Good.
**Logging:** `console.error` only; no structured logging. **REL-LOG-01 (Medium):** add structured logs for production diagnosis.
**Monitoring:** No Sentry/observability. **REL-MON-01 (High):** add error tracking.
**Observability gaps:** Cannot see failed autosaves, failed uploads, cron failures, slow queries, Web Vitals. **REL-OBS-01 (High).**

## Silent failures
- `lastLoginAt` update, session delete use `.catch(() => {})` (per prior audit). **REL-SILENT-01 (Low-Medium):** log or handle.

## Scalability (hypothetical, no load test)
- **100 users:** fine; current architecture OK.
- **1,000 users:** analytics polling + uncached public pages begin to matter; admin search OK.
- **10,000 users:** uncached public pages → linear DB read growth; notification polling 30s × users; rate-limit hot-row contention; analytics 11 COUNTs per dashboard load. Bottlenecks: DB RTT, pooler, serverless function limits.
- **50,000–100,000 users:** likely need caching (ISR/Data Cache), image optimization/CDN, connection pooling tuning, async analytics, job queue. Do not claim precise capacity without load-test evidence.

## Serverless limits
- Vercel function execution limits; cold starts; Supabase connection limits. Mitigation: pooling already used. Monitor.

## Storage growth
- PortfolioViewEvent raw rows grow per event; DailyVisit aggregates; VisitDedup cleaned >2d. Media on Cloudinary (ephemeral local disk on Vercel). **REL-STOR-01 (Medium):** migrate uploads to durable storage; define retention.

## Cron workload
- 2 daily crons (cleanup 03:00, lifecycle 04:00). Hobby cadence. OK at current scale; verify execution time.

## Recommendations
1. Add error tracking (Sentry) + structured logging.
2. Add CI to run tests on every change.
3. Add Web Vitals reporting.
4. Add cron failure alerting.
5. Implement autosave failure telemetry.
6. Plan caching + image optimization before 10k users.