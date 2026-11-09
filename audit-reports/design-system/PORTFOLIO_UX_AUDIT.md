# Portfolio & Builder UX Audit

## Public portfolio
### Overall impression
- One polished, content-first template (`ClassicTemplate`). Clear hierarchy: hero → about/stats → experience/education/skills → projects → testimonials → footer; sticky desktop nav + mobile bottom nav (`PortfolioBottomNav.tsx`).
- Strength: consistent section spacing, logical `dir`/language handling, visitor light/dark toggle, WhatsApp CTA, reduced-motion support.
- Weakness: no template variety; every portfolio shares the same layout, so differentiation relies entirely on color/font/content.

### Layout & cards
- Project cards support image / file icon / inline video / none; video is poster-first with click-to-play; aspect ratios configurable.
- Cards use a fixed 15px radius, tokenized colors, `object-contain` when a ratio is set (avoids cropping).
- Empty/missing-image cards collapse to `none` rather than a broken box (`ProjectPageView.tsx` visual fallback).
- Project detail pages share `ProjectCardMedia`/`ProjectCardBody`, so card/detail visuals cannot drift.
- Risk: 9:16 cards are very tall in a 3-column grid; no column-count adaptation based on ratio.
- Missing: no hover caption/quick actions, no masonry/featured-card variant, no card-level layout presets.

### Typography
- English: Inter/Space Grotesk (app) and user font (portfolio); Arabic: Cairo/Cairo Play, h1–h4 weight 900.
- Heading/body scale is per-section Tailwind, no shared type scale; long Arabic headlines rely on `break-words` (present in most headings).
- Mixed AR/EN content uses `dir` at the root and `dir="ltr"` on numeric inputs; okay but no per-block language tagging.

### Accessibility
- Focus-visible rings, aria labels, `role=progressbar`, reduced-motion block.
- Contrast risks: default muted text `#64748B` on `#F0F9FF` = 4.46 (marginal), user-selected colors have no validation, dark semantic colors fail with white text (see DESIGN_SYSTEM_AUDIT).
- Mobile bottom nav is icon+label with 44px-class targets; "More" drawer traps nothing (no focus trap found) — verify keyboard behavior manually.

## Builder UX
### Discoverability & organization
- Right panel switches between Theme (default) and the selected section; a "Theme" button in the panel header returns to appearance. Clear enough for returning users, but a first-time user may not realize Theme is a separate mode.
- Content vs appearance separation is logical (Sections/Projects vs Theme), but 13 raw color fields in one panel is overwhelming without presets.
- Theme panel uses emoji in headings (⚙️🎨✨) while the rest of the product uses Lucide icons — inconsistent tone.
- Font dropdown mixes Latin + Arabic + serif families in one flat/grouped list with no preview sample.
- Color fields show a swatch, hex input and native picker; good. No contrast feedback, no "apply palette" action, no undo for a single color besides global reset.
- Reset defaults resets to the legacy sky/indigo palette (`#38BDF8/#818CF8`), not the app brand blue; footer/logo keys are not reset or exposed.
- Save/publish feedback is strong: dirty snapshot, manual save, autosave draft, conflict modal, toast, publish/unpublish state.
- Empty/loading/error states exist (`EmptyState`, `Skeleton`, `ErrorBoundary`, `error.tsx`).
- URL state now restores tab/page/section and scroll (Phase 1 implementation) — refresh continuity is addressed.

### Friction points
1. No visual palette presets — users must choose 5–10 colors manually.
2. No contrast warning — publishing unreadable text/background is possible.
3. No font preview — selecting a font requires looking at the canvas and waiting for the remote font.
4. Hidden footer/logo settings — supported but unreachable.
5. Theme entry point is implicit (deselect section / small header button).
6. No template gallery; "Theme" sounds like it changes template but only changes colors/fonts.
7. RTL margins on ThemeSettings icons (`mr-1.5`) are physical, so Arabic layout spacing is slightly off.
8. Analytics uses a different blue (`#2563eb`) than the brand, weakening cohesion inside the builder.

## Quick wins (no redesign)
- Add 4–6 curated palettes with live thumbnails and one-click apply.
- Add a contrast checker that flags text/bg pairs below 4.5:1 before save.
- Expose footer colors + logo in the existing Theme panel (schema already supports).
- Add font preview text in the dropdown.
- Replace physical `mr-*` with logical `ms-*` in ThemeSettings.
- Rename "Theme" to "Appearance" (or "Design") to match what it controls.
- Add a template thumbnail strip when a second template exists.
