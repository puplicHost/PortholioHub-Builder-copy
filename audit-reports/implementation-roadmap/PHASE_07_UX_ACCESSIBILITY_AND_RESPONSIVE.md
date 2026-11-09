# Phase 7 — UX, Accessibility and Responsive Quality

## 1. Objective

Make template preview/apply states predictable, correct type and seed drift, resolve footer link-source ambiguity, and close the remaining user-facing accessibility/responsive gaps after functional fixes are complete.

## 2. Scope and Finding IDs

- **F-27 (Medium):** preview state is invisible outside the modal; Apply saves pending edits although copy says template-only; Active badge reflects preview.
- **F-31 (Low):** stale `Appearance.template` union and unused `TemplateId` import.
- **F-32 (Low):** seed values (`theme:'classic-dark'`, `font:'cairo'`) mismatch UI vocabulary/types.
- **F-38 (Medium):** footer editor prefers `profile.contactLinks` even when empty; can hide/overwrite legacy footer links.
- **UX follow-ups derived from the audit (not new F-IDs):**
  - repeated identical project link names for screen readers,
  - Editorial drawer lacks Escape/outside-click close,
  - numeric contrast verification,
  - general keyboard/focus consistency across Builder and templates.

Do not re-fix findings owned by earlier phases. If a regression is found, document it and coordinate with the owning phase.

## 3. Current Evidence

**Audit references:** `UX_ACCESSIBILITY_PERFORMANCE_AUDIT.md` §1–§4, §6; `BUILDER_FUNCTIONAL_AUDIT.md` §3.2; `TEMPLATE_EDITORIAL_AUDIT.md` §3, §7; `MASTER_FINDINGS.md` rows F-27/F-31/F-32/F-38 and UX notes.

**Confirmed evidence:**
- F-27: `BuilderClient.tsx:1406–1422` applies via full snapshot; `4424` passes `previewTemplateId ?? saved` as `currentTemplate`; preview override cleared only by Apply/Done; no persistent indicator.
- F-31: `src/lib/portfolio.ts:5` imports `TemplateId`; line 112 still declares `'classic-dark' | 'minimal-light' | 'arabic-pro'`.
- F-32: new profile seeds `theme:'classic-dark'`, `font:'cairo'` (`actions/portfolio.ts:320–329`); ThemeSettings option uses `Cairo`.
- F-38: `footerLinks = profile.contactLinks || c.links || []` (`BuilderClient.tsx:4130–4135`); empty arrays are truthy; editor writes both sources.
- UX: repeated "View case study"/"View project" link names; Editorial drawer only toggles via button (`editorial:615–631`); Classic menu has Escape/outside patterns to reuse.

**Confidence:** all C; contrast and screen-reader impact require manual verification.

## 4. Required Investigation

1. Re-read Phase 4/3 outcomes to avoid duplicating template picker/nav fixes.
2. Decide F-27 semantics with the user:
   - Apply only the template key (and leave pending edits unsaved), or
   - Save all pending edits intentionally and update copy to say so.
   Whatever is chosen, implement it literally and show it before the action.
3. Inspect `Appearance` type consumers, schema, seeds, and any serialized assumptions before changing the union.
4. Inspect footer data for legacy rows (synthetic) to confirm source preference behavior.
5. Run a structured a11y review of both templates and Builder: link names, drawer Escape, focus order, keyboard traps, contrast (needs a tool), AR/EN direction.
6. Check existing i18n strings for preview/apply copy that must change.

## 5. Implementation Requirements

### F-27 — Preview/apply clarity
- Show a persistent, visible “Previewing {Template} — not saved” banner/chip in the Builder canvas while `previewTemplateId` is set; provide a one-click exit.
- Ensure the Templates modal Active badge reflects the **saved** template; show a separate Preview badge for the override.
- Make Apply behavior match the approved semantics:
  - If template-only: save only `appearance.template` against the latest saved state, do not commit pending content edits; warn if there are unsaved edits.
  - If save-all: label it clearly (“Apply and save all changes”) and document.
