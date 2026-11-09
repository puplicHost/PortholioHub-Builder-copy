# Audit Scope and Limitations

## 1. Instructions and skills actually read

- Project instructions: `/home/abdelrhman/.config/opencode/AGENTS.md` (global) applied by the harness; repository has no `AGENTS.md`/`CLAUDE.md` at root (`glob` checked).
- Skill directories were present under `.agents/skills/`. The two loaded and applied for this audit were:
  - `nextjs` — used for App Router Server/Client boundaries, dynamic imports of Client Components from Server Components, Server Action exposure assumptions, and the detected versions (**Next 16.4.5, React 19.2.4** from `package.json`; `next.config.ts` uses `output: 'standalone'`).
  - `security-audit` — used for evidence-before-report discipline, object-level authorization (IDOR), mass assignment, entitlement boundaries, and explicit confidence labelling.
- Additional skills listed in the request (`vercel-react-best-practices`, `frontend-design`, `ui-design`, `prisma-orm-setup`, `supabase-postgres-best-practices`, `supabase`, `data-visualization`) were **not loaded**; the project instruction caps a single session at two skills. The performance/UX review therefore relied on direct source analysis and the Next.js skill’s guidance rather than those frameworks. This is a stated limitation, not an implied review.

## 2. Repository and revision

- Audited directory: `/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/My SaaS/PortholioHub-Builder-copy`
- Git baseline: commit `7c1d08f` plus the **uncommitted working tree**, which includes the Editorial Marketing implementation (`src/lib/templates.ts`, `EditorialMarketingTemplate.tsx`, `editorial.module.css`, `TemplatePickerModal.tsx`, entitlement/schema changes, route wiring) and unrelated uncommitted UI edits across the repo.
- The audit treats the working tree as the current product. Uncommitted changes were not reverted, staged, or modified.
- `git status`/`git diff` were used only to understand the current revision and the scope of in-progress work.

## 3. Files and areas inspected (primary)

### Builder and actions
- `src/app/profile/builder/BuilderClient.tsx`
- `src/app/profile/builder/ProjectManager.tsx`
- `src/app/profile/builder/ThemeSettings.tsx`
- `src/app/profile/builder/TemplatePickerModal.tsx`
- `src/app/profile/builder/LivePreview.tsx`
- `src/app/profile/builder/SectionManager.tsx` (confirmed dead/unimported)
- `src/app/profile/builder/ClientsEditor.tsx`, `ContactEditor.tsx`, `TestimonialsEditor.tsx`, `GalleryEditor.tsx`, `FilesEditor.tsx`
- `src/app/profile/builder/i18n/dictionaries.ts`, `BuilderI18nContext.tsx`
- `src/lib/actions/portfolio.ts`
- `src/lib/portfolio-schema.ts`, `src/lib/portfolio.ts`, `src/lib/free-sections.ts`, `src/lib/section-visibility.ts`
- `src/lib/entitlements.ts`, `src/lib/subscriptions.ts`, `src/lib/visibility.ts`
- `src/lib/templates.ts`, `src/lib/project-card-visuals.ts`, `src/lib/portfolio-language.ts`, `src/lib/urls.ts`, `src/lib/whatsapp.ts`, `src/lib/cloudinary.ts`, `src/lib/experience-dates.ts`

