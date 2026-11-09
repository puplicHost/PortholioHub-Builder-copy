# Project Page Button Forensic Fix — Test Report

## Added regression tests
`__tests__/current-bug-fixes.test.ts`
- internal page from top-level fields
- internal page from `content` mirror
- legacy page id normalization
- `/projects/slug` normalization
- external URL
- missing page
- deleted page target
- unpublished page
- temporary page id
- Free plan
- invalid external URL
- null input

`__tests__/portfolio-save-items.test.ts`
- Server persists the canonical slug when a card references a page id.

## Results
- `npx tsc --noEmit`: **passed**.
- Focused tests: **13 passed / 13**.
- Full suite: **181 passed, 2 pre-existing `features-v2` failures**.
- ESLint changed files: **1 pre-existing error, 26 warnings**; no new error from this fix.
- Build: not run.

## What was not browser-tested
- Actual JSX rendering of the CTA in both templates was exercised through isolated synthetic data and the shared resolver, but no DOM/browser render was performed because Playwright/browser automation is prohibited and no React DOM test harness is configured. The exact rendering path is covered by source-level tests of the resolver used by both templates.
