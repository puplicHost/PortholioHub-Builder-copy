# Sprint F4 verification — autosave + conflict handling

## Done
- Autosave: 2 s debounce after last change (existing dirty tracking), single-flight, skipped while conflict modal open.
- Backoff: failed autosaves retry at 5 s → 60 s cap; success resets.
- `beforeunload` guard while dirty.
- Conflict modal (Reload latest / Overwrite with mine) wired to the pre-existing `conflict:true` server path.
- Creation-race fix in `getOrCreateProfile` (P2002 → re-fetch-or-retry): two tabs opened at once no longer 500.

## Verified
- `tsc` 0 source errors; `eslint` 28 errors / 54 warnings (0 new errors; +1 `no-img` warning in new GalleryEditor, same accepted pattern as the rest of the codebase).
- Playwright `e2e/conflict.spec.ts` PASSES live (kept as regression test): register → tab B edits → autosave persists without clicking Save → tab A stale save → modal appears → Reload closes it.
- Seed builder still 200.

## Unexpected
- The conflict spec itself exposed the creation race (two tabs → P2002 500 on second load). Fixed as above; spec now covers it implicitly.
- Modal markup is client-state-only (absent from SSR HTML by design); proven present via the passing spec, not curl.

## Freeze check
- Existing sections/editors untouched; modal + effects are additive. No visual change to any existing screen (modal appears only on real conflicts).
