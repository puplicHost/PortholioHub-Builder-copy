# PortfolioHub Builder — UI/UX Audit Report

Scope: `/profile/builder` (all editor screens, modals, drawers) plus the shared
`src/components/ui/*` primitives and the analytics dashboard it links to.
Mobile + desktop. Read-only audit — no code was modified.

Files reviewed:
`BuilderClient.tsx` (3586), `ProjectManager.tsx` (620), `ThemeSettings.tsx` (351),
`SectionManager.tsx` (228), `TestimonialsEditor.tsx` (224), `MediaPicker.tsx` (222),
`GalleryEditor.tsx` (214), `FilesEditor.tsx` (206), `ContactEditor.tsx` (200),
`WorkspacePickerModal.tsx` (162), `CustomEditor.tsx` (130), `LivePreview.tsx` (18),
`preview/page.tsx`, `verify-required/VerifyRequiredCard.tsx`,
`components/portfolio/analytics/*`, `components/ui/{Input,Button,Toast,Card}.tsx`.

---

## Summary

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | High | A11y | Focus styles use `:focus` (mouse too) or bare `outline-none`; no `:focus-visible` anywhere in builder |
| 2 | High | A11y | Labels not associated with inputs (~115 `<label>`, 1 `htmlFor`) |
| 3 | High | A11y | Modals (`MediaPicker`, `WorkspacePickerModal`) lack `role="dialog"`, `aria-modal`, focus trap, Esc-to-close, scroll lock, focus restore |
| 4 | High | A11y | No `aria-live` — toasts and async status messages are silent to screen readers |
| 5 | High | Mobile | Inputs at `text-sm` (14px) trigger iOS Safari auto-zoom on focus |
| 6 | High | Correctness | `WorkspacePickerModal` "Select" hint uses `group-hover` with no `group` parent → never visible |
| 7 | Medium | Mobile | Numeric/phone/url/email fields lack `type`/`inputMode`, so wrong mobile keyboard + no autofill (`name`/`autoComplete`) |
| 8 | Medium | A11y | Icon-only buttons without `aria-label` (modal close, edit/delete, sort handles) |
| 9 | Medium | UX | Destructive actions (delete project / field / linked item / section) fire immediately — no confirm, no undo |
| 10 | Medium | A11y | Drag-and-drop reorder has no keyboard alternative |
| 11 | Medium | Consistency | 42 Arabic strings in `BuilderClient.tsx` mixed with English screens; no i18n |
| 12 | Medium | Mobile | Modal `max-h-[85vh]` (not `dvh`); 390px fixed preview iframe |
| 13 | Medium | Visual | Hardcoded hex/`bg-white`/`#374151` colors bypass the `--color-*` token system |
| 14 | Medium | Visual | 9 native `<select>`s, some without explicit text color → dark-mode option lists may be unreadable |
| 15 | Low | A11y | Tabs / segmented controls have no `role="tab"`/`aria-selected`/`aria-pressed` |
| 16 | Low | Motion | No `prefers-reduced-motion` handling for modals/drawers/toasts |
| 17 | Low | Consistency | Loading text uses literal `'...'` vs spinner pattern |
| 18 | Low | UX | `transition-all` animates layout; error text low-contrast; no retry on media load error |

---

## 1. Accessibility

### 1.1 Focus visibility (High)
- Builder files contain **0** occurrences of `focus-visible`; only `focus:` and bare
  `focus:outline-none` are used.
  - `src/components/ui/Input.tsx:27` — `focus:outline-none focus:ring-2 …` (ring also on mouse click).
  - `ThemeSettings.tsx`, `TestimonialsEditor.tsx`, `CustomEditor.tsx`, `ContactEditor.tsx`,
    `ProjectManager.tsx`, `BuilderClient.tsx` strip the outline without a consistent replacement.
- `Button.tsx` is the only primitive that uses `focus-visible:ring-2` correctly.
- Impact: keyboard users lose the visible focus indicator on most controls.
- Fix: standardize on `focus-visible:` rings; remove bare `focus:outline-none` where no replacement exists.

### 1.2 Label association (High)
- ~115 `<label>` elements across builder vs **1** `htmlFor` (only `Input.tsx:17`,
  and only when the `label` prop is passed).
- Most labels are visual-only, e.g. `ProjectManager.tsx` L181/190/216/226/236/266/275/289/
  302/316/360/370/381/407/437/446/460/473/487; `WorkspacePickerModal.tsx:131/135`;
  `MediaPicker.tsx:178/182`.
