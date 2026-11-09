# Phase 8 — Test Report

## Automated
- `npx tsc --noEmit` — **passed**.
- Full `npx vitest run` — **171 passed, 2 failed**; both failures are pre-existing `features-v2` source-text assertions (Classic footer/About text) unrelated to Phase 8.
- Targeted Phase 1/2/6 tests — passed.

## Not measured
- Bundle sizes/route JS for Classic vs Editorial.
- LCP/INP/CLS/Lighthouse/Core Web Vitals.
- Admin preview freshness in a running app.
- R2 reference counts/lifecycle.

## Manual checklist
1. Measure Editorial vs Classic route JS and network chunks; only then decide whether to split both templates.
2. Measure CLS at desktop/mobile; add image dimensions only where shifts are observed.
3. Open admin preview after a save; verify revalidation.
4. Decide R2 retention/GC policy with backups and reference checks; never delete shared media.
5. Audit dead appearance fields with real legacy samples before removal.

## Existing failures
`features-v2.test.ts` (2 tests) asserts exact Classic source strings that already differ in the current working tree; not caused by Phase 8.
