# Phase 3 — Builder Core Functionality

## 1. Objective

Restore missing Builder workflows, correct project/page navigation and publishing affordances, and prevent preview navigation from leaving the Builder.

## 2. Scope and Finding IDs

- **F-06 (Critical):** no UI to create Contact, Gallery or Files sections.
- **F-10 (High):** Undo/Redo buttons have no behavior.
- **F-11 (High):** renaming a linked page's slug does not update referencing cards.
- **F-12 (High):** no View Page affordance; View Live can 404 for drafts/unlinked cards.
- **F-34 (Low/Medium):** no UI to publish/unpublish an individual project page; `isPublished` can strand links.
- **F-46 (Low):** project links inside the Builder preview navigate away or 404.

## 3. Current Evidence

**Audit references:** `BUILDER_FUNCTIONAL_AUDIT.md` §1.2, §2.2, §3.2, §5; `CROSS_SYSTEM_INTEGRATION_AUDIT.md` §2, §5; `UX_ACCESSIBILITY_PERFORMANCE_AUDIT.md` §1; `MASTER_FINDINGS.md` rows F-06/F-10/F-11/F-12/F-34/F-46.

**Confirmed evidence (re-verify current tree):**
- F-06: `BuilderClient.addCustomSection` is the only add handler (`~1790–1830`, button `4920–4936`). `SectionManager.addSection('gallery'|'files'|'contact'|'custom')` (`SectionManager.tsx:30–60`) is not imported anywhere. Seeds omit contact/gallery/files (`actions/portfolio.ts:309–350`); clients is auto-created.
- F-10: `BuilderClient.tsx:4453–4466` renders Undo/Redo buttons with no `onClick`; `updateProfile` is `setProfile` only (`1534–1536`).
- F-11: `updateProjectPageField` only changes the row (`2219–2226`); slug input `2325–2333`; no propagation to cards. Only temp→real slug propagation exists (`2067–2110`).
- F-12: Pages list rows only delete (`4978–5045`); card rows only reorder/edit/delete (`ProjectManager.tsx:258–302`); only top-bar View Live (`4535–4551`) and "Edit linked page" (`2394–2424`) exist. Desktop View Live ignores `profile.status`; mobile Go Live checks it (`1468–1476`). Unlinked cards fall back to their own slug (`2015–2031`), which the public route rejects unless referenced (`projects/[slug]/page.tsx:18–56`).
- F-34: `isPublished` is only displayed as a badge (`5018–5021`); no control writes it.
- F-46: `preview` is voided in Editorial (`EditorialMarketingTemplate.tsx:230–231`); Classic does not intercept project links either. `ProjectPageView` has a preview-interception helper; the portfolio templates do not.

**Confidence:** all C except F-34 (confirmed dead control; intended behavior is a product decision).

## 4. Required Investigation

1. Inspect the current left-panel section manager, the section editor switch, plan locks (`isSectionLockedForFree`), and section safety caps (30).
2. Confirm which section types have fully working editors once created (contact/gallery/files).
3. Decide Undo/Redo scope with the user: implement real history or remove the controls. Inspect whether any history infrastructure exists (none found).
4. Trace every place a page slug is read (`linkedPageSlug`, `page_link` items, public route, previews) before changing propagation.
5. Confirm the intended View Page destination and behavior for cards vs content pages, drafts, Free plans and unpublished pages.
6. Decide whether `isPublished` should be user-editable or removed from the detail-route filter (product decision).
7. Inspect how preview links can be made inert without breaking normal public behavior; check `ProjectPageView`’s `preventPreviewNavigation` pattern.

## 5. Implementation Requirements

### F-06 — Section creation
- Add a section-add menu/button that creates Contact, Gallery and Files (and any other supported section that lacks creation UI), not only Custom.
- Reuse the existing editors and schemas; do not create new data models.
- Respect `FREE_ALLOWED_SECTIONS` (`free-sections.ts`): Free users must not create locked sections; show the same lock/upgrade pattern as the existing locked UI.
- Respect caps (30 sections) and insert before footer or in a predictable position.
- Persist via the normal save; ensure `new-…` ids remap correctly and the new section becomes selected.
- Empty sections should not render publicly until they have content, matching existing template behavior.

### F-10 — Undo/Redo
- Product decision required. If implementing:
  - Scope to Builder profile edits (sections, project pages, appearance, localized/contact links) with a bounded history stack, coalescing rapid typing, and redo invalidation on new edits.
  - Do not include network/server responses or undo across saves in a way that corrupts version state.
  - Add accessible labels/disabled states.
