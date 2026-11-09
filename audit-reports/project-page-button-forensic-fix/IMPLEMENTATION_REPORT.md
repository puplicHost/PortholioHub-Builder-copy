# Project Page Button Forensic Fix — Implementation Report

## Changes
- `src/lib/project-card-links.ts`
  - Added normalization for page ids, `/projects/slug` paths and canonical slugs.
  - Added target lookup by `id` or `slug`; preserved `isPublished` and Free-plan restrictions.
- `src/app/profile/builder/ProjectManager.tsx`
  - Selecting a page now explicitly sets `linkType='page'` and `linkedPageSlug=slug`.
- `src/lib/actions/portfolio.ts`
  - Normalizes `linkedPageSlug` from an id/path to the target page's canonical slug before persistence.
- `ClassicTemplate.tsx` and `EditorialMarketingTemplate.tsx`
  - Both use the shared resolver and render the CTA only when it resolves to a page or external destination.
- Tests:
  - `__tests__/current-bug-fixes.test.ts`
  - `__tests__/portfolio-save-items.test.ts`

## How the path now agrees
1. Editor selection sets both `linkType` and `linkedPageSlug`.
2. Save normalizes the page reference to the canonical slug.
3. Reload hydration reconstructs top-level fields from `content`.
4. Both templates use the same shared resolver.
5. The resolver returns a valid internal route only for an existing, published, non-temporary target accessible under the current plan.
6. The renderer displays the CTA only for a non-null destination.

External links, video, attachments, Free/Pro rules, and unrelated project-card behavior are unchanged.