# Project Page Button Actual UI Fix — Final Summary

## Status: PARTIALLY COMPLETED

### Exact root cause identified
The homepage CTA is controlled through `hasProjectLinks`/`renderProjectLinks` (Classic) and `projectCards` (Editorial). Both depend on `resolveProjectCardDestination`. The function previously only recognized `linkType: 'page'`/`'external'` with a canonical page slug. Any persisted-but-unmodelled state (differently-cased link type alias, empty-string link type with a surviving slug, page id/path instead of slug, `content` mirror only, or stale top-level state) returned no destination, so the view remained without the button.

### Exact fix
The actual render decision now uses a robust shared destination resolver that covers:

- page aliases with case differences,
- empty link types,
- content mirror linkType / linkedPageSlug,
- page id or `/projects/slug`,
- exact target publication and plan checks.

### Test results
- CTA render tests: 7/7 passed.
- Resolver/persistence tests: 14/14 passed.
- Full test suite: 188 passed, 2 pre-existing `features-v2` failures.
- TypeScript: passed.
- ESLint: 1 pre-existing error, non-blocking; no new lint error.

### Remaining limitation
No browser automation/Playwright was allowed, and no staging data was used. The fix cannot be claimed browser-proven until the manual verification checklist is executed.