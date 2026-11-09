# Final Summary — Project Page Button Runtime Diagnostics

## Status: PARTIALLY COMPLETED

The exact runtime cause of the missing `View Project` CTA is **not yet proven**. This phase implemented the requested local-development instrumentation and did not apply another speculative resolver, persistence, or template change.

## What was delivered

A development-only diagnostic panel now reads the real Builder card editor state and the real deferred preview state, then reports:

- raw top-level and nested `content` link fields,
- target existence and `isPublished`,
- plan eligibility (`isFree`),
- resolver destination,
- Classic `hasProjectLinks` and Editorial `href` decisions,
- active template and the exact component path that owns the CTA,
- preview/editor staleness,
- actual DOM anchor presence, computed CSS, geometry, viewport intersection, and hit testing.

It also exposes `Top empty shadows content` and `Top/content type conflict` so the panel can distinguish stale field precedence from a missing destination.

## Files changed

| File | Change |
| --- | --- |
| `src/app/profile/builder/ProjectCardDiagnostics.tsx` | New dev-only panel, trace object, DOM probe, clipboard copy. |
| `src/app/profile/builder/ProjectManager.tsx` | Optional `onEditingCardChange` callback + effect mirroring `editingItem`. |
| `src/app/profile/builder/BuilderClient.tsx` | `CARD_DIAGNOSTICS_ENABLED` gate, `diagnosticCard` state, panel mount, exact preview props. |
| `src/app/profile/builder/LivePreview.tsx` | Production-gated `data-builder-preview-surface` / `data-builder-preview-template` attributes for the DOM probe. |

No database, Prisma, SQL, migration, seed, deployment, dependency, environment, Git, or browser-automation operation was performed. No customer data was accessed.

## Required reports

- `audit-reports/project-page-button-runtime-diagnostics/DIAGNOSTIC_IMPLEMENTATION.md`
- `audit-reports/project-page-button-runtime-diagnostics/ACTUAL_RUNTIME_TRACE.md`
- `audit-reports/project-page-button-runtime-diagnostics/EDITOR_PREVIEW_COMPARISON.md`
- `audit-reports/project-page-button-runtime-diagnostics/ROOT_CAUSE.md`
- `audit-reports/project-page-button-runtime-diagnostics/MANUAL_USER_INSTRUCTIONS.md`
- `audit-reports/project-page-button-runtime-diagnostics/PREVIOUS_FIXES_REVIEW.md` (extra history review)
- `audit-reports/project-page-button-runtime-diagnostics/FINAL_SUMMARY.md` (this file)

`FIX_REPORT.md` was **not** created because no evidence-based fix was implemented.

## Verification

Targeted checks were run after explicit approval:

- `npx tsc --noEmit`: passed (no diagnostics).
- `npx vitest run __tests__/project-card-cta.test.ts __tests__/current-bug-fixes.test.ts`: 2 files passed, 14 tests passed.

These checks verify the diagnostic wiring compiles and that the existing synthetic resolver/real-template CTA tests still pass. They do **not** prove the live Builder runtime; manual trace remains mandatory. Lint/full-suite/build were not run in this phase.

## Source-level candidate defects (to confirm, not yet fixed)

1. **Target page unpublished** — resolver intentionally returns `null`; the main save path does not persist `isPublished`, so the visible publish toggle may not repair the database value.
2. **Free/suspended plan** — `isFree` suppresses all internal page CTAs; canceled subscriptions are reported as `SUSPENDED`.
3. **Empty top-level slug shadows content slug** — `linkedPageSlug ?? content.linkedPageSlug` does not fall back when the top-level value is `''`.
4. **Temp target slug survives in `content`** — client remap updates only the top-level field; `getOrCreateProfile` rebuilds it from `content` after reload.
5. **Deferred preview mismatch** — persistent `Preview stale: yes` means stale preview state, not a resolver failure.
6. **Template branch mismatch** — Editorial's lazy chunk can render Classic briefly; persistent mismatch is a different problem.
7. **CSS/layout** — the panel's DOM probe can prove or eliminate hidden/zero-size/covered anchors.

See `ROOT_CAUSE.md` for file/line references and the exact decisive trace values.

## Completion rule

This task stays `PARTIALLY COMPLETED` until the user runs the manual trace and the real Builder UI, save/reload flow, published portfolio, and CTA click-through are confirmed. Do not treat this report as proof that the bug is fixed.