### Templates and public rendering
- `src/components/portfolio/templates/ClassicTemplate.tsx`
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`
- `src/components/portfolio/templates/editorial.module.css`
- `src/components/portfolio/ProjectCard.tsx`, `PortfolioFooter.tsx`, `TestimonialsSlider.tsx`
- `src/app/u/[username]/page.tsx`
- `src/app/u/[username]/projects/[slug]/page.tsx`, `ProjectPageView.tsx`
- `src/components/admin/BuilderPreviewClient.tsx`
- `src/app/layout.tsx`, `src/app/globals.css` (responsive contract and language/dir)

### Media, API, schema
- `src/app/api/files/r2/[id]/route.ts`, `.../[id]/content/route.ts`, `.../presign/route.ts`
- `src/app/portfolio/viewer/[fileId]/page.tsx`, `FileViewer.tsx`
- `src/app/api/portfolio/track/route.ts`
- `prisma/schema.prisma` (User/Profile/Page/Section/ProjectPage/Item/MediaFile/Subscription snippets)
- `__tests__/*.test.ts` inventory and key test bodies (`features-v2`, `portfolio-save-items`, `entitlements`, `clients-section`, `template-entitlements`)
- `audit-reports/second-template/*` (prior audits) for context, not as evidence of current behavior.

## 4. Important code paths traced

1. Builder input → state (`updateProfile` = setProfile) → save payload → `updatePortfolio` → Prisma transaction → reload hydration (`getOrCreateProfile`) → Builder preview → public `getPublicProfile` → template resolver → Classic/Editorial → project detail route.
2. Project card ↔ standalone page: `content.linkType/linkedPageSlug` → hydrate → link/unlink UI → save → public link resolution → detail route reference check.
3. Template selection: `appearance.template` → resolver → Pro guard → save → public selection → admin preview → builder preview override.
4. Appearance: `ThemeSettings` → `appearance.*` → Classic CSS variables / Editorial (ignored) → project page Classic palette.
5. Free/Pro: subscription state → entitlements → save filtering → public stripping → detail-page gate → template activation gate.
6. Media: upload presign → quota/MIME checks → R2 object → viewer/content auth → project item link resolution → inline video source restriction.
7. Save reliability: dirty snapshot, local draft, optimistic version bump, conflict modal, in-flight state replacement.
8. Deletion: section server-first; page server-first + link cleanup; card local + omission-based deletion.
9. Migrations on read: section dedupe/insertion inside `getOrCreateProfile`.

## 5. Existing tests inspected (not executed)

Inventory: 18 test files under `__tests__/` (including the two untracked files from the in-progress work). Key relevant coverage:
- `features-v2.test.ts` — project-card link/extra-link logic simulation; template file assertions.
- `portfolio-save-items.test.ts` — `updatePortfolio` project item save/omission with mocked Prisma.
- `entitlements.test.ts` — paid/free states; DB-error propagation.
- `clients-section.test.ts` — clients schema/visibility/default settings.
- `template-entitlements.test.ts` (untracked) — resolver, entitlement guard, schema hygiene, save-only-template assertions (20 tests per file).
- `inline-video.test.ts`, `attachment-persistence.test.ts`, `experience-reordering.test.ts`, `portfolio-schema.test.ts`, `subscription-actions.test.ts`, `subscription-permissions.test.ts` — adjacent behavior.

**No test was executed.** No pass/fail claims are made.

## 6. Commands executed

Read-only inspection only:
- `ls`, `find`, `glob`, `wc`
- `grep`, `rg`-style searches via `grep`
- `sed`, `head`, `tail`, `cat -A` (whitespace inspection)
- `git status`, `git diff`, `git log`, `git show` (read-only history comparisons)
- `node -e` reading `package.json` versions

No shell command wrote to the repository except the creation of the required report files under `audit-reports/comprehensive-system-audit/` (the audit deliverable). No source file, test, schema, migration, lockfile, or config was changed.

## 7. Commands intentionally NOT executed

- `npm/npx vitest`, `tsc`, `eslint`, `next build`, `next dev` — per project rule, verification requires explicit human approval; also not needed to establish source behavior.
- Any Prisma migration/generate/query, SQL, seed/reset/truncate, or DB connection.
- Playwright/browser automation/screenshot tooling.
- Dependency installation/upgrade.
- Deployment or production configuration changes.
- Production logs/customer-data access.

## 8. Areas not verified / unavailable context

1. **No runtime rendering.** No browser was used; responsive, contrast, focus, screen-reader, hydration and actual layout behavior remain manual (see checklist).
2. **No test/build execution.** TypeScript/build/lint status and test results are unknown.
3. **Legacy data shapes.** Strict zod content schemas may reject legacy unknown keys; without staging data samples it is not possible to know which real rows would fail a save. Flagged as a data-migration risk, not a confirmed defect.
4. **Server Action endpoint exposure (F-19).** Next.js registers exported async functions in `'use server'` modules as actions; whether an *unimported* export is reachable in the deployed build must be confirmed at runtime. Mass assignment itself is confirmed.
5. **Reference fidelity.** The supplied reference package (`local/2template/`) contains only `index.html`, `style.css`, `main.js`; its `assets/` (profile image, CV, logos) and six case-study HTML files are absent. The Hero comparison relies on the reference markup/CSS, not screenshots.
6. **Admin, payment, auth, CI/CD** are outside the deep scope. No claims are made about them.
7. **Subscription semantics.** Whether SUSPENDED should revoke access before `expiresAt` is a product decision; the code behavior is documented but intent was not confirmed.
8. **Database target.** No DB was contacted; nothing in this audit proves or implies the configured `DATABASE_URL` is isolated or production.
9. **Skills not loaded** (listed above) is a scope limitation for design-system and Prisma guidance.

## 9. Attestations

- No application source modified.
- No schema or migration modified.
- No database reads/writes/migrations.
- No customer data accessed.
- No deploy.
- No Playwright/browser automation.
- Existing reports were not overwritten; this audit created a new directory: `audit-reports/comprehensive-system-audit/`.
