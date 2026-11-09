# Phase 1 — Implementation Report

Status: implemented and verified locally. **No deployment.** No database change, no migration, no dependency change, no configuration change.

User approval: Option 3 (full Phase 1: accessibility + token unification + RTL cleanup + marketing consistency), with hard requirements to preserve existing customer appearance data exactly.

---

## 1. What changed

### 1.1 New token layer (`src/app/globals.css`)

| Token family | Light | Dark | Purpose |
|---|---|---|---|
| `--on-primary` | `#ffffff` | `#0e0e10` | label/icon color on brand fills |
| `--on-success` | `#ffffff` | `#052e16` | label on `--color-success` fill |
| `--on-warning` | `#ffffff` | `#1f1f23` | label on `--color-warning` fill |
| `--on-danger` | `#ffffff` | `#1f1f23` | label on `--color-danger` fill |
| `--color-toast-warning-bg/text` | `#b45309` / `#ffffff` | same | previously hardcoded in the Toast component |

Naming uses the `--on-*` prefix **on purpose**: the customer-portfolio family is `--color-on-primary` (defined per-profile by `ClassicTemplate` / `ProjectPageView` / used by `PortfolioFooter`). The different prefix guarantees the global tokens can never shadow or leak into the template family and vice versa.

### 1.2 Token value corrections

| Token | Before | After | Reason |
|---|---|---|---|
| `--ph-gray-text` (feeds `--color-text-secondary`), `--color-text-muted` light | `#7a7a7a` | `#6b6b70` | 4.29:1 on white / 3.94:1 on page → 5.30 / 4.87 (AA ≥4.5) |
| `--color-success` light | `#16A34A` | `#15803D` | white text on fill was 3.30:1 → 5.02:1; also fixes success-as-text (3.30 → 5.02) |
| `--color-warning` light | `#0066cc` (brand-blue drift) | `#b45309` | warning was visually identical to primary; amber restores semantic meaning and passes 5.02:1 with white labels |
| landing `--ink-muted` light | `#7a7a7a` | `#6b6b70` | same AA fix as app shell |
| landing `.landing-page[data-theme='dark']` `--on-primary` | (always `#ffffff` via base block) | `#0e0e10` | white on `#2997ff` was 3.02:1 → near-black ink 6.40:1 |
| HomePage `--text-muted` / `--ph-gray-text` / `--warning` | `#7a7a7a` / `#7a7a7a` / `#d97706` | `#6b6b70` / `#6b6b70` / `#b45309` | AA + semantic alignment; marketing identity otherwise untouched |

Dark-mode fills (`#4ADE80`, `#EFA820`, `#F87171`, `#2997ff`, `#0e0e10` page, `#18181b` surfaces) are **unchanged** — visual identity preserved; only the label colors on those fills became dark ink.

### 1.3 Components migrated to on-color tokens

- `src/components/ui/Button.tsx` — primary → `--on-primary`; success → `--on-success`.
- `src/components/ui/Toast.tsx` — solid fills now resolve `--color-toast-*-bg/text`; removed the hardcoded `style={{backgroundColor:'#16a34a'|'#dc2626'|'#d97706'}}` override entirely.
- App/builder/admin/analytics/marketing `text-white`-on-semantic-fill sites converted to `text-[var(--on-*)]`: `not-found.tsx`, `FileViewer.tsx`, `ConfirmModal.tsx`, `IconPicker.tsx`, `BuilderClient.tsx` (section chip + free-plan amber badge), `admin/page.tsx` (primary/danger/warning + amber-600 blocks + emerald/rose MOM chips), `admin/support/page.tsx` (primary CTA + amber/rose tinted labels), `AdminLayoutShell.tsx`, `AdminSidebar.tsx`, `UserTableClient.tsx` (rose-700 destructive → `--color-danger` + `--on-danger`), `MaintenanceToggle.tsx` (emerald-600 → success tokens), `PaymentActions.tsx` (same), `BuilderPreviewClient.tsx`, `NotificationBell.tsx`.
- `BuilderClient.tsx:4346` referenced `var(--on-primary)` which was previously **undefined** in the app scope (rendered via fallback/inherit with failing contrast `#272729` on `#0066cc`); it now resolves to the new token (white light / ink dark) — a latent bug fix.

### 1.4 Analytics unification (owner-facing only)

