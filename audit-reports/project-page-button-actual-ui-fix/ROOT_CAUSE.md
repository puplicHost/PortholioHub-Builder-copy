# Project Page Button Actual UI Fix — Root cause

The missing button is not caused by the old external-link condition; it is caused by the **shared destination resolver returning no destination** in some valid-but-unmodelled persisted shapes.

## Exact failing condition
`hasProjectLinks()` and `renderProjectLinks()` both rely on `resolveProjectCardDestination()`. It returned `null` for valid internal pages when the stored link layer did not contain exactly:
- `linkType: 'page'`
- `linkedPageSlug: {canonicalSlug}`

## Similar data shapes that caused the failure
The current source can now handle any of these persisted variants:
- `linkType` with casing differences (`Page`, `PAGE`, `PageLink`)
- `projectPage`/`page_link` aliases
- empty-string link types with a surviving page slug
- `content.linkType` and/or `content.linkedPageSlug` mirror fields
- page IDs, canonical slugs, and `/projects/slug` values

## Relevant files
- `src/lib/project-card-links.ts` — `resolveProjectCardDestination`
- `src/app/profile/builder/ProjectManager.tsx` — card editor
- `src/lib/actions/portfolio.ts` — normalization/persistence
- `src/components/portfolio/templates/ClassicTemplate.tsx` — `hasProjectLinks`/`renderProjectLinks`
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx` — actual CTA path

## What remains unverified
- Real staging data and a real browser click-through.
- Exact target page's `isPublished`, plan, and actual saved slug in a staging record without DB access.