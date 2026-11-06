# Implementation Report

## Phase 1 — Builder state restoration
### Files
- `src/app/profile/builder/BuilderClient.tsx`

### Implementation
- Added `useSearchParams`.
- On mount, restore:
  - `?page=<projectPageId>` → select that page (validated against loaded `projectPages`).
  - `?section=<sectionId>` → select that section (validated; skipped for locked sections on Free).
  - `?tab=pages` → Pages tab.
  - Scroll position from `sessionStorage` (`builder-scroll:<profileId>`), restored via `requestAnimationFrame` + `window.scrollTo`.
- URL is kept in sync with tab/page/section using `window.history.replaceState` (no navigation, no server round-trip).
- Scroll position saved on a throttled scroll listener.
- Invalid/deleted IDs fall back to the default Builder view; no redirect loops.
- Auth remains server-side (`requireUser` in the page); expired sessions still follow the normal login flow.

### Decisions
- URL-first (shareable/refresh-safe), `sessionStorage` only for scroll (non-sensitive, per-tab).
- No new dependencies, no database changes.

## Phase 2 — Aspect ratios
### Files
- `src/lib/project-card-visuals.ts` — `ProjectMediaAspect`, `PROJECT_MEDIA_ASPECTS`, `normalizeProjectMediaAspect`, `aspectRatioValue`; meta fields `imageAspect`/`videoAspect` with sanitizer support.
- `src/components/portfolio/ProjectCard.tsx` — `ProjectCardMedia` accepts `aspect`; applies CSS `aspect-ratio` and `object-contain`; `auto` preserves legacy fixed-height behavior.
- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` — passes image/video aspect from item meta.
- `src/components/portfolio/templates/ClassicTemplate.tsx` — passes home-card aspect from content JSON.
- `src/app/profile/builder/BuilderClient.tsx` — image and video aspect selectors in project item editor.
- `src/app/profile/builder/ProjectManager.tsx` — image and video aspect selectors in card editor.
- `src/app/profile/builder/i18n/dictionaries.ts` — Arabic/English labels for all six ratios.

### Decisions
- `'auto'` default preserves existing customer cards exactly.
- Image and video ratios stored independently (`imageAspect`, `videoAspect`).
- No schema migration: values live in existing `itemCards`/`content` JSON.
- Videos keep poster-first, click-to-play, inline playback; the ratio applies to both poster and playback frame.
- Images remain on Cloudinary; videos remain on R2; 50 MB limit unchanged.