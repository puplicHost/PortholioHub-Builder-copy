# Final Correction — Implementation Report

## Files changed
- `src/lib/project-card-links.ts`
  - Preserves explicit `'none'` semantics.
  - Allows legacy slug-only cards only when no explicit `linkType` exists.
  - Unknown explicit link types no longer silently become internal links.
- `__tests__/project-card-cta.test.ts`
  - Real-component render regression test for Classic and Editorial home card CTA.
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`
  - Internal page CTA label is now `View Project` to match the intended UI.
  - Unused `viewCaseStudy` string remains but is not used.

## Exact implementation
The resolver now determines `effectiveType` in this order:
- page aliases (`page`, `projectPage`, `page_link`) → `page`
- `external` → `external`
- absent/null/undefined `linkType` and valid `linkedPageSlug` → legacy `page`
- anything else (including `none` and unknown values) → `none`

The CTA render tests import the real `ClassicTemplate` and `EditorialMarketingTemplate`, render them with synthetic profile fixtures, and assert:
- `View Project` is visible and `/u/u1/projects/case-study` exists.
- External link remains correct.
- Explicit `none` with stale slug does **not** render the CTA.
- Deleted target does not render the CTA.

## Compatibility
- Valid internal and external cards continue to work.
- Existing saved cards are not mutated.
- External-link rendering is unchanged.
- Free/Pro target restrictions remain enforced by the shared resolver.
- No Git, database, migration, deployment, dependency, or environment changes.