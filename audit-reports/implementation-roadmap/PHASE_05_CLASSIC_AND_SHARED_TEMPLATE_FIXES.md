# Phase 5 — Classic and Shared Template Fixes

## 1. Objective

Fix confirmed Classic content/link defects and make project detail pages coherent with the selected portfolio template, without regressing Classic or the completed Editorial design contract.

## 2. Scope and Finding IDs

- **F-13 (High):** Classic testimonials without a photo are invisible.
- **F-14 (High):** Classic contact-section phone/WhatsApp links are malformed; contact icons fall back incorrectly.
- **F-16 (High):** project detail pages always render Classic styling/palette, even for Editorial portfolios.
- Investigate cross-template regressions discovered during Phases 3–4. Document new findings separately; do not silently expand scope.

## 3. Current Evidence

**Audit references:** `TEMPLATE_CLASSIC_AUDIT.md` §2; `TEMPLATE_EDITORIAL_AUDIT.md` §2 (F-16), §5; `CROSS_SYSTEM_INTEGRATION_AUDIT.md` §2–§4; `MASTER_FINDINGS.md` rows F-13/F-14/F-16.

**Confirmed evidence:**
- F-13: `TestimonialsSlider.tsx:51–56` filters to items with `photoUrl` and returns `null` if none; Classic decides to render the slider based on the **unfiltered** `testimonialItems.length > 0` (`ClassicTemplate.tsx:1329–1333`). New testimonials seed `photoUrl: ''` (`TestimonialsEditor.tsx:25–37`).
- F-14: `ContactEditor.tsx` stores `type/value/label` only; Classic builds href with `https://{value}` for non-http/non-@ values (`ClassicTemplate.tsx:1789–1800`), so `+2010…` becomes invalid. Icon selection `getSocialIcon(platform) || getContactIcon(platform)` (`1803`) never reaches the contact fallback because `getSocialIcon` returns a Globe default.
- F-16: `ProjectPageView.tsx:126–170` derives Classic appearance colors/fonts and uses Classic classes; the detail route (`u/[username]/projects/[slug]/page.tsx:123–126`) never resolves `appearance.template`.
- F-30 (Phase 4) changes the shared footer icon selection; this phase must verify the shared helper in Classic and avoid duplicating the fix.

**Confidence:** F-13 C; F-14 C; F-16 C (design intent for the detail skin requires approval).

## 4. Required Investigation

1. Re-read the Phase 4 output: confirm the Editorial appearance/design tokens and any shared icon helper changes.
2. Inspect every Classic testimonial render path, including the fallback empty state and builder preview.
3. Enumerate contact link types and their valid URL forms; inspect `sanitizeUrl`/`normalizeWhatsappNumber`.
4. Inspect `ProjectPageView` appearance resolution, route guards, and how Classic/Editorial links reach it.
5. Confirm which project-detail elements are template-agnostic vs Classic-specific (header, back button, item cards, footer).
6. Identify expected behavior for Editorial detail pages (full skin vs shared neutral page) and get approval before a redesign.
7. Search for cross-template regressions from Phase 4 (e.g. recipe changes affecting Classic).

## 5. Implementation Requirements

### F-13 — Photo-less testimonials
- Decide and implement the intended presentation:
  - Render text-only testimonial cards when no photo exists (preferred; keeps content visible), or
  - Keep the photo carousel only if every visible item has a photo, and show a clear fallback/empty state for text-only cases.
- Do not require customers to upload a photo to see their quote. Do not invent an avatar.
- Render the same filtered/visible set in the empty-state decision.
- Preserve existing photo-slider behavior and lightbox for photo items.
- Consider the builder preview (should match public).

### F-14 — Contact hrefs and icons
- Normalize hrefs by `type`:
  - `email` → `mailto:`,
  - `phone` → `tel:` (digits/+),
  - `whatsapp` → `https://wa.me/{international digits}`,
  - `website`/social → `sanitizeUrl`,
  - never prefix `https://` onto a phone value.
