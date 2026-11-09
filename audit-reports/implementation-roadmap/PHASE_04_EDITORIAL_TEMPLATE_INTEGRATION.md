# Phase 4 — Editorial Template Integration

## 1. Objective

Make Editorial Marketing genuinely configurable by the existing Builder: appearance tokens, layout variants, section order, actions and content options must visibly affect the rendered template, and the inline/admin preview must match public output.

## 2. Scope and Finding IDs

Primary:
- **F-01** Editorial ignores appearance settings.
- **F-02** No template-specific appearance defaults; misleading reset/display.
- **F-03** Experience/skills/projects layout variants ignored.
- **F-04** Editorial responsive preview uses viewport queries inside a container frame.
- **F-05** Section order ignored.
- **F-08** Floating WhatsApp/scroll actions and WhatsApp analytics missing.
- **F-15** Hero ignores avatar focal point and background/overlay.
- **F-20** Clients logo shape/size/grayscale/underline ignored.
- **F-21** Section titles/descriptions/icons ignored (skills heading; experience/education/services/gallery/files descriptions; section icons).
- **F-22** Education images ignored.
- **F-23** Testimonial subtitle ignored; hidden rating default rendered.
- **F-24** Custom card icon/linkIcon/imagePosition/underline ignored.
- **F-25** Stats/features/extras silently truncated.
- **F-26** Section presence rules diverge from Classic.
- **F-29** Hero intro duplicates the job title.
- **F-30** Contact label/footer icon inconsistency.
- **F-33** Header navigation limited to five links.
- **F-36** Preview scroll state reads `window`.
- **F-37** Hero reference-fidelity difference (decision/approval).
- **F-39** Arabic font fallback.
- **F-45** Editorial text-link focus visibility.
- **F-47** Template picker thumbnails/clarity.

## 3. Current Evidence

**Audit references:** `TEMPLATE_EDITORIAL_AUDIT.md` §2 (compatibility matrix), §3 (defects), §4 (defaults architecture), §5 (hardcoded values), §6 (Hero), §8 (remediation); `UX_ACCESSIBILITY_PERFORMANCE_AUDIT.md` §3–§5; `MASTER_FINDINGS.md` rows above.

**Confirmed evidence:**
- `EditorialMarketingTemplate.tsx` never reads `appearance.*` except `getPortfolioLang`; `editorial.module.css:3–17` hardcodes palette/typography.
- `EditorialMarketingTemplate.tsx:230–232` voids `isFree`, `preview`, `onThemeChange`; theme toggle/animation state ignored.
- Section render order is fixed JSX (`~680–1088`); `sectionOrder` only sorts the lookup array.
- Responsive `@media` at CSS lines 117/125/179/180/227/244; `LivePreview.tsx:24–27` supplies a fixed `@container`.
- `displayMode` is read by Classic (`784/948/1346`) but never by Editorial.
- No floating action implementation; only Classic fires `whatsapp_click` (`ClassicTemplate.tsx:2197`).
- Hero portrait CSS `151–166`; no `object-position` anywhere in Editorial; background/overlay not used.
- Stats `.slice(0,4)` (`367`), features `.slice(0,4)` (`399`), extras `.slice(0,3)` (`319`).
- `ThemeSettings.tsx` is template-agnostic; reset defaults writes the Classic palette (`139–162`).

**Confidence:** F-01/F-02/F-03/F-04/F-05/F-08/F-15 C; F-20–F-26 C; F-29/F-30/F-33/F-36/F-39/F-45/F-47 C; F-37 design decision (C for difference, U for desired outcome).

## 4. Required Investigation

1. Decide the appearance model with the user (required approval):
   - **A:** Editorial consumes existing Classic-named keys.
   - **B (recommended):** template defaults + optional `appearance.templates['editorial-marketing']` overrides, with runtime fallback; no schema migration (schema already catchall).
   - **C:** declare Editorial style fixed and disable/hide appearance controls.
   Do not proceed until this is approved.
2. Audit every field in `TEMPLATE_EDITORIAL_AUDIT.md` §2 and mark implement / template-owned / remove-control. Build the compatibility checklist into the progress report.
3. Confirm the reference Hero intent with the user (phone mockup vs current arch portrait); do not redesign implicitly (F-37).
4. Inspect `LivePreview`, `BuilderPreviewClient`, `globals.css` `.no-cq` contract, and breakpoints before changing responsive logic.
5. Inspect the section editors to confirm what is saved vs only displayed (e.g. skills heading, client options, education image, custom card metadata).
6. Review `PortfolioFooter` icon helpers and coordinate F-30 ownership with Phase 5 (see MASTER_ROADMAP §4).
7. Check the picker asset situation for F-47; real thumbnails require approved screenshots/assets. If unavailable, use a faithful labelled swatch and do not fake screenshots.
8. Inspect current appearance validation (`safeColor`, `safeFont`, `safeTemplate`) before adding namespaced keys.