- Impact: screen readers announce unlabeled fields; clicking a label doesn't focus the input.
- Fix: pass `id` + `htmlFor` or use `Input`'s `label` prop.

### 1.3 Modal semantics & focus management (High)
- `MediaPicker.tsx:113` and `WorkspacePickerModal.tsx:83` are overlay `<div>`s with
  **no** `role="dialog"`, `aria-modal`, focus trap, initial focus, Escape handler,
  or background scroll lock.
- Only the two BuilderClient drawers have partial support:
  `BuilderClient.tsx:3008` and `:3087` set `role="dialog" aria-modal="true"`, and
  Escape is handled at `:586` — but that covers a single panel, not the Media/Workspace modals.
- Impact: keyboard/screen-reader users can tab behind the modal and cannot dismiss it without a mouse.
- Fix: shared `<Dialog>` primitive (role, aria-modal, labelled by heading, initial focus, Esc, focus restore, scroll lock).

### 1.4 Live regions (High)
- **0** `aria-live` regions in builder or `components/ui` (including `Toast.tsx`).
- Async results are only visual: `VerifyRequiredCard.tsx:63-64` ("✅ اتبعت الإيميل…"),
  `MediaPicker.tsx:195` error, `BuilderClient` save/publish toasts.
- Fix: `role="status"`/`aria-live="polite"` on Toast + inline async messages.

### 1.5 Icon-only controls (Medium)
- Missing `aria-label`: `WorkspacePickerModal.tsx:87` (close), `MediaPicker.tsx:117` (close),
  `ProjectManager.tsx:330/501/543/546/593/596` (edit/trash), sort handles in `BuilderClient.tsx`.
- `SectionManager.tsx`, `ProjectManager.tsx`, `ThemeSettings.tsx`, `MediaPicker.tsx`,
  `WorkspacePickerModal.tsx` contain **0** `aria-label`s.
- `MediaPicker.tsx:205` relies on `title=` for thumbnail naming (not reliably exposed).

### 1.6 Tabs / segmented controls (Low)
- `WorkspacePickerModal.tsx:151` `Tab` and `MediaPicker.tsx:123/131` use plain `<button>`
  with active state shown only by border/color; no `role="tablist"`/`role="tab"`/`aria-selected`.
- `ProjectManager.tsx` link-type / field-type segmented buttons (~L241-260, 412-431) have no `aria-pressed`.

### 1.7 Drag-and-drop reorder (Medium)
- `BuilderClient.tsx` uses `useSortable` (`:375`) inside `SortableContext` (`:3275-3315`);
  no keyboard-accessible alternative, no `aria-grabbed`/instructions.
- Fix: add keyboard move up/down or `dnd-kit` keyboard sensor + live announcements.

### 1.8 Charts (Low)
- `AnalyticsDashboard` lazy-loads charts with `ssr:false` and a labeled `ChartSkeleton`
  (`:32`) — good — but the rendered charts (`RadialGaugeCard`, `ViewsChart`, `ProjectViews`,
  `TopLists`) need text/table alternatives. `ProjectViews.tsx:91` image `alt` should be verified.

---

## 2. Mobile / Touch

### 2.1 iOS input zoom (High)
- `Input.tsx:27` uses `text-sm` (14px). Safari auto-zooms any focused input < 16px.
- Fix: `text-base` (16px) on mobile, shrink at `sm:`.

### 2.2 Input types & autofill (Medium)
- No `inputMode`/`autoComplete`/`name` attributes in builder. Numeric fields use
  `type="number"` (spinner + full keyboard) instead of `inputMode="numeric"`; phone/url/email
  fields are not `type="tel"/"url"/"email"`.
- Fix: correct `type` + `inputMode` + `autoComplete` (`name`, `email`, `tel`).

### 2.3 Viewport-height & fixed-width (Medium)
- `MediaPicker.tsx:114` and `WorkspacePickerModal.tsx:84` use `max-h-[85vh]` (not `dvh`);
  BuilderClient drawers correctly use `85dvh`.
- `preview/page.tsx` renders the template in a fixed **390px** iframe — on viewports
  narrower than 390px content can clip; no internal breakpoints.

### 2.4 Touch target consistency (Medium)
- Many controls correctly use `min-h-[44px]` (BuilderClient ~56 controls, analytics, editors),
  but small controls remain: modal close `p-1` (~28px) in both modals; several
  `ProjectManager` icon buttons and segmented buttons at `py-1.5 text-[11px]`.
- Fix: enforce ≥44px hit area on all interactive controls.

---

## 3. Visual consistency