- `AnalyticsDashboard.tsx`: all `bg-[#2563eb]` fills → `bg-[var(--color-primary)]` with `text-[var(--on-primary)]`; `hover:bg-[#1d4ed8]` → `hover:bg-[var(--color-primary-hover)]`; chips (`bg-blue-50/dark:bg-blue-950`), the `#3b82f6` icon circle, hero cards (`text-blue-100/200` labels → `opacity-80`), and DeltaPill emerald/purple/rose chips → success/danger tokens. Removes the hardcoded second blue brand.
- `ViewsChart.tsx`: bar/focus/ring/dot/axis `#2563eb` → `--color-primary`; axis row `pl-10 pr-2 / md:pl-12 md:pr-4` → `ps-10 pe-2 / md:ps-12 md:pe-4`; tooltip `text-left` → `text-start`.
- `ProjectViews.tsx`: search input `pl-9 pr-4` → `ps-9 pe-4`; table `text-left` → `text-start`, all physical `pl-*`/`pr-*` cells → `ps-*`/`pe-*`, numeric headers `text-right` → `text-end`; `#2563eb` borders/bars → `--color-primary`.
- Analytics slate surfaces (`#f8fafc`, `#161b26`, `#0b0f17`, `bg-white`) retained as the dashboard's own designer aesthetic (component-local, per plan task B4).

### 1.5 RTL / LTR cleanup (C1)

- `ThemeSettings.tsx`: 6× `mr-1.5` → `ms-1.5` on mode-toggle icons.
- Analytics tables/search/tooltip: physical padding/alignment → logical (above). Arabic input `text-right` behaviors and `html[dir='rtl']` rules untouched.

### 1.6 Default-only portfolio palette fix (category B, approved)

`mutedText` default `#64748B` → `#54647A` in all four definition sites, kept perfectly consistent:

- `ClassicTemplate.tsx` fallback (`appearance.mutedText || '#54647A'`)
- `ProjectPageView.tsx` fallback
- `src/lib/actions/portfolio.ts` profile-creation defaults
- `ThemeSettings.tsx` "reset to defaults"

Impact: **only** portfolios where `mutedText` is missing/null, newly created profiles, and users who explicitly click reset. Every saved customer value passes through `appearance.mutedText ||` unchanged, and `validateProfileExtras` preserves raw appearance on parse failure (covered by test).

---

## 2. Contrast results (recomputed)

Format: `foreground on background` — before → after (threshold).

| Pair | Before | After |
|---|---|---|
| `#7a7a7a` on `#ffffff` (app/landing/home muted) | 4.29 FAIL | **5.30 PASS** (`#6b6b70`) |
| `#7a7a7a` on `#f5f5f7` (page) | 3.94 FAIL | **4.87 PASS** |
| white on light success `#16A34A` | 3.30 FAIL | **5.02 PASS** (`#15803D`) |
| white on light warning (was brand blue `#0066cc`/hardcoded `#d97706` 3.19) | 3.19 FAIL | **5.02 PASS** (`#b45309`) |
| white on light danger `#DC2626` | 4.83 PASS | unchanged PASS |
| white on dark primary `#2997ff` (app buttons + landing CTAs) | **3.02 FAIL** | **6.40 PASS** (`#0e0e10` ink) |
| white on dark `--accent-focus` `#4aa3ff` | 2.63 FAIL | **7.32 PASS** (`#0e0e10`) |
| white on dark success `#4ADE80` | 1.74 FAIL | **8.55 PASS** (`#052e16`) |
| white on dark warning `#EFA820` | 2.04 FAIL | **8.05 PASS** (`#1f1f23`) |
| white on dark danger `#F87171` | 2.77 FAIL | **5.94 PASS** (`#1f1f23`) |
| emerald-600 `#059669` with white (admin/builder buttons) | 3.77 FAIL | **5.02 PASS** (success token) |
| white on analytics `#2563eb` | 5.17 PASS | 5.57 PASS (`--color-primary` light) / 6.40 dark ink |
| portfolio default muted `#64748B` on `#F0F9FF` | 4.46 FAIL | **5.66 PASS** (`#54647A`; 6.03 on white) — default-only |
| text-muted light `#6b6b70` on landing `#f5f5f7` canvas-alt | 3.94 FAIL | **4.87 PASS** |

All AA assertions are re-checked in `__tests__/design-tokens.test.ts` at test time.

---

## 3. Customer appearance safety

