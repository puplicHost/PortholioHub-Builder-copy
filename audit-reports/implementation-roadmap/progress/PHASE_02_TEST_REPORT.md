# Phase 2 — Test Report

## Commands executed
- `npx vitest run __tests__/phase2-profile-read.test.ts __tests__/phase2-project-id-aliases.test.ts __tests__/portfolio-save-items.test.ts __tests__/subscription-actions.test.ts __tests__/entitlements.test.ts __tests__/template-entitlements.test.ts`
  - **49 passed / 49**
- `npx tsc --noEmit`
  - **Passed** (after Phase 2 fixes)
- Full suite: `npx vitest run`
  - **171 passed, 2 failed** — both failures are pre-existing `features-v2` source-text assertions unrelated to Phase 2.

## Tests added
- `phase2-project-id-aliases.test.ts`: temp→real mapping, multiple cards, missing aliases.
- `phase2-profile-read.test.ts`: existing profile read performs no section create/delete/update; no implicit section insertion.
- `portfolio-save-items.test.ts`: deletion cleanup removes page links to a deleted row while preserving external links.

## Coverage
- F-17 alias resolution (unit).
- F-48 read purity (mock Prisma).
- F-28/F-49 server cleanup (mocked transaction).
- Regression: save items, entitlements, template guard.

## Not tested automatically
- Open card editor after save (component-level React behavior).
- Multiple new cards in one save with attachments/links.
- Legacy profiles missing sections on staging.
- UI card deletion and reload.

## Manual staging checklist
1. Create two new cards, save once, edit both without closing the forms.
2. Link card A to card B, delete B, save, reload; A's link must be cleared, external links preserved.
3. Rename a page slug (Phase 3 behavior), save/reload, verify links.
4. Open Builder on a legacy profile with duplicate/missing sections; confirm no writes and content unchanged.
5. Confirm Builder public cards and project pages resolve correctly in both templates.

## Lint
`npx eslint` on changed files reports only pre-existing errors/warnings (Builder URL-restoration effect; Classic/ProjectPageView existing rules). No new Phase 2 phase-specific error remains.
