# Project Page Button Fix — Test Report

## Regression tests added
`__tests__/current-bug-fixes.test.ts`
- Valid internal page from top-level fields → visible destination.
- Valid internal page from `content` mirror → visible destination.
- Legacy page id → canonical slug route.
- `/projects/slug` value → canonical slug route.
- External URL → unchanged destination.
- Missing/deleted page → no CTA.
- Unpublished page → no CTA.
- Temporary page id/slug → no CTA.
- Free plan → no internal-page CTA.
- Multiple independent cards? Covered by per-input destination assertions and id normalization; no shared mutable state in resolver.
- Invalid `javascript:` external URL → no CTA.

`__tests__/portfolio-save-items.test.ts`
- Server persists the canonical slug when a card references a page id.

## Commands and results
- `npx tsc --noEmit` → **passed**.
- `npx vitest run __tests__/current-bug-fixes.test.ts __tests__/portfolio-save-items.test.ts` → **13 passed / 13**.
- Full suite → **181 passed, 2 failed**.
  - The 2 failures are pre-existing `features-v2` source-text assertions about Classic footer/About strings; they are unrelated to this fix and were not changed.
- ESLint on changed files → **1 pre-existing error / 26 warnings** (Classic visitor-theme effect). No new error introduced by this fix.
- Build → not run (safe isolation not established).

## Verified coverage vs limitation
- Destination resolution and server persistence are unit-tested.
- The templates both call `resolveProjectCardDestination`; JSX rendering itself has no DOM test harness, so a final visual click-through is a manual staging step.
- No database or browser automation was used.
