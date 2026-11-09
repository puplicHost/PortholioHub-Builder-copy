# UX, Accessibility, Responsive and Performance Audit

Scope: Builder chrome and both public templates. Findings are source-proven; no Lighthouse/browser run was performed (read-only audit), so performance numbers are analytical, not measured.

## 1. Confirmed UX defects

### 1.1 Template selection
- **F-27 (Medium):** after closing the Templates modal with X/Escape, preview can stay active with **no indicator** in the chrome. The canvas looks applied; pressing Save saves content but the *saved* template, not the previewed one. Only "Done" clears the override (`TemplatePickerModal.tsx` bottom bar; `BuilderClient.tsx:4424`).
- **F-02 (Critical):** Settings → Appearance remains fully editable under Editorial but has no effect. The UI does not disable or explain those controls. This is the strongest "misleading UI" finding in the product.
- **Preview cards are abstract swatches**, not template screenshots (`TemplatePickerModal.tsx:40–68`); users must open "Preview" to know what they are choosing.
- The modal's "Active" badge follows the preview override, not the saved template (`BuilderClient.tsx:4424`), so it can show active on a template that is not actually saved while previewing.

### 1.2 Navigation and missing affordances
- **F-12:** no View Page action in Pages list/cards; desktop View Live opens a 404 for draft portfolios and for unlinked cards (fixed by source trace, see Builder audit). Mobile Go Live handles the draft case correctly — inconsistent feedback between breakpoints.
- **F-10:** undo/redo buttons look enabled but do nothing; no disabled state and no tooltip caveat.
- **F-06:** no way to add Contact/Gallery/Files sections. "Add Section" adds a Custom section only; the add-section UI for the other three exists only in unused `SectionManager.tsx`.
- **F-07:** after a downgrade, Save fails with a non-specific toast; the user is not told that switching the template resolves it.

### 1.3 Destructive-action consistency
- Standalone page deletion is immediate, confirmed, and irreversible.
- Project card deletion is confirmed but only local until the next save; navigating away can revert it (draft may restore). Same visual confirmation implies different durability. (F-28-adjacent.)
- Deleting a section is immediate server-side after confirmation but the local reorder isn't persisted until a later save.

### 1.4 Content visibility surprises
- Classic: testimonial text disappears unless a photo is uploaded (F-13); clients without logos disappear entirely (Classic filter).
- Editorial: sections that exist but are "title-only" disappear (about/contact/projects presence rules); stats beyond 4 and service features beyond 4 are silently dropped; education images disappear; clients lose logo shape/grayscale settings.
- Editorial header nav shows only the first five quick links (`EditorialMarketingTemplate.tsx:608`); with all sections present, Files and Contact are absent from desktop nav.

## 2. Accessibility

### 2.1 Verified strengths
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`, section elements with `id`s in both templates.
- Editorial mobile menu button: 44×44 px min target, `aria-expanded`, localized accessible name (`EditorialMarketingTemplate.tsx:615–623`); drawer links close the menu.
- Templates modal: `role="dialog"`, `aria-modal`, labelled title, Escape close, background scroll lock, focus trap and focus restore (`TemplatePickerModal.tsx:83–130`).
- Focus-visible rings exist for header buttons, drawer items, CTA buttons and contact/reveal styles (`editorial.module.css:148–150`); Classic has extensive focus-visible utilities.
- Images carry alt text (avatar, project title/caption, client name, testimonial name).
- Reduced-motion is honored by the Editorial module (`editorial.module.css:315–317`) and Classic’s hero/blob CSS (`ClassicTemplate.tsx:2000–2010`).
- Builder inputs generally have associated `<label htmlFor>` or `aria-label`; icon buttons mostly have accessible names (spot-checked ProjectManager, TemplatePicker, ThemeSettings).

### 2.2 Confirmed weaknesses
1. **Repeated identical link names.** Every Editorial project card exposes "View case study"/"View project" with no project name in the accessible name (`EditorialMarketingTemplate.tsx:766–778`); Classic does the same. In a screen-reader link list, all links are indistinguishable. Recommendation: `aria-label={`${label}: ${project.title}`}`.
2. **Editorial drawer has no Escape/outside-click close.** Only the toggle closes it; keyboard users must tab back to the button (`editorial:615–631`). Classic’s menu implements Escape/outside click (`ClassicTemplate.tsx:805–825` pattern used in other components).
3. **Editorial contact cards rely on `title` for context** and show the raw type token as the label (`editorial:504–515`, `1076–1105`); custom labels are ignored, which harms comprehension in Arabic (`"whatsapp"` in Latin script).
4. **Editorial footer social links** are icon-only with `aria-label` from platform/label (good) but `getSocialIcon('Email')` returns a Globe, so the visible/accessible label may say "Email" while the icon implies a website.
5. **Classic contact links** (`ClassicTemplate.tsx:1803`) and footer links (`PortfolioFooter.tsx:265`) have an unreachable contact-icon fallback, producing Globe icons for email/phone.
6. **Toast-only validation**: experience/education validation errors surface as toasts, not inline `aria-describedby` messages at the field. Not asserted as WCAG failure without a browser test, but an accessibility risk.
7. **Dead controls are focusable** (undo/redo). Keyboard users can focus and activate a button that does nothing and gives no feedback (F-10).
8. **Editorial decorative eyebrow uses `::before` with content `""`** — fine (pseudo-element), but the eyebrow role depends on visual styling; the job title is still meaningful text. No issue.
9. **Contrast:** approximating from the tokens, `#6f6759` on `#fbf7ee` and `#f4eddf` is around the 4.5:1 boundary for normal text; `rgba(253,250,243,0.65)` on `#2a2622` is comfortable. **Unverified** numerically; needs a contrast tool in staging. Do not treat as confirmed failure.
10. **Language/`dir`:** Editorial sets `dir` on its root; the public route’s `<html>` language is set by the app (server language cookie), which may differ from the portfolio language. The template root corrects it for its subtree. Correct for content; metadata locale is derived from appearance (`contentLocale`). No defect found.

