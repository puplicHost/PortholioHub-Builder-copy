# Phase 3 — Implementation Report

## Objective
Restore missing Builder workflows, page navigation, slug propagation, page publication control, undo/redo, and preview-safe links.

## Findings
F-06, F-10, F-11, F-12, F-34, F-46.

## Implementation
- **F-06:** Added `addBaseSection()` and visible Contact / Gallery / Files creation buttons in the Builder sidebar. They use existing schemas/editors, respect Free locks and the 30-section cap, insert before footer, and select the new section.
- **F-10:** Implemented bounded local Undo/Redo history for `updateProfile` edits. Buttons call `handleUndo`/`handleRedo`; network responses and conflict reloads are not history steps.
- **F-11:** `updateProjectPageField('slug', …)` now rewrites all surviving cards' `linkedPageSlug` and `page_link` item slugs in client state; the normal save persists the cleanup.
- **F-12:** Added a **View Page** action to the Pages list (published/Pro/real-slug only) and to the linked-card editor. Desktop View Live is disabled for drafts, and unlinked cards no longer fall back to an unreferenced slug.
- **F-34:** Added a **Publish page** checkbox to the project-page editor; `isPublished` now persists through the normal save.
- **F-46:** Project links and extra links are intercepted in Builder preview mode in both Classic and Editorial; preview clicks no longer navigate away.

## Files changed
`BuilderClient.tsx`, `ProjectManager.tsx`, `ClassicTemplate.tsx`, `EditorialMarketingTemplate.tsx`, `i18n/dictionaries.ts`.

## Customer impact
Users can add the missing sections; links survive slug edits; View Page becomes discoverable; pages can be unpublished; preview remains inside the Builder.

## Status
F-06, F-10, F-11, F-12, F-34, F-46: **implemented**. F-10 is a basic local history (not a full document revision system). Manual staging verification remains.

## Risks
- Undo history is memory-only and capped at 50 states.
- Slug propagation is client-side + normal-save; concurrent edits rely on optimistic concurrency.
- Publish/unpublish uses the same save transaction; publishing a page while the portfolio is draft does not make it public.
