# Editorial Marketing Template — Test Report

Date: 2026-11-07 · Status: **written, NOT YET EXECUTED** — per workflow, no test runner/linter/typechecker is executed until explicitly approved. Run with:

```bash
npx vitest run __tests__/template-entitlements.test.ts
npx tsc --noEmit
npx eslint src/lib/templates.ts src/lib/entitlements.ts \
  src/components/portfolio/templates/EditorialMarketingTemplate.tsx \
  src/app/profile/builder/TemplatePickerModal.tsx \
  src/app/profile/builder/LivePreview.tsx \
  src/components/admin/BuilderPreviewClient.tsx \
  src/app/profile/builder/BuilderClient.tsx \
  src/app/u/[username]/page.tsx \
  src/lib/actions/portfolio.ts \
  src/lib/portfolio.ts src/lib/portfolio-schema.ts \
  __tests__/template-entitlements.test.ts
```

(No Playwright / browser automation, per constraints. Vitest node environment with hoisted Prisma/auth/subscription mocks — same pattern as `__tests__/portfolio-save-items.test.ts`.)

## Coverage map to the required 12 scenarios

| # | Required scenario | Covered by |
| --- | --- | --- |
| 1 | Classic default + fallback | resolver tests: `undefined/null/''/junk/42` → `classic`; appearance without key → classic; legacy `theme:'warm'` stays Classic (no hidden template switch) |
| 2 | Pro can select editorial | `canUseTemplate` ACTIVE/GRACE → true; `updatePortfolio` persists `template:'editorial-marketing'` and returns success |
| 3 | Free cannot activate | `canUseTemplate` NONE/EXPIRED → false; `updatePortfolio` → `{success:false, code:'PRO_TEMPLATE_REQUIRED'}` |
| 4 | Crafted requests cannot bypass | save-guard receives the RAW `appearance.template` before zod parsing: `EDITORIAL-MARKETING` and family aliases rejected; schema drops non-canonical strings from the persisted JSON |
| 5 | Subscription lookup failure | `getEntitlements` rejects (existing test + repeated here); `updatePortfolio` returns failure and never reaches `$transaction` → stored template untouched |
| 6 | Preview does not persist | preview is builder React state (`previewTemplateId`) only flowing into `LivePreview.templateOverride`; no save code path involved (component-level, verified manually; modal logic is free of persistence calls) |
| 7 | Apply changes only `appearance.template` | save test asserts `tx.userProfile.update` data keeps `defaultColorMode`/`accentColor` while adding `template`; sections/projects payload untouched test |
| 8 | Switch back to Classic preserves appearance | Free user switching back → success; other keys intact |
| 9 | Projects/pages/attachments/videos/links intact | sections/projects write-path test asserts content rows are written exactly as received; no delete/migration exists in the feature |
| 10 | Public rendering selects correct template | `resolveTemplateFromAppearance` matrix + the route branch (`templateId === 'editorial-marketing' && component loaded`) |
| 11 | Invalid values fall back to Classic | resolver + renderer allow-list tests |
| 12 | Arabic/English + RTL/LTR | `getPortfolioLang` baseline (ar via `n`/`defaultLanguage`; en fallback); template renders `dir`/`lang` per resolution; `pickLang` bilingual helpers on every content field |

Additional: save with `expectedVersion` bumps version via guarded `updateMany` (no destructive overlap with optimistic concurrency).

## Pending execution results

To be filled in after the approved run: vitest pass/fail counts, `tsc --noEmit` exit status, eslint findings. Nothing in this file claims passing status until then.
