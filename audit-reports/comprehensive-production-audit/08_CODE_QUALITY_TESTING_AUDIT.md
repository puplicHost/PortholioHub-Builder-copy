# Code Quality & Testing Audit — PortfolioHub Builder

## Large Components
- `BuilderClient.tsx` 4,821 lines (`'use client'`).
- `ClassicTemplate.tsx` 2,571 lines (`'use client'`).
- `src/lib/actions/portfolio.ts` 1,434 lines.
- `prisma/schema.prisma` 1,049 lines.
Per AGENT-RULES 300-line purity not enforced (recorded deviation). **CQ-LARGE-01 (Medium):** refactor only where touched.

## Duplicate Code
- Experience reordering logic being duplicated across Projects/Experience (in-progress ReorderButtons extraction). Good direction.
- Auth guard logic in multiple places (`isAdminUser` checks both Profile and User). **CQ-DUP-01 (Low).**

## TypeScript Quality
- `any` usage 32+ (per prior audit E2) in `src/lib/portfolio.ts`, `_legacy-backend-reference`, project pages. **CQ-TS-01 (Low-Medium):** tighten types.
- `tsc --noEmit` exit 0 (per phase verifications). Good.

## Error Handling Consistency
- Unified `AppError` shape. Silent catches in places. **CQ-ERR-01 (Low-Medium).**

## Naming Conventions
- Mixed: `ph-gold` historical name for blue primary. **CQ-NAME-01 (Low):** cosmetic only; do not rename without justification.

## Component Boundaries / Separation of Concerns
- Server Actions in `src/lib/actions/*`; Route Handlers in `src/app/api/*`; UI in components. Reasonable layering. Large monoliths blur boundaries.

## Dead Code
- `src/lib/upload.ts` documented "VERCEL INCOMPATIBLE", not imported. **CQ-DEAD-01 (Low):** remove.
- `_legacy-backend-reference/` read-only reference (keep).
- `useAutosave` wired in Sprint F (verify no dead remains).

## Unused Dependencies
- `package.json` includes Firebase, Supabase client, dnd-kit, etc. Some may be unused in portfolio surface (e.g., FullCalendar/Tiptap not present in deps actually; deps list is trimmed). Gap analysis recommends trimming. **CQ-DEP-01 (Low):** audit deps with `depcheck` in safe env.

## Dependency Health
- All versions current-ish (Next 16.2.12, React 19.2.4, Prisma 5.22). Node 24.x. Good.

## Circular Imports
- Not detected in static review. **REQUIRES tooling** (madge) in safe env.

## Lint Violations
- Baseline 28 errors / 53–54 warnings (per phase verifications). Errors: `no-explicit-any` ×32, `set-state-in-effect` ×3, `prefer-const` ×1, `no-unescaped-entities` ×1. Warnings: unused-vars ×28, no-img-element ×24 (now 31 raw img). **CQ-LINT-01 (Medium):** reduce warnings; fix errors.

## Build Warnings
- `next build` exit 0. No warnings captured here. **REQUIRES safe build run.**

## Testing Coverage
**Existing tests:**
- Vitest: 8 suites (`__tests__/`) — clients-section, features-v2, username, manifest, password, phone, utils, portfolio-schema, portfolio-save-items. (Phase H: 5 files/18 tests pass; counts grown.)
- Playwright: `smoke.spec.ts` (register→builder→gated /u 404), `conflict.spec.ts` (autosave conflict regression).

**Covered flows:** username/phone/password validation, manifest route declaration, portfolio schema/save items, smoke registration, conflict handling.

**Missing coverage (critical):**
- Subscription lifecycle (approve/reject/grant/extend/suspend).
- Admin permissions/authorization boundaries.
- Public visibility gating (partially via smoke).
- Publish/unpublish preconditions.
- Optimistic concurrency (version mismatch) — conflict spec covers autosave conflict.
- Mobile layouts (no viewport tests).
- Arabic/English behavior (no i18n tests).
- Payment consistency.
- Notification dedupe.
- Analytics dedup.
- Rate limiting.
- CSRF.
- Cron idempotency.

**CQ-TEST-01 (High):** Add tests for subscription + admin + visibility + concurrency. Describe but do not create (audit-only).

## Technical Debt Summary
Large monoliths, lint baseline, `any` usage, dead code, no CI, no monitoring, in-memory throttle, raw images, no caching on hot pages. Consolidated in master register.<|end|><|start|><|start|>write to=assistant<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/My SaaS/PortholioHub-Builder-copy/audit-reports/comprehensive-production-audit/08_CODE_QUALITY_TESTING_AUDIT.md