## 5. Implementation Requirements

### A. Appearance and defaults (F-01, F-02)
- Add a pure template-appearance defaults registry and resolution helper (client-safe, no server imports).
- Resolution order: customer override → template default → hard runtime fallback. For Classic, preserve current behavior exactly.
- Suggested storage (no migration): `appearance.templates[templateId]` inside the existing JSON, optional keys only. Do not write Classic keys when applying/editing Editorial.
- Editorial root should set CSS custom properties from resolved values (primary/accent, bg, card, text, muted, border, display/body fonts, dark/light if supported). Remove or demote hardcoded palette values to defaults only.
- Support `defaultColorMode`/`showThemeToggle`: either implement Editorial light/dark variants and a visitor toggle, or explicitly mark the template light-only in the Builder and disable/explain those controls. Do not leave them enabled and inert.
- `ThemeSettings` must receive/derive the active template and display effective values (saved vs template default), and “Reset defaults” must reset only the active template’s namespace.
- Preserve existing customer data: customers without a `template` key render Classic exactly as before; applying Editorial must not overwrite Classic keys.

### B. Layout variants and order (F-03, F-05)
- Implement Experience `timeline|grid|list`, Skills `chips|bars|both`, Projects `grid|list` in Editorial, matching Classic semantics (including percentages and group headings where applicable).
- Respect `projects.content.groups` and `content.groupId`.
- Render sections in the customer’s saved `sectionOrder`, with the editorial styling applied per section type. Define a fallback order only for sections missing from the normal order list.
- Keep the editorial narrative possible without breaking customer ordering; do not silently ignore drag-reorder.

### C. Responsive/preview (F-04, F-36)
- Convert Editorial breakpoints to container queries (like Classic’s `cq-*` contract) or provide a width-scoped CSS context so `LivePreview` and admin device frames render the correct mobile/tablet layout.
- Preserve the public `.no-cq` fallback: public pages must still use viewport behavior where intended.
- Bind the sticky-header scroll state to the nearest scroll parent in preview; keep window behavior public.
- Verify no horizontal overflow at 320/375/768/1080.

### D. Actions and analytics (F-08)
- Implement Editorial floating WhatsApp and scroll-to-top controls honoring `actionButtons.showWhatsapp/showScrollToTop/whatsappNumber` (styled for the template).
- Fire `trackPortfolioEvent(username, 'whatsapp_click')` exactly like Classic; ensure owner/self tracking behavior is preserved.
- Do not introduce duplicate click handlers or tracking.

### E. Hero (F-15, F-29, F-37, F-39)
- Apply `appearance.avatarPosition` to the portrait image (`object-position`).
- Apply hero background image/position/overlay where the design supports it, or explicitly declare them unsupported in the Builder for Editorial (with approval).
- Do not use the role/job title (`hero.subtitle`) as the intro paragraph; use biography/about text; never duplicate the eyebrow.
- F-37: present the current vs reference hero to the user; implement only the approved direction. If keeping the current frame, document it as intentional.
- Arabic: add an Arabic-capable display font stack/template token so headings do not silently fall back; test AR/EN both directions.

### F. Content options (F-20–F-26, F-30, F-33)
- Clients: honor logo shape/size/grayscale/underline; if the design intentionally fixes some, disable/hide those controls for Editorial with a clear note.
- Section copy: read skills `heading`, section descriptions (experience/education/services/gallery/files), and render section icons where the design supports them.
- Education: render certificate image + optional lightbox.
- Testimonials: render subtitle; do not render the hidden default rating unless a rating control exists. Either add a rating editor or remove stars (prefer removing unconfigured data).
- Custom: honor card icon, link icon, image focal point, underline, or explicitly declare unsupported.
- Render all stats/features/extras or display a `+n` affordance; do not silently drop content.
- Align presence predicates with Classic (title-only sections, name-only clients) or document deliberate differences in the template contract.
- Contact: prefer the saved label over the raw type; use correct contact icons (coordinate shared footer helper with Phase 5).
- Header nav: include all eligible links or explicitly prioritise Contact; do not cap silently.

### G. Picker and focus (F-45, F-47)
- Add real template thumbnails if assets are approved; otherwise use faithful, labelled swatches. Do not add fabricated screenshots to customer pages.
- Add `.emk__project-link`/contact/text-link focus-visible styling consistent with buttons.
- Keep the picker’s preview/apply state semantics to Phase 7 (F-27); Phase 4 may only improve thumbnails/labels (F-47).

