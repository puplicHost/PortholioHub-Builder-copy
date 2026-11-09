# Project Page Button Final Correction — Root Cause and Review

## Key unresolved behavior
The earlier fix treated **any present `linkedPageSlug`** as an internal page link, even when the saved `linkType` was explicitly `'none'`. That was an overreach: a customer who intentionally selects **No link** must not have an old slug resurrect the CTA.

A second gap was test coverage. Previous tests validated the resolver and persistence, but did not assert the actual Classic/Editorial card rendering condition.

## Corrected resolver semantics
- `linkType = 'page'`, `'projectPage'`, or `'page_link'`: internal Project Page.
- `linkType = 'external'`: external URL.
- `linkType` absent/null and `linkedPageSlug` present: legacy fallback to internal page.
- `linkType = 'none'`: no link, even if `linkedPageSlug` still contains a stale value.
- Unknown explicit `linkType` values: no fallback; do not silently become internal links.

## Actual CTA rendering condition tested
Both `ClassicTemplate` and `EditorialMarketingTemplate` render the homepage project-card CTA only after `resolveProjectCardDestination()` returns a valid `kind='page'` or `kind='external'` destination. The new regression test renders those templates directly and asserts visibility and destination. It now verifies the actual component path rather than only the resolver.

## Editorial label alignment
Editorial previously rendered `View case study` for internal pages. It now uses `View Project`, consistent with the user requirement and Classic template.

## Builder preview state inspection
`ProjectManager` card edits update parent profile state immediately. `updateEditingCard()` targets the current card id, including alias resolution after a save. The preview receives a derived profile from the same state. No new preview defect was observed, and no speculative preview-layer change was needed.