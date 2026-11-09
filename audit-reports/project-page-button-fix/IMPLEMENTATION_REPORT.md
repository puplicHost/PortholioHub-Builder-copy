# Project Page Button Fix — Implementation Report

## Exact root cause
The card destination path was slug-only and split across two rendering implementations:

1. The card editor stored/left the destination as `linkedPageSlug`, but a persisted card could carry a page id (legacy/imported data) or a `/projects/slug` value. The shared resolver required a canonical slug that exactly matched a page row, so it returned no destination and the renderer emitted no CTA.
2. Selecting a page did not explicitly reassert `linkType='page'` at the same time as setting the slug, so a card with a stale `linkType` could remain unresolved.
3. The server persisted the raw value without normalizing an id/path to the page slug.

External links were unaffected because they followed a separate `externalLink` code path.

## Code path
`ProjectManager` card editor → `updateEditingCard('linkedPageSlug')` / `linkType` → Builder state → `updatePortfolio` (`projects[].linkType/linkedPageSlug` → `ProjectPage.content`) → `getOrCreateProfile` hydration → `resolveProjectCardDestination()` → `ClassicTemplate` / `EditorialMarketingTemplate` card CTA → `/u/{username}/projects/{slug}`.

## Files changed
- `src/lib/project-card-links.ts` — shared resolver; accepts canonical slug, page id, and `/projects/slug`; validates target publication and `isFree`.
- `src/app/profile/builder/ProjectManager.tsx` — selecting a page asserts `linkType='page'` with the slug.
- `src/lib/actions/portfolio.ts` — normalizes a page id/path to the canonical slug before persisting.
- `src/components/portfolio/templates/ClassicTemplate.tsx` — uses the shared resolver for the card CTA.
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx` — uses the shared resolver for the card CTA.
- Tests: `__tests__/current-bug-fixes.test.ts`, `__tests__/portfolio-save-items.test.ts`.

## Why this fixes it
Both templates now resolve the same destination from either storage shape and both generate the correct internal route. The target must still exist, be published and be Pro-accessible, so dead/private links are not shown. External links retain their previous behavior. The server persists the canonical slug, so save/reload keeps the relationship.

## Safety/compatibility
- No schema, migration, database, dependency or environment change.
- No project content or appearance values rewritten.
- Free/Pro page-link restrictions preserved.
- Video, attachments and external links untouched.
- This mission changed only the card destination path and its tests.