### Constraints and edge cases
- No database migration by default; new appearance keys must be optional and backward-compatible.
- Do not change Classic rendering as part of this phase (except shared icon helper ownership noted above; verify Classic).
- Preserve section visibility, Free stripping, Pro page-link gating, sanitization, and RTL.
- Do not add dependencies without approval; no `dangerouslySetInnerHTML`; no reference HTML/assets copied into customer pages.
- Handle missing/invalid data with defaults, never fabricated content.
- Keep the template usable when no appearance overrides exist.

## 6. Security and Data Safety Considerations

- Keep the server template entitlement guard intact; do not allow Free activation via UI or crafted payloads.
- New appearance keys must pass validation/sanitization; no raw CSS injection via font/color strings.
- Do not write Classic keys during Editorial apply, to avoid re-skinning.
- Public routes must not leak locked sections.
- No production data writes; template defaults are code/config only.

## 7. Testing Requirements

**Unit/integration:**
- Appearance resolver: default, override, legacy absence, invalid values, Classic unchanged, switching back preserves keys.
- Layout variants: each mode produces the expected structure/classes; groups; percentages.
- Section order mapping.
- Presence rules (title-only sections, name-only clients).
- Content truncation removed; stats >4, features >4, extras >3.
- Hero intro no longer equals role; avatar position applied.
- Actions/analytics: WhatsApp URL and tracking call; switches.
- Contact label/icon mapping; nav link list.
- Preview helper/breakpoint logic where testable without a browser.
- RTL/AR content mapping (pure functions).

**Regression:**
- Classic template snapshots/logic (no visual changes); free stripping; template guard; public selection; saved appearance preservation.

**Manual (browser, only if authorized):**
- Editor at desktop/tablet/mobile; public at 320/375/768/1080; RTL/EN/AR; all appearance controls one-by-one; preview vs public; floating actions/analytics; hero focal point/background; reference comparison (F-37); keyboard focus.
Record exact steps/results; no Playwright unless explicitly authorized.

## 8. Definition of Done

- F-01/F-02: approved appearance model implemented; controls either work or are explicitly template-owned; defaults visible/editable; existing customers unchanged.
- F-03/F-05: layout modes and order visibly affect Editorial.
- F-04: mobile/tablet preview matches public output.
- F-08/F-15: actions/analytics and hero controls implemented or explicitly approved as unsupported.
- F-20–F-26/F-29/F-30/F-33/F-39/F-45/F-47 resolved or explicitly deferred with approval.
- F-37 decision recorded; no unapproved redesign.
- Tests/manual checks recorded; Classic regression verified; user accepts.

## 9. Out of Scope

- F-09/F-18/F-19 (Phase 1), F-17/F-28/F-48/F-49 (Phase 2), F-06/F-10/F-11/F-12/F-34/F-46 (Phase 3).
- F-13/F-14/F-16 (Phase 5) — F-30 shares only the footer icon helper, coordinated as per master.
- F-07/F-35 (Phase 6).
- F-27/F-31/F-32/F-38 (Phase 7).
- F-40–F-44 (Phase 8).

## 10. Completion Report Requirements

`progress/PHASE_04_IMPLEMENTATION_REPORT.md`: approved appearance model, defaults registry, every compatibility-matrix row marked implemented/template-owned/removed/deferred, files changed, hero decision, deviations.
`PHASE_04_TEST_REPORT.md`: unit/integration results, Classic regression, manual viewport/RTL/actions checklist.
`PHASE_04_BLOCKERS.md`: policy/design approvals (F-02 model, F-37 hero, unsupported controls), missing assets (thumbnails), anything not run.

## Mandatory safety rules (repeat — applies to this phase)

1. Read this roadmap, this phase, and project instructions first.
2. Execute only this phase.
3. Inspect actual source before changing each finding.
4. Preserve all existing uncommitted work.
5. Never use `git reset`, destructive checkout, broad reverts, or overwrite unrelated work.
6. Never assume localhost/`NODE_ENV=development` proves DB isolation.
7. Verify the database target before any DB-related command.
8. Never write to production customer data.
9. Never run production SQL migrations/resets/reseeds/destructive scripts without explicit approval.
10. Never deploy automatically.
11. Use isolated environments and synthetic data for DB testing.
12. Never install/upgrade dependencies without explicit approval.
13. No Playwright/browser automation without explicit authorization.
14. Do not silently change subscription/payment/customer-data/business rules.
15. Do not delete/rewrite customer content to simplify implementation.
16. Do not remove legacy compatibility without proof it is safe.
17. A passing TypeScript check is not proof a feature works.
18. Report blockers honestly; do not bypass safety checks.

If production access, a migration, a policy decision, or a destructive operation is required: **STOP and request user approval.**