## 3. Responsive behavior

### 3.1 Public rendering
- Editorial breakpoints: 640 (logos), 860 (nav/two-column grids), 900 (hero/about), 1000 (logos). At 320–375 px the hero stacks, portrait `min(320px,78%)` fits, project grid is one column, footer stacks via auto-fit. No overflow rule found that would force horizontal scroll from the reviewed layout (`width:min(1180px,100%-3rem)`, `max-width:100%` on images).
- RTL: logical properties are used for inset/start/end; arrows mirror via `rtl:-scale-x-100`; reference layout is LTR-first but the CSS adapts. No confirmed break.
- Arabic typography: Playfair Display has no Arabic glyphs. The browser falls back past Georgia to an Arabic serif/sans depending on platform, so Arabic headings do **not** use the same typeface as Latin; this differs from Classic, which loads a customer font that may support Arabic (Cairo). Confirm visually in staging (F-39, low).

### 3.2 Builder preview (confirmed defect)
- **F-04:** Editorial uses `@media (min-width: …)` while the inline preview is a fixed-width `@container` (`LivePreview.tsx:24–27`). On a desktop viewport, the 375 px “mobile” preview therefore renders the desktop hero, desktop nav (toggle hidden at ≥860 px), 5-column logos and 2-column grids — overflowing the frame. Classic’s `cq-*` classes render correctly in the same frame. Admin preview device modes also misuse container width for Editorial (`BuilderPreviewClient.tsx` frames vs the same CSS).
- The Editorial sticky header shadow listens to `window.scrollY` (`EditorialMarketingTemplate.tsx:564–572`) but preview scrolling happens in `[data-preview-scroll]`; the shadow never changes in preview (cosmetic, low).

### 3.3 Touch targets
- Editor buttons are mostly ≥40–44 px; Template modal 36 px buttons are below the 44 px guidance for primary touch actions but acceptable as secondary controls inside a sheet. Note only.

## 4. Performance (analytical)

### Positive
- Editorial is dynamically imported on the public route only when selected (`u/[username]/page.tsx:111–113`), and lazily via `useEffect` in `LivePreview` and admin preview; the Classic bundle is unaffected for Classic visitors.
- Playfair Display is loaded through `next/font` (latin subset, 4 files: 3 weights + italic), not a render-blocking third-party `<link>`.
- Public profile fetch is `React.cache`-deduped between `generateMetadata` and the page; subscription and profile each resolve once per request.
- Builder data loads in one Prisma query with included relations (plus migration re-fetch only when needed).
- `LivePreview` is memoized on profile/plan/template identity; form state changes do not re-render the template.
- Images use Cloudinary transformation sizing (`portfolioImageUrl`) and `loading=lazy` below the fold; the hero avatar is eager.

### Risks
- **Editorial recomputes all section mappings on every render** (brands, projects, skills, services, experience, education, testimonials, gallery, files, contact, footer). Only `sections` is memoized (`editorial:242–250`). Menu open/close and scroll threshold changes trigger a full re-map. With 50 projects + 60 gallery items the cost is moderate; a future `useMemo` keyed on `profile` would remove it. Label: not confirmed as user-perceived jank; source-level inefficiency.
- **Editorial pulls `PortfolioFooter` for two icon helpers** (`getSocialIcon`, `getContactIcon`), which imports the full footer component module (large inline SVG set) into the editorial chunk. Bundle-shared risk, low.
- **Classic template remains statically imported** in the public route while Editorial is dynamically imported. The Classic branch is not rendered for Editorial visitors, but the module is part of the route graph; whether its client chunk is actually downloaded for an Editorial render must be measured (F-40, low/unverified). If confirmed, split both templates behind dynamic imports.
- No `width`/`height` attributes on Editorial `<img>` elements; wrappers with fixed aspect ratios mitigate most CLS, but logo/gallery images can still shift. Low.
- Builder preview eagerly computes both desktop/mobile? Only one frame renders at a time (`BuilderClient.tsx:4585–4611`), so no duplicate mount. Good.
- Public `getPublicProfile` fetches the full profile row (all public JSON) plus subscription; no pagination for project pages (public route includes every published page + items even though the home template only needs cards; project items are unnecessary data on the home payload). This can inflate the RSC payload for customers with large pages. Medium-low, source-proven: `u/[username]/page.tsx:27–31` includes `projectPages.items` for all pages.
- `updatePortfolio` performs a full delete/recreate of all project items on every save (`actions/portfolio.ts:791–797`), even if only appearance changed. Correctness-safe, but a heavy write amplification for large portfolios. Existing behaviour.

## 5. Specific UX copy/consistency issues
- Templates modal says applying saves the template only, but F-27 shows it saves all pending edits.
- `templates.applyAgain` ("Redo apply") is odd copy for an already-active template; the button is disabled in that state anyway.
- `PRO_TEMPLATE_REQUIRED` has no friendly mapping; the user sees a generic technical message.
- Editorial contact label displays `email`/`whatsapp` instead of the saved label, and the value below, duplicating information in a lower-quality way.
- Footer editor’s source-of-truth preference causes legacy footer-only links to be invisible in the editor (F-38).

## 6. Manual verification still required (not provable statically)
- Numeric contrast ratios for Editorial tokens and Classic light/dark palettes.
- Actual mobile/tablet preview rendering (F-04) in a real browser.
- Screen-reader link list duplication and drawer behavior.
- Save race (F-09) under throttled network.
- Arabic font fallback quality on Windows/iOS/Android.
