# Remediation Roadmap — PortfolioHub Builder

Organized into 6 phases. Each fix includes expected benefit, complexity, risk, dependencies, testing requirements, migration/deployment/data impact. **No fixes implemented in this audit.**

## Phase 1 — Critical Safety & Security
1. **Real transactional email (Resend)** — REL-01/UX-AUTH-01/UX-SUB-01. Benefit: verification/resend + lifecycle reminders actually deliver. Complexity: Medium. Risk: Medium (template/content). Deps: Resend account, env var. Testing: end-to-end email delivery in safe env. Migration: none. Deployment: yes. Data: none.
2. **CSRF breadth** — SEC-CSRF-01. Benefit: close cross-site mutation gap. Complexity: Low. Risk: Low (may break non-browser clients; none expected). Testing: cross-origin POST tests. Migration: none. Deployment: yes.
3. **CSP (Report-Only → enforce)** — SEC-CSP-01. Benefit: script-injection defense. Complexity: Medium. Risk: Medium (could break Cloudinary/fonts/inline script). Testing: Report-Only soak. Migration: none. Deployment: yes.
4. **Remove JWT_SECRET fallback (hard-fail)** — current code already hard-throws; verify no fallback remains. Complexity: Low. Risk: Low. Testing: boot with missing secret. Migration: none.
5. **Durable `/track` throttle** — REL-02/SEC. Benefit: shared across instances. Complexity: Medium. Risk: Low. Testing: multi-instance simulation. Migration: possibly (reuse RateLimitBucket or new table). Deployment: yes.
6. **Restrict Cloudinary unsigned preset** — SEC-UPLOAD-01. Benefit: prevent abuse. Complexity: Low (config) / Medium (signed uploads). Risk: Medium (upload flow). Testing: upload regression. Migration: none. Deployment: yes.
7. **Rate-limit `username-available`** — SEC-RL-01. Complexity: Low. Risk: Low.
8. **Scrub PII from admin send-email logs** — SEC-PII-01. Complexity: Low. Risk: Low.
9. **Error monitoring (Sentry) + CI** — REL-MON-01/OPS-01. Benefit: visibility. Complexity: Medium. Risk: Low. Testing: trigger test error. Migration: none. Deployment: yes. Data: none.

## Phase 2 — Performance Bottlenecks
1. Cut builder round trips (collapse ensure-blocks, single re-fetch) — PERF-BE-01. Complexity: Medium. Risk: Medium (save flow). Testing: builder load/save + conflict spec. Migration: none.
2. De-fan analytics (1-2 groupBy instead of 11 COUNTs) — PERF-BE-02/PERF-DB-01. Complexity: Medium. Risk: Low. Testing: analytics numbers identical.
3. `/u` single fetch + select columns — PERF-BE-03. Complexity: Low. Risk: Low.
4. Public page caching (ISR/Data Cache) — PERF-CACHE-01. Complexity: Medium-High. Risk: Medium (freshness/visibility). Testing: stale-while-revalidate + invalidation on publish. Migration: none. **Must respect subscription visibility/admin hiding.**
5. `next/image` migration in templates — PERF-IMG-01/PERF-FE-03. Complexity: Medium. Risk: Medium (layout shifts). Testing: visual regression. Migration: none.
6. Diff-based save writes — PERF-BE-04. Complexity: Medium. Risk: Medium. Testing: save + conflict.
7. Cache platform name (already done via unstable_cache) — verify only.
8. Finish experience reorder WIP + tests — UX-BLD-05. Complexity: Medium. Risk: Low.

## Phase 3 — Core UX & Usability
1. Real email delivery (Phase 1) enables verification flow — UX-AUTH-01.
2. Mobile builder usability (drawer/bottom-sheet) — UX-BLD-01. Complexity: Medium. Risk: Medium (visual freeze). Testing: viewport matrix.
3. Admin search indexing — UX-ADM-01. Complexity: Low-Medium. Risk: Low. Migration: possibly (index or trigram).
4. Public portfolio long-text/layout hardening — UX-PUB-01/02. Complexity: Medium. Risk: Medium (visual). Testing: visual.
5. Touch targets ≥44px — UX-TOUCH-01/A11Y-TOUCH-01. Complexity: Low. Risk: Low.
6. Conflict modal discoverability/focus management — UX-BLD-02/A11Y-MOD-01. Complexity: Low. Risk: Low.
7. Terms/privacy content + linking — UX-LAND-01. Complexity: Low (content). Risk: Low.

## Phase 4 — Reliability & Scalability
1. Structured logging + telemetry (autosave/uploads/cron) — REL-LOG-01/REL-OBS-01. Complexity: Medium. Risk: Low.
2. Cron failure alerting. Complexity: Low-Medium. Risk: Low.
3. Durable storage for uploads + Cloudinary orphan cleanup — REL-STOR-01/DB-DEL-01. Complexity: Medium. Risk: Medium. Migration: possibly.
4. Transaction wrapping for save path — DB-TX-01. Complexity: Medium. Risk: Medium. Testing: failure injection (safe env only).
5. Full endpoint ownership audit — DB-API-01. Complexity: Medium. Risk: Low. Testing: IDOR tests.
6. Rate-limit contention mitigation — PERF-DB-02. Complexity: Medium. Risk: Medium.

## Phase 5 — Code Quality & Maintainability
1. Refactor large components only where touched — CQ-LARGE-01. Complexity: High. Risk: High. (Avoid big-bang refactor.)
2. Reduce lint errors/warnings — CQ-LINT-01. Complexity: Medium. Risk: Low.
3. Tighten `any` types — CQ-TS-01. Complexity: Medium. Risk: Low.
4. Remove dead code (`upload.ts`) — CQ-DEAD-01. Complexity: Low. Risk: Low.
5. Dependency audit (`npm audit`, depcheck) in safe env — CQ-DEP-01. Complexity: Low. Risk: Low (network).
6. Add tests for critical flows — CQ-TEST-01. Complexity: High. Risk: Low. Testing: new tests in safe env only.

## Phase 6 — Optional Enhancements
1. Second premium template + Powered-by badge (needs product/pricing input).
2. CV import/export (Phase 12).
3. Landing CMS (Phase 13).
4. FCM live push (needs Firebase human items).
5. Full E2E matrix + load test + capacity plan (safe env only).
6. Sitemap index for >500.
7. Enrich Person JSON-LD.
8. PWA icons, dev pages, styleguide.

## Cross-Cutting Notes
- Every performance change must be measured before/after in a safe environment; do not claim improvements without evidence.
- Caching changes must respect subscription visibility and admin hiding (do not leak draft/hidden portfolios).
- Visual freeze: preserve existing look; new UI reuses tokens.
- `.env` freeze: new names to `.env.example` only.
- No destructive DB operations; migrations require approval and staging verification.<|end|><|start|><|start|>write to=assistant<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/My SaaS/PortholioHub-Builder-copy/audit-reports/comprehensive-production-audit/10_REMEDIATION_ROADMAP.md