### 3.1 Token bypass (Medium)
- Hardcoded colors instead of `--color-*`: `ProjectManager.tsx` `bg-white dark:bg-[#374151]`;
  `AnalyticsDashboard.tsx` uses many raw hexes (`#0f172a`, `#2563eb`, `#161b26`, …).
- Impact: theming/contrast not centrally controllable; visual language diverges from builder tokens.

### 3.2 Native `<select>` dark mode (Medium)
- 9 `<select>` elements. `ProjectManager.tsx:293/464` set `bg-[var(--color-surface)]`
  but no explicit text color → on Windows the native option list can render dark-on-dark.
- Fix: set explicit `color`/`option` styles or use a custom select.

### 3.3 Mixed language & loading patterns (Medium/Low)
- 42 hardcoded Arabic strings in `BuilderClient.tsx` (+2 `TestimonialsEditor.tsx`, +1 each
  in `ThemeSettings/GalleryEditor/FilesEditor/ContactEditor`), while `MediaPicker`/
  `WorkspacePickerModal` are entirely English. Mixed-language UI, no i18n layer.
- Loading placeholders use literal text `'...'` (`ProjectManager.tsx:200/391`) vs
  `Loader2` spinners elsewhere (`MediaPicker.tsx:155`, `WorkspacePickerModal.tsx:119`).

### 3.4 Radius / spacing drift (Low)
- Builder uses `rounded-md`/`rounded-lg`; analytics uses `rounded-[24px]`/`rounded-[28px]`.
  Inconsistent surface language between adjacent screens.

### 3.5 `transition-all` (Low)
- Widely used (e.g. `AnalyticsDashboard.tsx` buttons/selects, `ProjectManager`) — animates
  layout-affecting properties; prefer `transition-colors`/`transition-transform`.

---

## 4. Interaction / UX

### 4.1 Destructive actions (Medium)
- Immediate, unconfirmed deletes: `ProjectManager.tsx:330/501/543/546/593/596`,
  BuilderClient section removal. No `window.confirm`, no undo, no toast-with-undo.
- Fix: confirm dialog for destructive ops (or undo affordance).

### 4.2 Confirmed bug — hidden "Select" affordance (High)
- `WorkspacePickerModal.tsx:75` uses `opacity-0 group-hover:opacity-100`, but the parent
  button (`:58-61`) has no `group` class → the hint is never shown.
- Fix: add `group` to the row button (and remove the dead hint or gate it differently).

### 4.3 Error surfaces (Low)
- `MediaPicker.tsx:195` renders the load error as `text-[var(--color-text-muted)]` (low
  contrast for an error) with no retry action.
- Error handling is split between inline messages and toasts with no clear rule.

### 4.4 Empty states (Low)
- `MediaPicker.tsx:197` ("No uploads yet…") and ProjectManager empty states are clear;
  `WorkspacePickerModal.tsx:52` is generic ("No items found."). Quality is uneven.

### 4.5 Fragile empty-state condition (Low — verify)
- `ProjectManager.tsx:511`: `(!a && !b || (c?.length === 0 && d?.length === 0))` depends on
  `&&`-over-`||` precedence and optional-chaining short-circuit. Works today by luck;
  refactor to explicit parentheses/booleans to avoid a mis-shown empty state.

### 4.6 Focus restore (Medium — folded into 1.3)
- After closing drawers/modals, focus is not returned to the triggering control.

---

## 5. Notable positives (keep)

- `AnalyticsDashboard.tsx` uses `min-h-[44px]` on controls, `aria-label`s on icon buttons
  (`:293`, `:305`), `rel="noreferrer"` on `target="_blank"` (`:318`), RTL-aware `ms-*`,
  and lazy-loaded charts with skeletons.
- `BuilderClient.tsx:2960` external link correctly sets `rel="noreferrer"`.
- Drawer panels (`BuilderClient.tsx:3008/3087`) already declare `role="dialog" aria-modal`.
- Empty/loading states exist across editors (consistency is the issue, not absence).

---

## Recommended fix order

1. **#3, #4, #1, #2** — shared accessible `Dialog` primitive + focus-visible + label
   association + `aria-live`; these unlock the most WCAG gains.
2. **#5, #6, #7** — mobile input sizing/types and the `WorkspacePickerModal` bug (quick wins).
3. **#9, #10, #8** — destructive confirmations, keyboard reorder, icon-button labels.
4. **#11–#14** — i18n, token/color and select consistency.
5. **#15–#18** — remaining polish.

Legend: High = blocks keyboard/SR users or visibly broken; Medium = real friction, broad
impact; Low = polish.