- Use the saved label first; show the value as fallback. Do not overwrite labels.
- Icon selection: prefer contact icons for email/phone/whatsapp, then social icons, then Globe. Ensure the fallback chain is reachable.
- Apply the same rule to the shared footer helper if users see the same defect there (coordinate F-30, Phase 4).
- Sanitize all URLs; do not allow `javascript:`; preserve external-link rel attributes.

### F-16 — Project detail presentation
- Product decision required:
  - **Option A:** Add an Editorial project-detail skin using the Phase 4 template tokens (preferred for coherence). Keep Classic exactly as today.
  - **Option B:** Keep detail pages Classic and make that an explicit product statement (e.g. picker note); no silent mismatch.
- If A, extract/derive appearance tokens from the resolved template in the detail route and apply an Editorial wrapper to `ProjectPageView` or a parallel presentational layer. Avoid duplicating data fetching.
- Preserve: published/Pro/reference guards, back-button labels, item link semantics, video/attachment viewer links, RTL, accessibility.
- Do not duplicate project data or add a second route.
- If B, add a clear note and do not change behavior.

### Cross-template regression checks
- Compare Classic portfolio and detail pages before/after Phase 4 changes.
- Verify free section stripping, project link gating, RTL, and template guard remain intact.
- Document any new defect found outside scope; do not fix silently.

### Constraints/edge cases
- No schema/migration.
- Do not re-skin Classic; existing customers must remain pixel-identical except the intended testimonial/contact fixes.
- Testimonials with mixed photo/no-photo, empty text, long text.
- Contact values with spaces, `00` prefix, plus sign, bare domains, invalid schemes.
- Detail pages for published/unpublished/legacy pages; Free vs Pro.

## 6. Security and Data Safety Considerations

- No fabricated testimonials or avatars.
- URL normalization must keep scheme allow-listing and `rel="noreferrer"`.
- Detail route must retain Pro/published/reference authorization.
- No customer content changes; presentation only.
- No production DB operations.

## 7. Testing Requirements

**Unit:**
- Contact href matrix (email/phone/whatsapp/website/invalid) and icon selection.
- Testimonial filter/empty-state logic with 0/1/N items, photo/no-photo mixtures.
- Detail-page template resolver (Classic vs Editorial) and appearance token selection.
- Access guards regression (published/Pro/reference).

**Manual (staging):**
- Classic portfolio with text-only testimonials (public + preview).
- Contact section with each type; click links; inspect icons.
- Editorial portfolio → project card → detail page; compare design and links.
- RTL/AR and mobile layouts.
Run tests/checks only after approval.

## 8. Definition of Done

- F-13 fixed without inventing content/avatars.
- F-14 hrefs/icons correct for all types; shared helper verified in Classic.
- F-16 behavior approved and implemented; Classic detail pages unchanged if V1 required.
- No cross-template regressions; new findings documented.
- Tests/manual recorded; user accepts.

## 9. Out of Scope

- F-01/F-02/F-03/F-04/F-05/F-08/F-15/F-20–F-26/F-29/F-30/F-33/F-36/F-37/F-39/F-45/F-47 (Phase 4, except shared helper verification).
- F-07/F-35 (Phase 6), F-27/F-31/F-32/F-38 (Phase 7), F-40–F-44 (Phase 8).
- F-06/F-10/F-11/F-12/F-34/F-46 (Phase 3).
- F-17/F-28/F-48/F-49 (Phase 2).

## 10. Completion Report Requirements

`progress/PHASE_05_IMPLEMENTATION_REPORT.md`: Classic fixes, detail-page decision/implementation, shared helper coordination, regression findings.
`PHASE_05_TEST_REPORT.md`: href/icon/testimonial/detail tests, manual results, Classic pixel/behavior checks.
`PHASE_05_BLOCKERS.md`: design/policy decisions (detail skin), cross-template issues, anything deferred.

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