- If removing: remove the buttons and related strings; document the decision. Do not leave enabled no-op controls.

### F-11 — Slug rename propagation
- When a standalone page's slug changes, update every referencing card/item in the same save/transaction:
  - `content.linkedPageSlug` + top-level mirror,
  - `page_link` item `externalUrl`/`linkedPageSlug`,
  - any `linkedFromProjectId`/preview URL consumers.
- Detect collisions (unique slug per profile) before writing; surface a validation error.
- Keep the existing public URL behavior for unchanged pages.
- Update `activePage`/editor state if the currently edited slug changes.

### F-12 — View Page and View Live
- Add a clearly labelled **View Page** action for standalone pages and linked cards (list row and/or editor), opening `/u/{username}/projects/{slug}` in a new tab when the target is publicly resolvable.
- Disable with an explanatory tooltip when: draft portfolio, unpublished page (if F-34 is not solved), missing link, temp slug, or Free plan (project pages Pro-only).
- Align desktop View Live with mobile Go Live: warn/disable for drafts; do not silently open a 404.
- For cards, open the linked page slug when valid; otherwise disable or explain, not fall back to the card's own unreferenced slug.
- Keep `target=_blank` and secure rel attributes.

### F-34 — Page publish state
- Decide with the user:
  - **Option A:** add a publish/unpublish control for project pages and persist `isPublished` (with a save or dedicated action).
  - **Option B:** remove the `isPublished` filter from the public route and document that pages publish with the portfolio.
- Do not change public visibility without an explicit decision. If adding a control, ensure new pages default to the current behavior.

### F-46 — Preview navigation
- In Builder preview mode, intercept clicks on internal project links (and page links) and prevent navigation; show a small "Preview only" hint or no-op.
- Keep public behavior unchanged.
- Prefer a shared helper used by Classic and Editorial so the two templates do not drift. Do not use `dangerouslySetInnerHTML`.

### Constraints and edge cases
- No schema migration expected. If a schema change is needed for F-34, stop and request approval.
- Preserve existing uncommitted work; use the current editor conventions (FormCard, ItemCard, i18n keys).
- Mobile drawer/sheet behavior must remain; new actions must be reachable on mobile.
- Do not expand into template appearance work (Phase 4) or delete cleanup (Phase 2).

## 6. Security and Data Safety Considerations

- Every new server action must authenticate, authorize the specific page/profile and validate inputs; never trust ids.
- Slug changes must be scoped to the owner's profile and transactional.
- Do not expose draft/unpublished content via View Page.
- Do not change subscription rules; Free page creation remains blocked server-side.
- No production data manipulation; use staging/synthetic pages.

## 7. Testing Requirements

**Unit/integration:**
- Section-add handler respects plan locks and caps; creates correct `content` shapes for contact/gallery/files.
- Slug propagation updates all reference types and rejects collisions.
- View Page eligibility helper (draft/unlinked/Free/published) matrix.
- Publish-state decision: tests for chosen behavior; public route filtering regression.
- Preview interception helper prevents navigation only in preview.

**Manual (staging):**
- Add each restored section and save/reload; confirm editor and public rendering.
- Link card→page, rename slug, save/reload, click card.
- Draft/unlinked card View Live/View Page behavior.
- Preview clicks remain inside Builder.
- Undo/Redo chosen behavior.

Run verification commands only after approval; record outputs.

## 8. Definition of Done

- F-06: Contact/Gallery/Files can be created by eligible users and persist.
- F-10: Undo/Redo work or are removed per approved decision.
- F-11: slug rename keeps all links valid.
- F-12: View Page exists with correct eligibility; View Live cannot silently 404 for draft/unlinked cases.
- F-34: publish behavior is explicit and consistent.
- F-46: preview links do not navigate away.
- Tests/manual results recorded; no schema change without approval; user accepts.

## 9. Out of Scope

- F-09/F-18/F-19 (Phase 1), F-17/F-28/F-48/F-49 (Phase 2).
- F-07/F-35 (Phase 6).
- Editorial appearance/layout (Phase 4), Classic content fixes (Phase 5).
- F-27 template preview-state UX (Phase 7); only F-47 thumbnails belong to Phase 4.
- Performance work (Phase 8).

## 10. Completion Report Requirements

`progress/PHASE_03_IMPLEMENTATION_REPORT.md`, `PHASE_03_TEST_REPORT.md`, `PHASE_03_BLOCKERS.md`: document section creation UX, undo decision, slug propagation design, View Page/View Live matrix, publish decision, preview interception, tests/manual results, and any approved scope deviations.

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
