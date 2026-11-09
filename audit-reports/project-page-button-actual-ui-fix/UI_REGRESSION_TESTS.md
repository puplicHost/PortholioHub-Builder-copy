# UI Regression Tests

The new test suite uses the **real component rendering path**:
- `renderToStaticMarkup(<ClassicTemplate .../>)`
- `renderToStaticMarkup(<EditorialMarketingTemplate .../>)`

## Scenarios covered
- Valid internal Project Page → CTA visible with correct `/u/u1/projects/case-study`.
- Valid external URL → existing external CTA unchanged.
- Explicit `linkType:'none'` + stale `linkedPageSlug` → CTA hidden in both templates.
- Deleted/unpublished internal target → CTA hidden.
- Missing/invalid/null card → safe behavior.

## Results
- Component render tests: **7/7**.
- Resolver+persistence test batch: **14/14**.
- Full suite: **188 passed, 2 pre-existing `features-v2` failures**.
- TypeScript: pass.
- ESLint changed files: 1 pre-existing error, non-blocking unrelated.

## Limits
No browser automation. No live data. Manual staging verification is still required.