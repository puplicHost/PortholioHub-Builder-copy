# Phase 1 — Test Report

**Date:** 2026-11-07 · **Status:** focused verification executed after approval

## Tests added

`__tests__/subscription-actions.test.ts` (appended):
- `rejects forged ownership fields without updating` — F-19.
- `allows an allow-listed field update` — F-19.
- `rejects Free users converting a card into a standalone page` — F-19.
- `rejects Free users editing an existing standalone page` — F-19.

Existing tests cover the surrounding behavior:
- `entitlements.test.ts` (paid/free states and DB-error propagation).
- `portfolio-save-items.test.ts` (save transaction and item handling).
- `features-v2.test.ts` (project link/extra-link rules).

No tests were added for F-09 because the fix lives in React Builder state; it requires controlled promise timing and/or component-level testing, which is not available in the current Vitest node setup. F-09 is therefore documented as a manual verification item.

F-18 has no unit test added because reproducing the hard-coded identifier in tests would violate the redaction requirement. The implementation change is source-verified and account-agnostic by construction.

## Verification executed

Approved batch:

1. `npx vitest run __tests__/subscription-actions.test.ts`
   - Result: **Passed** — Test Files 1 passed, Tests 15 passed. Duration 617ms.
2. `npx vitest run __tests__/entitlements.test.ts`
   - Result: **Passed** — Test Files 1 passed, Tests 3 passed. Duration 357ms.
3. `npx tsc --noEmit`
   - Result: **Failed** with 9 errors, all in `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`, an uncommitted file from the separate second-template work. None are in Phase 1 files.
   - Phase 1 changed files (`src/lib/actions/portfolio.ts`, `src/app/profile/builder/BuilderClient.tsx`, `__tests__/subscription-actions.test.ts`) are type-clean.
4. `npx eslint src/lib/actions/portfolio.ts src/app/profile/builder/BuilderClient.tsx __tests__/subscription-actions.test.ts`
   - Result: 1 error and 20 warnings. The error (`react-hooks/set-state-in-effect` at `BuilderClient.tsx:2192:7`) is pre-existing and unrelated to the Phase 1 edit. Warnings are pre-existing unused imports/no-img-element/exhaustive-deps warnings. No new lint errors were introduced by Phase 1.

## Scenarios not tested

- F-09 save race under throttled network (manual browser check).
- F-18 runtime migration impact for the previously exempt account (staging only).
- F-19 runtime Server Action reachability and crafted invocation (staging only).
- Full Builder save flow with new/renamed cards, conflict modal, and pending edits during save.
- TypeScript project-wide check is blocked by pre-existing Editorial template errors; Phase 1 files are clean.

## Required manual checks

1. Throttle network in the browser, edit a field, press Save, continue typing before the request completes; confirm the new value remains and the page is not incorrectly marked clean.
2. Save a newly created project card, then edit it again without leaving the form; confirm edits apply.
3. Trigger a version conflict while typing; confirm edits remain and the conflict modal still works.
4. Verify the Builder loads without the hard-coded identifier in source or runtime output.
5. On staging only, confirm crafted `updateProjectPage` calls with forged keys are rejected and no records change.

## Approval status

Verification batch completed after approval. No production data was accessed or modified.
