# Phase 7 — Implementation Report

## Findings
F-27, F-31, F-32, F-38, plus audit-derived accessibility items.

## Implementation
- **F-27:** Active badge now reflects the **saved** template, not the preview; a persistent Builder banner/indicator appears while a preview override is active, with an explicit exit. Picker copy now states that Apply also saves any pending Builder changes. No silent preview persistence.
- **F-31:** `Appearance.template` updated to `TemplateId`; stale Classic union removed.
- **F-32:** New-profile seed uses `theme: 'minimal'` and `font: 'Cairo'`, matching the UI vocabulary; existing saved values are untouched.
- **F-38:** Footer editor now prefers `contactLinks` only when non-empty, otherwise `footer.links`; legacy footer-only links remain visible and editable.
- **Accessibility:** Editorial drawer closes on Escape; repeated project links include the project title in `aria-label`; focus-visible styles added for Editorial text links/contact/footer.
- **Known limitation:** numeric contrast and full screen-reader checks require manual tooling.

## Files changed
`BuilderClient.tsx`, `ProjectManager.tsx`, `EditorialMarketingTemplate.tsx`, `editorial.module.css`, `i18n/dictionaries.ts`, `src/lib/portfolio.ts`, `src/lib/actions/portfolio.ts`.

## Status
F-27: **fixed** (indicator + honest apply copy + saved badge).
F-31/F-32/F-38: **fixed**.
Accessibility: **partially verified** (code-level fixes; no contrast/browser tooling).
