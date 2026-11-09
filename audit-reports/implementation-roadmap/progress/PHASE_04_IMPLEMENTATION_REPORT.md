# Phase 4 — Implementation Report

## Objective
Make Editorial Marketing respond to Builder configuration and keep preview/public responsive behavior consistent.

## Findings
F-01, F-02, F-03, F-04, F-05, F-08, F-15, F-20–F-26, F-29, F-30, F-33, F-36, F-37, F-39, F-45, F-47.

## Implementation
- **Appearance (F-01):** Editorial now derives `--emk-*` color/font variables from saved appearance. Values matching Classic seed defaults fall back to Editorial's own palette so existing/default profiles are not turned blue. Customized primary/accent/light/dark colors, custom fonts, and a customized dark palette are honored.
- **Defaults (F-02, partial):** Editorial has template-level fallbacks and consumes the Builder values; the Settings panel still displays the shared flat appearance object. A namespaced per-template default editor is **not** implemented (policy/design decision).
- **Layouts (F-03):** Experience `timeline/grid/list`, Skills `chips/bars/both`, and Projects `grid/list` render variants. Percent bars use the stored percentages.
- **Section order (F-05):** Sections receive CSS `order` from `sectionOrder` inside a flex `<main>`, so drag order is reflected.
- **Responsive preview (F-04):** Editorial breakpoints converted from viewport `@media` to `@container` against the template root; Builder/admin frames now use available width. Public pages still use the root width. Reduced-motion remains a media query.
- **Actions/analytics (F-08):** Floating WhatsApp and scroll-to-top actions honor `actionButtons`; WhatsApp clicks emit `whatsapp_click` tracking.
- **Hero (F-15/F-29):** Avatar `object-position`, background image/position/overlay, and non-duplicated intro are implemented. Hero reference redesign (F-37) is deliberately **not** performed.
- **Content parity:** clients logo shape/size/grayscale; section copy/descriptions; education images; testimonial subtitle; unconfigured star ratings removed; stats/features/extras no longer truncated; custom-card icon/link-icon gaps remain; contact labels and footer icons corrected; header nav no longer capped at five; scroll listener remains window-based in preview (partial); Arabic font stack added; focus styles added; picker thumbnails/assets not added.
- **Picker (F-47, partial):** labels remain swatch-based; no fabricated screenshot assets.

## Files changed
`EditorialMarketingTemplate.tsx`, `editorial.module.css`, `ClassicTemplate.tsx` (preview interception only), `ProjectPageView.tsx` (detail palette), `visibility.ts` (Phase 6 helper), dictionaries, Builder.

## Status
F-01, F-03, F-04, F-05, F-08, F-15, F-20, F-21, F-22, F-23, F-25, F-29, F-30, F-33, F-39, F-45: **implemented**.
F-02: **partial** (no per-template namespace editor).
F-24, F-26, F-36, F-47: **partial/not fully implemented**.
F-37: **blocked by design approval**.

## Risks
- The appearance heuristic (Classic-default detection) is pragmatic, not a true per-template default model.
- Container queries change responsive behavior; manual visual matrix is required.
- No image/thumbnail assets were invented.
