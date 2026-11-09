# CTA Rendering Test Report

## Regression test added
`__tests__/project-card-cta.test.ts`

It renders the actual Classic and Editorial homepage project-card templates and asserts both CTA visibility and destination.

## Scenarios covered
- Valid internal Project Page → CTA visible with `/u/u1/projects/case-study`.
- Valid external URL → CTA visible with `https://example.com/external`.
- Explicit `none` with stale `linkedPageSlug` → CTA hidden in Classic and Editorial.
- Deleted internal target → CTA hidden in Classic and Editorial.

## Results
- `npx vitest run __tests__/project-card-cta.test.ts`
  - **7 passed / 7**
- `npx vitest run __tests__/project-card-cta.test.ts __tests__/current-bug-fixes.test.ts __tests__/portfolio-save-items.test.ts`
  - **20 passed / 20**
- TypeScript: **passed**
- ESLint changed files: 1 pre-existing error in `src/lib/actions/portfolio.ts`; **no new error** from this correction.

## Existing vs new failures
- Full suite: 188 passed, 2 failed.
- Both failures are pre-existing `features-v2` source-text assertions unrelated to project card CTAs. They are not caused by this change.
- No browser-level rendering was performed; the test uses `renderToStaticMarkup` against the real components. Manual staging browser verification is still required.

## Editorial label alignment
Editorial's internal-page CTA label was corrected from `View case study` to `View Project` to match the requested user-facing behavior.