- Global CSS defines **none** of the template token family (`--color-bg`, `--color-text`, `--color-muted`, `--color-on-primary`) — enforced by a regression test against `globals.css`.
- Template/project-page wrappers define their own tokens via inline style (nearest-ancestor wins); the new global `--on-*` names are different, so zero coupling.
- No SQL, no migration, no seed, no `Prisma` schema change, no deployment. `UserProfile.appearance` values are never written by this change.
- `validateProfileExtras` legacy/verbatim behavior covered in test (unknown fields + old saved colors round-trip unchanged).
- Deliberately untouched (documented): portfolio border defaults (`#BAE6FD`/`#4B5563` — changing them would alter default portfolio look; decorative non-text), `PortfolioBottomNav` gold `#D4A017` and `project-card-visuals.ts` category colors (customer-facing), `RadialGaugeCard` SVG series stroke `#2563eb` (presentation attribute cannot consume `var()`; chart-series color), decorative chart/hero colors.

---

## 4. Files changed (26)

`src/app/globals.css`, `src/components/ui/Button.tsx`, `src/components/ui/Toast.tsx`, `src/app/not-found.tsx`, `src/app/portfolio/viewer/[fileId]/FileViewer.tsx`, `src/app/profile/builder/ui/ConfirmModal.tsx`, `src/app/profile/builder/ui/IconPicker.tsx`, `src/app/profile/builder/BuilderClient.tsx`, `src/app/profile/builder/ThemeSettings.tsx`, `src/app/admin/page.tsx`, `src/app/admin/support/page.tsx`, `src/components/admin/AdminLayoutShell.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/admin/UserTableClient.tsx`, `src/components/admin/MaintenanceToggle.tsx`, `src/components/admin/PaymentActions.tsx`, `src/components/admin/BuilderPreviewClient.tsx`, `src/components/notifications/NotificationBell.tsx`, `src/components/home/HomePage.tsx`, `src/components/portfolio/analytics/AnalyticsDashboard.tsx`, `src/components/portfolio/analytics/ViewsChart.tsx`, `src/components/portfolio/analytics/ProjectViews.tsx`, `src/components/portfolio/templates/ClassicTemplate.tsx` (default only), `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` (default only), `src/lib/actions/portfolio.ts` (default only), plus new `__tests__/design-tokens.test.ts`.

## 5. Verification

- **Typecheck** `tsc --noEmit`: clean.
- **Tests**: design-tokens regression suite 26/26 pass. Full suite 137/139 pass. The 2 failures in `__tests__/features-v2.test.ts` (`wordSafeTruncate`, footerBg string assertions) are **pre-existing on HEAD** — `git show HEAD:src/.../ClassicTemplate.tsx` contains neither string (stale expectations from an earlier template refactor); unrelated to this work and untouched.
- **ESLint**: on the 25 touched files + test — 0 new errors/warnings introduced; all 8 errors found across the set pre-exist identically on HEAD (`no-explicit-any` in `ProjectPageView`, `set-state-in-effect` in `ClassicTemplate`/`BuilderClient`). Repo-wide baseline counts unchanged.
- **Production build** `next build`: succeeded; compiled CSS verified to contain the new token definitions in light+dark blocks, the dark landing `--on-primary`, and the generated `text-[var(--on-*)]`/`bg-[var(--color-toast-*)]` utilities.
- No server started, no Playwright, no production data touched, nothing deployed.

## 6. Remaining manual verification (founder, on staging)

1. Dark-mode + light-mode pass over Dashboard → Builder → Admin → Analytics: primary/danger/success/warning buttons and badges now use dark-ink labels in dark mode (brand fills unchanged) — confirm the look is acceptable.
2. Admin warning surfaces turn from blue → amber in light mode (semantic correction) — confirm.
3. Toasts: success/amber/error still readable; check `--on-primary`-based CTA in free-plan banner.
4. Arabic/English landing (`/`, `/en`) light & dark: CTA labels on bright blue become near-black in dark mode (Apple-style).
5. Public portfolio (with dark default mode) AA pass + a profile with **empty** `mutedText` to see the new default (5.66:1).
6. Analytics RTL check: Arabic dashboard tables align to the logical start side.

## 7. Deferred / notes

- Legacy aliases (`--ph-*`, `--card/--popover/--dropdown`) intentionally retained as value-aliasing to avoid regressions; canonical-name migration not yet needed by components.
- Border tokens (C4) intentionally narrowed to "documented, no global border change" to protect visual identity.
- `tsconfig.tsbuildinfo` (incremental cache) reverted to committed state after typecheck.