- Clear preview override on Apply, Done, or explicit exit; do not clear it silently on unrelated saves.
- Ensure a failed apply does not leave a misleading preview/applied state.

### F-31 — Type drift
- Update `Appearance.template` to the template registry type (`TemplateId`) and remove the unused import or use it.
- Search for consumers that assume the old union; update docs/types/tests.
- No runtime behavior change expected; verify build/type after approval.

### F-32 — Seed/defaults vocabulary
- Align seed values with the UI options (`Cairo`, valid `theme`/template semantics) without changing existing saved customers.
- Preserve backward compatibility for legacy lowercase font values in Classic’s loader; do not migrate data silently.
- Add/adjust a test for the seeded appearance shape if practical.

### F-38 — Footer link source
- Use `(contactLinks?.length ? contactLinks : footerLinks)`, not truthy-array preference.
- Decide one source of truth for edits; if keeping both mirrors, ensure they stay synchronized and the editor shows the effective list.
- Do not lose legacy footer-only links on first edit; test with synthetic rows.
- Keep public rendering behavior consistent.

### UX/a11y follow-ups
- Add project name to accessible names for repeated links (both templates): e.g. `aria-label={`${action}: ${title}`}`.
- Add Escape and outside-click close to the Editorial mobile drawer; restore focus to the toggle.
- Verify contrast for Editorial tokens and Classic palettes with a tool; record results. Fix only measured failures, not guesses.
- Keyboard pass: Builder tabs/modals/template picker, both templates’ nav/cards/contact/footer; ensure visible focus and logical order.
- RTL/LTR: check reading order, mirrored icons, drawer alignment; fix only confirmed issues.
- Do not use Playwright unless explicitly authorized; manual browser checks are allowed with approval.

### Constraints
- No schema/migration.
- Do not change Classic visual output except approved accessibility fixes.
- Do not re-litigate Phase 4 appearance decisions.
- Keep i18n EN/AR keys in sync.

## 6. Security and Data Safety Considerations

- Preview remains non-persistent; Apply must still enforce server entitlement checks.
- Do not expose draft/private links through accessibility labels.
- Footer edits must not overwrite unrelated contact links.
- No customer data migration; all footer/seed tests use synthetic staging.

## 7. Testing Requirements

**Unit:**
- Preview/apply state helper: badge source, override clearing, template-only vs save-all semantics (mock saves).
- Footer source selection with [], [links], both.
- Appearance type/seed assertions.
- Accessible-name helper for project links.
- i18n key parity EN/AR.

**Manual (staging, approved):**
- Preview → close → save → publish behavior.
- Apply with pending edits per chosen semantics.
- Footer legacy link display/edit.
- Screen reader link list; drawer Escape/focus; contrast tool results; RTL/LTR; keyboard-only pass.
Record commands/results; verification after approval.

## 8. Definition of Done

- Approved preview/apply semantics implemented and visibly communicated.
- Type/seed drift fixed without data migration.
- Footer links no longer hidden/overwritten.
- Measured a11y issues fixed; unverifiable items documented.
- Tests/manual results recorded; user accepts.

## 9. Out of Scope

- F-01–F-05/F-08/F-15/F-20–F-26/F-29/F-30/F-33/F-36/F-37/F-39/F-45/F-47 (Phase 4).
- F-13/F-14/F-16 (Phase 5); F-06/F-10/F-11/F-12/F-34/F-46 (Phase 3).
- F-07/F-35 (Phase 6); F-09/F-18/F-19 (Phase 1); F-17/F-28/F-48/F-49 (Phase 2).
- F-40–F-44 (Phase 8).

## 10. Completion Report Requirements

`progress/PHASE_07_IMPLEMENTATION_REPORT.md`: chosen preview/apply semantics, type/seed changes, footer source decision, a11y fixes.
`PHASE_07_TEST_REPORT.md`: unit results, manual preview/apply/footer/a11y/contrast/RTL checks, EN/AR parity.
`PHASE_07_BLOCKERS.md`: unverified contrast/screen-reader items, policy questions, anything deferred.

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
