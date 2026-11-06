# Root Cause Analysis

## Phase 1 — Builder refresh loses context

### Root cause
All Builder navigation state lived only in React `useState`:
- `leftTab` defaulted to `'sections'`.
- `activePage` defaulted to `'home'`.
- `selectedSectionId` / `selectedSectionType` defaulted to `null`.

The Builder is a single route (`/profile/builder`) with no URL representation of the active tab/project-page/section. On a full browser refresh, React remounts with those defaults, so the user is dropped on the Sections/Home view even though profile data loads correctly. There was no onboarding redirect; the "initial screen" appearance was the reset state.

### Secondary factors
- No scroll restoration.
- No validation/fallback for stale IDs (because IDs were never in the URL).
- Draft restoration (`localStorage`) hydrates content but not navigation state.

## Phase 2 — Media aspect ratios

### Root cause / gap
`ProjectCardMedia` used fixed card heights (`h-[120px]`, `cq-sm:h-[200px]`, list `h-[200px]`) and `object-cover`, so users could not control proportions. Metadata (`itemCards`) had `imageFit` but no aspect fields, and the home-card content JSON had no ratio fields.

### Design decision
Introduce `imageAspect` and `videoAspect` independently, default `'auto'` (legacy behavior). The frame uses CSS `aspect-ratio` when set; images/videos use `object-contain` to avoid cropping. No schema change — values live in existing JSON content.