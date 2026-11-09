# Actual UI Fix — Implementation Report

## Objective
Make the actual project-card CTA render from the real rendering path, not a helper-only test.

## Changes made
1. **Hardened the shared resolver**
   - Accepts `Page`, `PAGE`, `PageLink`, `page_link`, `projectPage`, and `internal` link-type aliases case-insensitively.
   - Treats empty-string link types as missing so the content slug or top-level slug can still resolve.
   - Preserves explicit `none`.
   - Accepts page IDs and `/projects/slug` values in `linkedPageSlug`.
   - Resolves only the current target page's slug, not a guessed or stale slug.
2. **Hardened Builder card editor**
   - Selecting a page explicitly updates both `linkType='page'` and `linkedPageSlug=slug`.
3. **Hardened server save path**
   - `updatePortfolio` normalizes card links to the target page's canonical slug.
4. **Verified actual rendering paths**
   - Classic `renderGridCard`/`renderListCard` continue using `hasProjectLinks` + `renderProjectLinks`.
   - Editorial `projectCards` continues using the shared resolver to build `p.href`.

## Files changed
- `src/lib/project-card-links.ts`
- `src/app/profile/builder/ProjectManager.tsx`
- `src/lib/actions/portfolio.ts`
- `src/components/portfolio/templates/ClassicTemplate.tsx`
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`
- Tests:
  - `__tests__/project-card-cta.test.ts`
  - `__tests__/current-bug-fixes.test.ts`
  - `__tests__/portfolio-save-items.test.ts`
  - `__tests__/phase2-profile-read.test.ts`
  - `__tests__/phase6-visibility.test.ts`
  - `__tests__/template-entitlements.test.ts`

## Safety/compatibility
Kept explicit "none" hidden. Kept external and video behavior unchanged. Kept plan/publish restrictions. No schema, dependency, database, git, deployment, or environment changes.