# Current Bug Fixes — Implementation Report

**Date:** 2026-11-07 · **Scope:** Issues A–G · No Git, database, migrations, deployments or dependency changes.

## Issue A — Internal project-page card button
- **Root cause:** destination handling was duplicated and slug-only. The card editor's page selector updated `linkedPageSlug` without explicitly asserting `linkType='page'`, and the shared resolver accepted only a canonical slug. A persisted card carrying a page id (legacy/imported data), a `/projects/slug` path, or a stale `linkType` therefore resolved to no destination, so the renderer emitted no button. It affected both templates because both relied on the same incomplete contract.
- **Fix:** added `src/lib/project-card-links.ts` with `resolveProjectCardDestination()`. Both templates now use it. It accepts top-level or `content` link fields, resolves page ids and `/projects/slug` values to the canonical slug, requires a real slug and an existing published target when the page list is available, and preserves Pro/internal-page and Free restrictions. The card editor now also asserts `linkType='page'` when a page is selected. `updatePortfolio` normalizes a legacy page id to its slug before persisting.
- **Behavior:** internal page → `/u/{username}/projects/{slug}`; external → stored URL; missing/unpublished/temp/Free page → no dead CTA. Video behavior untouched.
- **Tests:** `current-bug-fixes.test.ts` covers internal (top-level + content), id/path normalization, external, missing, unpublished, temp, Free, and invalid schemes. `portfolio-save-items.test.ts` verifies the server persists the canonical page slug.

## Issue B — WhatsApp icon
- **Root cause:** Editorial floating action used generic `MessageCircle`.
- **Fix:** replaced with the WhatsApp brand SVG already used by Classic; accessible label `WhatsApp`; no dependency.
- **Classic:** already used the brand SVG; verified unchanged.

## Issue C — Live preview not switching after Apply
- **Root cause:** `handleApplyTemplate` saved the new template through `handleSaveChanges`, which reconciles against the latest client state; the latest state still contained the old template, and the subsequent local state could retain it. Preview override was then cleared, so the canvas showed the old saved template.
- **Fix:** after a successful apply, set the selected template explicitly on the latest local state before clearing the preview override. Added `resolvePreviewTemplateId()` for saved-vs-preview resolution and tests for repeated switching.
- **Preview-only:** selection still only feeds `LivePreview.templateOverride`; Apply persists through the existing save path.

## Issue D — Footer credit
- **Fix:** shared Classic/PortfolioFooter credit now reads “Developed by Portfolio Hub” (Arabic: “تم التطوير بواسطة Portfolio Hub”) and links to the existing `https://portfolio-hub.online` destination. Editorial homepage and new Editorial detail footer include the same credit with template styling and RTL support.

## Issue E — Analytics performance
- **Root causes found by source analysis:**
  1. `getPortfolioAnalytics` used `requireUserWithWorkspace`, an unnecessary workspace lookup/mutation for a read-only page.
  2. The page called `requireUser()` and then the action called the workspace-based auth again.
  3. The 30-day event window loaded every event row and aggregated totals/projects/countries in JS.
- **Fix:** use `getCurrentUser` only; remove duplicate page auth; aggregate totals, project views and countries with `groupBy`/`count`; fetch only `createdAt` for the daily trend. Same metrics/windows/semantics preserved.
- **No measurement:** no safe baseline could be collected without database/browser access. No performance improvement is claimed numerically.

## Issue F — Project detail template consistency
- **Fix:** added `EditorialProjectDetail.tsx`, selected by the existing resolver inside `ProjectPageView`. It reuses the same project page/items, access checks and route; provides an Editorial header, typography, cards, file/video/attachment links, footer credit and RTL support. Classic detail pages remain untouched.
- **No content/policy changes:** switches presentation only; no project or appearance data is rewritten.

## Issue G — Integration
- Shared destination resolver + template resolver now govern the card CTA and detail presentation. Tests cover destination resolution and template selection; manual staging remains for the full click-through.

## Files changed
- `src/lib/project-card-links.ts` (new)
- `src/lib/editorial-appearance.ts` (new)
- `src/components/portfolio/templates/EditorialProjectDetail.tsx` (new)
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`
- `src/components/portfolio/templates/editorial.module.css`
- `src/components/portfolio/templates/ClassicTemplate.tsx`
- `src/components/portfolio/PortfolioFooter.tsx`
- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx`
- `src/app/profile/builder/BuilderClient.tsx`
- `src/app/profile/builder/LivePreview.tsx`
- `src/lib/actions/portfolio.ts`
- `src/app/profile/builder/analytics/page.tsx`
- `src/lib/templates.ts`
- `__tests__/current-bug-fixes.test.ts`
- `__tests__/current-bug-analytics.test.ts`

## Compatibility
No schema/migration, no customer content, no appearance reset, no subscription change, no storage/video change.
