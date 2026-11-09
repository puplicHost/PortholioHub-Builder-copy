# Current Bug Fixes — Test Report

## Added tests
`__tests__/current-bug-fixes.test.ts`
- Preview override vs saved template (including repeated switch and null reset).
- Internal page destination from top-level fields and `content` mirror.
- Legacy page id and `/projects/slug` normalization.
- External URL destination.
- Missing/deleted/unpublished/temp/Free page destinations → no button.
- Invalid URL/null input safety.

`__tests__/current-bug-analytics.test.ts`
- Analytics no longer bootstraps a workspace.
- Totals use grouped/count queries; the only `findMany` selects `createdAt` for the daily series.

`__tests__/portfolio-save-items.test.ts`
- Server persists the canonical page slug when a card references a page id.

## Commands and results
- `npx tsc --noEmit` → **passed**.
- `npx vitest run __tests__/current-bug-fixes.test.ts __tests__/current-bug-analytics.test.ts` → **9 passed / 9**.
- `npx vitest run __tests__/portfolio-save-items.test.ts __tests__/current-bug-fixes.test.ts` → **13 passed / 13**.
- Full `npx vitest run` → **179 passed, 2 failed**.
  - Both failures are pre-existing `features-v2.test.ts` source-text assertions about Classic footer/About strings. They are unrelated to these fixes and were left untouched.
- ESLint on changed files → **1 pre-existing error / 26 warnings** on the final focused lint run (Classic visitor-theme effect). No new error from these changes.
- Build → **not run**; safe build isolation could not be established without database/external side effects.

## Verified through tests
- Internal/external/missing destination logic.
- Preview vs saved template resolution.
- Analytics query-path shape / no workspace bootstrap.

## Requires manual verification
- Actual Builder preview switching and Apply immediately after save.
- Card “View Project” click-through in Classic and Editorial, published and draft.
- Detail-page visual match (Editorial vs Classic) and RTL.
- Analytics wall-clock timing, query plans, and index behavior.
- WhatsApp icon rendering in both templates.

## Existing vs new failures
Only the two pre-existing `features-v2` failures remain. No new test failure was introduced.
