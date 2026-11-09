# Root Cause — View Project Button Still Missing

## Exact failing condition
The button was hidden whenever `resolveProjectCardDestination()` returned `null`.

The previous resolver required a canonical slug and a `linkType` of exactly `'page'`. In the actual persisted/hydrated data, a valid relationship could be represented as:

- `linkType='page'` with `linkedPageSlug` (or `content.linkedPageSlug`) stored as a page **id** instead of a slug;
- a stored `/projects/slug` path instead of a bare slug;
- a card whose `linkType` has become stale or missing while `linkedPageSlug` still identifies a valid page;
- a stale React state update after save.

In any of those cases, the resolver returned `null`, so both `hasProjectLinks` and the CTA conditional emitted no `View Project` button even though the card had a valid internal page relationship.

## File and function/component responsible
- `src/lib/project-card-links.ts` — `resolveProjectCardDestination()`
- `src/app/profile/builder/ProjectManager.tsx` — card editor `linkType`/`linkedPageSlug` updates
- `src/lib/actions/portfolio.ts` — `updatePortfolio` project normalization

## Why the previous fix did not solve the real problem
The previous fix introduced the shared resolver, but its contract was still too strict: it accepted only a bare canonical slug and only a `linkType` of exactly `'page'`. It did not normalize persisted page IDs or `/projects/slug` values, and it did not treat a surviving `linkedPageSlug` as an internal-page link when `linkType` was stale. The actual rendering path therefore still returned no destination for valid relationships.

## Evidence from the actual data flow
- Builder stores the selected page slug in `linkedPageSlug`.
- On save, `updatePortfolio` now normalizes that value using the profile's `id`/`slug` mapping before writing `content.linkedPageSlug`.
- On reload, `getOrCreateProfile` hydrates `linkType`/`linkedPageSlug` from `content`.
- Both templates now call `resolveProjectCardDestination(project, { username, isFree, pages: profile.projectPages })`.
- If the stored value is an id, `/projects/slug`, or a bare slug, the resolver now maps it to the target page's canonical slug and returns the internal route.
- If the target is missing, unpublished, temporary, or Free-restricted, it returns `null`, so no broken CTA is rendered.

## Console errors
- `/api/me/storage` 503: unrelated; it only affects storage accounting/UI.
- Deferred DOM node warning: unrelated React/devtool lifecycle warning.
- Resource preload warnings: unrelated performance/preload messages.