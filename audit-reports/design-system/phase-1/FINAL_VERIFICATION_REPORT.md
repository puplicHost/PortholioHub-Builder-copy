# Phase 1 Global Color System — Independent Verification Report

**Audit date:** 2026-11-07
**Auditor:** Independent verification session (no source modifications made during audit)
**Baseline under review:** Working tree of commit `7c1d08f` ("update 6/11") — Phase 1 exists as **26 uncommitted modified files** (190 insertions / 116 deletions) plus 2 untracked new asset groups (`__tests__/design-tokens.test.ts`, `audit-reports/design-system/`). Pre-existing unrelated dirty state: `skills-lock.json` (skill installs) and untracked `.agents/skills/*` (unrelated to Phase 1).

---

## 1. Overall Verdict

**VERIFIED WITH MINOR ISSUES**

Every central claim of `IMPLEMENTATION_REPORT.md` was independently reproduced: the muted-text AA fix, the on-color token family, fill/label migration, toast solid tokens, RTL migration, customer-appearance isolation, and baseline-equivalent test results. Five small AA gaps remain, all documented in §13; none block staging.

**Final decision: A — Ready for staging verification** (with the §13 minor defects logged for Phase 2).

---

## 2. Executive Summary

- **Theme-token engine:** `src/app/globals.css` now defines one authoritative semantic system. New `--on-primary/--on-success/--on-warning/--on-danger` tokens: white ink in light (`:root:71–74`), near-black ink in dark (`html.dark,:172–175`). All recomputed ratios pass (`§6`).
- **Muted text:** `#7a7a7a → #6b6b70` in `globals.css:57`, `:105` and mirrored into the self-contained HomePage CSS (`HomePage.tsx:577`), landing `--ink-muted` (`globals.css:407`), HTML-page fallbacks. Old value failed AA (recomputed 4.29 on white, 3.94 on page bg); new passes (5.30 / 4.87).
- **Customer isolation (highest priority):** intact. The global family uses the `--on-*` prefix; the portfolio family stays `--color-on-*` and is computed per customer inside the template JSX. Saved appearance values are never overwritten; the new default reaches only genuinely missing values, explicitly invalid values, builder reset, and newly created portfolios.
- **Landing `/` vs `/en`:** identity now aligned at the value level — both marketing pages share the `#0066cc → #2997ff` accent family and the `#6b6b70` muted ink; implementation is via two scoped token systems (`.ph-home` self-contained vs `.landing-page` globals), a residual architectural duplication, not a visual divergence.
- **Tests:** design-token suite 26/26; full suite **137/139 — the 2 failures in `features-v2.test.ts` reproduce byte-for-byte at detached HEAD `7c1d08f`** (proven via a temporary detached worktree; both failures concern template content features (`wordSafeTruncate`, sectionBg hardcoding checks) that do not exist on HEAD and are unrelated to color).
- **Static checks:** `tsc --noEmit` exit 0. ESLint on all 25 changed TS/TSX files: 8 errors / 39 warnings — **zero new**; the identical 8 errors verified present at HEAD on the same four files (`BuilderClient.tsx`, `IconPicker.tsx`, `ProjectPageView.tsx`, `ClassicTemplate.tsx` — all `react-hooks/set-state-in-effect` / `no-explicit-any` in untouched regions).
- **Remaining minor AA gaps:** the new `opacity-80/75` hero-card labels on the analytics hero fail 4.5:1 in light mode (4.12 / 3.82) — the pre-change pattern also failed (4.24 / 3.64), so this is a lateral move, not a regression; a fix is trivial (opacity-90 / solid tokens) and is recommended for Phase 2.

---

## 3. Exact Changed-File Review

Verification method: full `git diff` of every modified file was read; each change classified.

| # | File | Class | Summary of change | Notes |
|---|------|-------|-------------------|-------|
| 1 | `src/app/globals.css` | **Approved Phase 1** | `--ph-gray-text` #7a7a7a→#6b6b70 (L57); on-color tokens light (L71–74) & dark (L172–175); toast solid fills `#15803d/#b45309/#dc2626` + white labels (L78–88, L190–200); `--color-success #15803D`, `--color-warning #b45309`, `--color-text-muted #6b6b70` (L103–109); `.landing-page` system with scoped `--on-primary` white/dark-ink (L402–454); dark CTA ink switch comment-verified 6.40:1 | One-line formatting defect at L409 (§13 D5) |
| 2 | `src/components/ui/Button.tsx` | Approved | Primary button label `text-[var(--on-primary)]` | Fill unchanged |
| 3 | `src/components/ui/Toast.tsx` | Approved | Solid fills resolved from `--color-toast-*-bg/-text` tokens | Removes hard-coded green/amber |
| 4 | `src/components/home/HomePage.tsx` | Approved | Scoped CSS mirrors new muted/warning values (L571–590); `--text-muted` #6b6b70, `--warning` #b45309 | Self-contained scope, no leakage |
| 5 | `src/components/landing/LandingPage.tsx` | Not modified | Landing tokens live in globals.css `.landing-page` scope; component untouched | Consistent with report |
| 6–7 | `src/app/admin/page.tsx`, `src/app/admin/support/page.tsx` | Approved | `text-white → text-[var(--on-primary)]`; amber/rose chips → `--color-warning/--color-danger` tints (support:404, 413) | |
| 8 | `src/app/not-found.tsx` | Approved | CTA label token; `rtl:-scale-x-100` arrow retained | |
| 9 | `src/app/portfolio/viewer/[fileId]/FileViewer.tsx` | Approved | Icon button label token (L129) | |
| 10 | `src/app/profile/builder/BuilderClient.tsx` | Approved | Free-plan banner + section rail: `--on-warning` / `--on-primary` (L4346, L5056) | Builder chrome only, not portfolio canvas |
| 11 | `src/app/profile/builder/ThemeSettings.tsx` | Approved | Reset palette default `mutedText '#54647A'` (L153); `mr-1.5 → ms-1.5` mode toggles (L227) | Reset is explicit user action |
| 12–13 | `src/app/profile/builder/ui/ConfirmModal.tsx`, `IconPicker.tsx` | Approved | Danger/primary label tokens (1 line each) | |
| 14 | `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` | Approved | Customer-scoped `--color-on-primary` (L167) computed via `isLightColor(primary)`; fallback `mutedText || '#54647A'` (L141) | |
| 15 | `src/components/admin/AdminLayoutShell.tsx` | Approved | Logo tiles, warning badges, Builder CTA (5 hunks) | |
| 16 | `src/components/admin/AdminSidebar.tsx` | Approved | Item label token | |
| 17 | `src/components/admin/BuilderPreviewClient.tsx` | Approved | Label token | |
| 18 | `src/components/admin/MaintenanceToggle.tsx` | Approved | Status pill → on-color tokens; emerald-700 solid → `--color-success` | |
| 19 | `src/components/admin/PaymentActions.tsx` | Approved | emerald-700 buttons → `--color-success` + `--on-success` | Class-only; payment logic untouched |
| 20 | `src/components/admin/UserTableClient.tsx` | Approved | Selection counter + rose-700 delete buttons → `--color-danger` + `--on-danger` | Bulk-delete logic untouched |
| 21 | `src/components/home/HomePage.tsx` (dup #4) | — | — | |
| 22 | `src/components/notifications/NotificationBell.tsx` | Approved | Label token | |
| 23–25 | `src/components/portfolio/analytics/AnalyticsDashboard.tsx`, `ProjectViews.tsx`, `ViewsChart.tsx` | Approved (with new defect) | `#2563eb/#1d4ed8/#3b82f6` → `--color-primary` family everywhere; DeltaPill rose/purple/emerald → success/danger; hero labels `blue-100/200 → opacity-80/75`; table `text-left/right, pl-/pr- → text-start/end, ps-/pe-` | **§13 D1–D2** header/hero; monospace value rows unchanged ; series `#161b26` dark-surface retained (deliberate) |
| 26 | `src/components/portfolio/templates/ClassicTemplate.tsx` | Approved | Template-scoped `--color-on-primary` family (L408, L413, L837, L2052, L2073–2076); fallback muted `#54647A` (L388) | |
| 27 | `src/lib/actions/portfolio.ts` | Approved | Exactly **one hunk** (`@@ -323 +323`): creation default `mutedText: '#54647A'` | No other logic touched (verified: `normalizeSlugKey` warning at L638 pre-exists) |

**Unrelated / pre-existing:** `skills-lock.json` (+42 lines; skill-registry installs), untracked `.agents/skills/*`. Not part of Phase 1; untouched recommendation: leave as-is.

**No changes to:** authentication, authorization, subscription, payment business logic, file storage, Prisma schema, migrations, seeds, server actions other than the one hunk above. Cross-checked by reading all 26 diffs and confirming the single `portfolio.ts` hunk.

---

## 4. Customer Appearance Isolation (Priority 1)

**Verdict: VERIFIED — no path found where Phase 1 changes an existing customer's saved design.**

Evidence chain, all inspected in source:

1. **Schema guard** — `src/lib/portfolio-schema.ts:570–575`: `safeColor` = string ≤64 chars matching `/^#([0-9a-fA-F]{3,8})$/` or `rgb()/hsl()`, `.optional().catch(undefined)`. A **valid saved value passes through verbatim** — `mutedText: "#64748B"` from an old profile is preserved, never normalized. An empty string fails the refine and becomes `undefined` (correctly treated as truly missing). `appearanceSchema:608` uses `safeColor` for `mutedText`.
2. **Legacy raw preservation** — `portfolio-schema.ts:669–688`: on parse failure the raw object is stored (`out.appearance = data.appearance`), never rejected or defaulted.
3. **Render-time fallback** — `ClassicTemplate.tsx:388` and `ProjectPageView.tsx:141`: `appearance.mutedText || '#54647A'`. The `||` falsey branch fires only for `undefined`/`''`/`null` — the schema can emit exactly those, and only those, when the value is genuinely absent or invalid. Saved truthy strings (any hex, including the old `#64748B`) always win. Same pattern for all other appearance fields; the defaults list in both files matches the pre-Phase-1 list except `mutedText`.
4. **Creation defaults** — `portfolio.ts:323` (`getOrCreateProfile`): writes `#54647A` into appearance of **newly created** profiles only. No update/delete path touches existing rows from this audit's diff.
5. **Builder reset** — `ThemeSettings.tsx:150–160`: the `#54647A` entry sits in the reset-defaults palette applied when the user explicitly resets the theme; it does not silently mutate saved state on load.
6. **Token scoping collision check** — global on-ink family uses `--on-*` (`globals.css:71–74`, `172–175`); the portfolio family uses `--color-on-*` and is defined **inline in JSX style objects per customer** (`ClassicTemplate.tsx:408, 413, 837, 2052, 2073–2076`; `ProjectPageView.tsx:167`). No overlap; the guard test `globals.css never defines the portfolio token family` (design-tokens.test.ts:120) passes.
7. **`#54647A` census** — exactly 4 occurrences repo-wide (grep): `portfolio.ts:323` (new-user default), `ClassicTemplate.tsx:388` + `ProjectPageView.tsx:141` (fallbacks for missing/invalid), `ThemeSettings.tsx:153` (reset palette). No other paths.
8. **Sanity ratio** — the new default is *more* accessible, not less: `#54647A` on `#F0F9FF` = **5.66:1**, on white card = **6.03:1**, vs old default `#64748B` 4.76:1 / 4.5:1. `--color-on-primary` on the default customer primary `#38BDF8`: dark ink `#0F172A` = **8.33:1** (had the implementation wrongly kept white, it would be 2.14:1 — the `isLightColor` branch is what saves this; covered by test "public templates still own their on-primary token").

**Conclusion:** existing portraits keep every saved color; only genuinely-missing light-mode muted text gains a more accessible default, and new portfolios get accessible defaults by design.

---

## 5. Landing `/` and `/en` Consistency

**Verdict: VERIFIED (visual identity aligned; one benign architecture duplication noted).**

Routing: `/` → `src/app/page.tsx` → `HomePage` (Arabic, RTL, fixed light theme). `/en` →→ `src/app/en/page.tsx` → `LandingPage lang="en"` (LTR, light+dark via `data-theme` on the `.landing-page.ph-landing` wrapper, `LandingPage.tsx:332–333`).

- **Same accent family:** HomePage `--ph-gold: #06c` / `--ph-gold-light: #0071e3` (`HomePage.tsx:571–572`) = LandingPage `--accent: #0066cc` / `--accent-focus: #0071e3` (`globals.css:403–404`); dark accent `#2997ff` on both (`--ph-accent-on-dark`, `--accent-on-dark`). CTA label contrast identical: white on `#0066cc` = **5.57:1** both pages.
- **On-ink semantics consistent in dark:** `.landing-page[data-theme='dark']` switches CTA label from white (recomputed **3.02:1 on #2997ff** — comment verified) to `#0e0e10` = **6.40:1** (`globals.css:451–453`). Independently reproduced as 6.40.
- **Muted ink:** both `#6b6b70` (`HomePage.tsx:577`, `globals.css:407, 105`). Landing `--ink-muted` claim of 5.30 on white reproduced.
- **RTL/LTR preserved:** `page.tsx` renders `HomePage` with the document's `dir=rtl`; `LandingPage` sets its own `lang`/`dir` (`ar ? 'rtl' : 'ltr'`); Arabic font stack scoped by `html[dir='rtl'] .landing-page` (`globals.css:456–460`); heading weight arbitration at L462–470. CTA labels and arrows unchanged in content (labels: `ابدأ مجاناً` vs `startFree`).
- **No leakage:** `.landing-page` tokens identify by scope (comment at `globals.css:395–400`); HomePage tokens are inside its own `CSS` string on `.ph-home`. App-shell dark `html.dark` does not alter landing—the landing element's own declarations inherit-shadow any `<html>` custom property, so a visitor with system dark mode + landing light theme still sees white labels (element-owned declaration beats inherited). Dark-mode toggle on landing remains `data-theme`-driven.
- **Residual (documented, not a defect blocker):** the two marketing pages still maintain **two separate token vocabularies** (`--ph-*` vs `.landing-page`) that happen to now agree; `--on-primary` exists in both scopes with consistent values. HomePage has no dark theme at all (unchanged pre-existing state) — acceptable given it is a fixed light layout, and Phase 1 deliberately kept its identity.

The original divergence (different accent hue + failing `#7a7a7a` on two pages / one) is genuinely resolved at value level.

---

## 6. Accessibility & Contrast (Independent Recomputation)

Method: standalone script (`/tmp/opencode/contrast-audit.mjs`), WCAG 2.2 relative-luminance math written from scratch, opacity handled via alpha compositing (a case the test suite does not model — see §13 D3-test-gap). Key results (each row independently reproduced):

**App shell — passing (sample):**

| Pair (intro/outcome) | Theme | FG | BG | Ratio | Req | Result |
|---|---|---|---|---|---|---|
| Primary text | light | `#272729` | `#f5f5f7` | 13.69 | 4.5 | PASS |
| Muted `#6b6b70` / old `#7a7a7a` | light | — | white / `#f5f5f7` | 5.30 / 4.87 vs old 4.29 / 3.94 | 4.5 | PASS (old FAIL) |
| Success `#15803D` | light | on white | 5.02 | 4.5 PASS; as fill w/ white label 5.02 |
| Warning `#b45309` | light | on white | 5.02 | 4.5 PASS; as fill 5.02 |
| Danger `#DC2626` | light | on white | 4.83 (PASS); as fill w/ white 4.83 |
| CTA white on `#0066cc` / hover `#0071e3` | light | | 5.57 / 4.70 (PASS) — old `#2563eb` combinator 5.17 |
| Dark CTA `#0e0e10` on `#2997ff` | dark | | **6.40** (comment's 6.40 ✓) — old white was 3.02 |
| Dark badges success/warning/danger solids | dark | `#052e16`/`#1f1f23` | `#4ADE80`/`#EFA820`/`#F87171` | 8.55 / 8.05 / 5.94 | PASS |
| Toast solids (light & dark) | both | white | `#15803d`/`#b45309`/`#dc2626` | 5.02 / 5.02 / 4.83 | PASS |
| Dark pill RESULTS (DeltaPill non-hero) | dark | `#4ADE80`/`#F87171` | success/danger /10 over `#18181b` | 8.37 / 5.59 | PASS |
| analytics hero (dark label) `#0e0e10@0.8` on `#2997ff` | dark | | 4.91 | PASS |
| analytics muted `slate-400` on `#161b26` | dark | | 6.72 | PASS (incl. `#94a3b8`) |
| `#0f172a` as chip fill (dark inverts: `dark:bg-white dark:text-[#0f172a]`) | both | | 17+ | PASS |

**Remaining failures (all documented in §13 with fix):**

| Pair | Theme | FG (effective) | BG | Ratio | Req | Status vs pre-Phase-1 |
|---|---|---|---|---|---|---|
| Hero card label `opacity-80` | light | `#cce0f5` (white@0.8) | `#0066cc` | **4.12** | 4.5 | old `blue-100`/`#2563eb` = 4.24 (also FAIL) — lateral |
| Hero sub-label `opacity-75` | light | `#bfd9f2` | `#0066cc` | **3.82** | 4.5 | old 3.64 (also FAIL) — lateral |
| Hero sub-label (dark) | dark | `#15304c` | `#2997ff` | **4.47** | 4.5 | old 3.64 FAIL → marginal residual FAIL |
| DeltaPill pill `bg-white/25 text-white` | light / dark | white | white/25 blended | 3.52 / **2.28** | 4.5 | pre-existing; dark worsened 3.31→2.28 due to brighter dark primary |
| DeltaPill up/down (light, /10 tints) | light | `#15803D` / `#DC2626` | /10 over white | **4.38** / **4.13** | 4.5 | old emerald 3.58 / purple ≈3.2 (also FAIL) — improved but still < 4.5 |
| Emerald Live badge, admin `emerald-600` on `emerald-50`/white; `amber-500` icons | light | | | 3.58 / 3.77 / 2.2 | | pre-existing, untouched by Phase 1 |
| Blend input/hairline borders `#e0e0e0` on white | both | | | 1.32 | 3.0 | pre-existing decorative boundary; low severity |

Also verified passing: portfolio defaults (`textLight`/`bgLight` 16.75; muted 5.66/6.03; `mutedTextDark #858688` on `#111827` = 4.87), `PRO` badge `#0066cc` on 10%-tint 4.83, `#64748b` tooltip label on white 4.76 (untouched达标 line, pre-existing), outline token boundary `#0066cc` vs white 5.57 (3:1 GUI PASS).

---

## 7. Token Architecture

- **One authoritative system:** `globals.css` `:root`/`@theme inline` (:47–136) light, `(html.dark|[data-theme=dark])` (:148–203) dark, plus the isolated `.landing-page` scope (:402–454). No duplicates for `--color-*` semantics.
- **Legacy aliases retained by design:** `--ph-*`, `--card`, `--popover`, `--dropdown`, `--canvas-alt`, `--tile-*`, `--ink`. Consumer census: `var(--card)` used **only by HomePage** (self-scoped), landing consumes `--tile-*`/`--ink`. Removing them would break HomePage/scoped rules — correctly kept (“Do not demand removal if removing it would break a consumer”). `--card/--popover/--dropdown` are dormant shells (consumers use `--color-card/--color-popover/--color-dropdown`); they are bound to `.color-surface` both ways (双向 alias) — harmless.
- **`--on-*` namespace collision safe** (see §4.6): no `--color-on-*` definition in globals (verified by grep and passing test).
- **Landing duplication of `--on-primary` under `.landing-page`** mirrors app values intentionally (white light, #0e0e10 dark) — same namespace, scoped; no shadowing conflict with `html.dark` because element-owned declarations override inherited.

---

## 8. Analytics Migration

Search performed repo-wide for `#2563eb`, `#3b82f6`, `#161b26`, `#1d4ed8`, `#0f172a` in analytics + templates.

- **`#2563eb`** — one survivor: `RadialGaugeCard.tsx:86` SVG `stroke`, data-vis series color. Judged intentional viz color, passes non-text 3:1 in both themes (5.17 light, 3.34 dark). Not a defect; flagged for Phase 2 completeness only.
- **`#3b82f6`, `#1d4ed8`** — **zero occurrences remain** (removed from Analytics CTA hovers via `--color-primary-hover`).
- **`#161b26`** — retained dark analytics card surface (12+ sites); deliberate identity (distinct from app dark `#0e0e10`/`#18181b`); document only.
- **`#0f172a`** — used as light "navy ink" and as chip fill with dark-inverse (`dark:bg-white dark:text-[#0f172a]`) — correct in both modes. One residual: `ProjectViews.tsx:44` `hover:text-[#0f172a]` coexists with `dark:bg-slate-900` click target — hover contrast ≈1:1 in dark until Tailwind order resolves; pre-existing line (hover-token part unchanged except focus:border compile detail), **low** severity, logged.
- **Data-calc untouched:** only className strings changed; math (`Math.abs(pct)`, `toLocaleString`) diffs show zero logic edits; DeltaPill semantics corrected (purple/emerald/rose → success/danger) with documented marginal light-fail (§6).
- **Untouched surfacing:** `admin/revenue/page.tsx:225, 248–249` emerald/rose chips, `admin/page.tsx:411/445/473`, `support/page.tsx:243/332/340/348/422`, `users/[id]/page.tsx:189`, `UserTableClient.tsx:377`, `AnnouncementManager.tsx:181`, `UserDetailsDrawer.tsx:509`, `UserTimeline.tsx:38/46`, builder amber accents (`BuilderClient.tsx:2398, 3365, 4429, 4966, 5127`), `og/route.tsx:34/62` + `BuilderClient.tsx:620` `#D4A017` badge — all pre-existing, classified as Phase-2 backlog (consistency debt, mostly icons/labels ≥4:1 or intentionally decorative).

---

## 9. RTL / LTR

- Changed files use logical utilities only: `ms-1.5` (`ThemeSettings.tsx:227`), `ps-/pe-` table+inputs (`ProjectViews.tsx:36-…`), `text-start/text-end` (`ProjectViews.tsx:53, 58, 154`), `rtl:-scale-x-100` arrow (`not-found.tsx:22`). No accidental direction flips found; symmetric centered elements intentionally keep physical `left-1/2 -translate-x-1/2` (mirroring-safe). Axis labels `ps-10 pe-2` mirror correctly with `justify-between` + `overflow-x-hidden`.
- `ViewsChart.tsx:112` tooltip `text-left → text-start`; `ProjectViews` table headers `text-left → text-start`, values column `text-right → text-end` — logical alignment means the "Total views" column ends at the visual left in Arabic, matching intended RTL table semantics.
- Responsive behavior unaffected (no width/height/mq edits found; only padding/align classes).

---

## 10. Baseline Test Comparison (pre-existing failures proof)

Method: temporary detached worktree at `7c1d08f` in `/tmp/opencode/phase1-baseline` with symlinked `node_modules`; removed after. No stash, no source modification.

**At HEAD `7c1d08f` (before Phase 1):**

```
FAIL __tests__/features-v2.test.ts
 × verifies About section uses theme sectionBg and does not hardcode #FAF7F2 or fixed colors
 × verifies template enhancements: wordSafeTruncate, hasContactCol, extraSections, clean hero button, and single copyright
 Test Files  1 failed (1)
 Tests  2 failed | 19 passed (21)
```

Assertions failing (both target template **content-feature** code that does not exist on HEAD — `git show HEAD:...ClassicTemplate.tsx` returns no `wordSafeTruncate` string; sectionBg hardcoding assertions likewise; unrelated to color tokens):

- `__tests__/features-v2.test.ts:331` — `expect(templateContent).toContain('function wordSafeTruncate(')`
- the `appearance.footerBg || 'var(--color-primary)'` block (template "clean hero button / copyright" assertions)

**Post-Phase-1 working tree, same file:** `2 failed | 19 passed (21)` — **identical test names, identical failure count.**

Cross-checks at HEAD confirming Phase 1 didn't predate: `globals.css` contained `--ph-gray-text: #7a7a7a` (L55/91/384 old values), and `ClassicTemplate.tsx` contained **zero** occurrences of `#54647a`.

**Conclusion:** the pre-existing claim is independently proven; Phase 1 introduced **no new test failures**.

---

## 11. Fresh Test Results (this audit, working tree)

| Run | Command | Result |
|---|---|---|
| Design tokens (targeted) | `npx vitest run __tests__/design-tokens.test.ts` | **26/26 PASS** |
| Full suite | `npx vitest run` | **137 passed, 2 failed (139)** — only the two pre-existing `features-v2` failures; `Test Files: 1 failed / 16 passed (17)` |
| TypeScript | `npx tsc --noEmit` | **exit 0, no output** (`tsconfig.tsbuildinfo` reverted afterwards; tree clean) |
| Baseline `features-v2` at HEAD | worktree as §10 | identical 2 failures → disproves regressive change |
| Baseline ESLint on the 4 erroring files | worktree at HEAD | identical 8 errors → no new lint errors |

The suite does calculate actual fg/bg contrast (its own luminance/ratio helper at `design-tokens.test.ts:26–40`) rather than asserting token existence — with one modeling gap noted in §13 D4.

---

## 12. Build & Lint Results

| Check | Status | Evidence |
|---|---|---|
| ESLint, all 25 changed TS/TSX files | 8 errors / 39 warnings — **0 new** (all 8 errors pre-exist at HEAD; warnings are `no-img-element`+`normalizeSlugKey` unused, pre-existing, e.g. `portfolio.ts:638` exists in `git show HEAD`) | `npx eslint <changed files>` + baseline worktree re-run |
| TypeScript | Clean | `tsc --noEmit` exit 0 |
| Production build | **Not re-run in this audit** (`§10` marks it optional; requires ~minutes-long compile). Previous implementation report claims success; no evidence contradicting it: zero imports/config changed | — |

---

## 13. Remaining Defects & Risks

| # | File : Line | Reproduction condition | Impact | Severity | Minimal fix |
|---|---|---|---|---|---|
| D1 | `src/components/portfolio/analytics/AnalyticsDashboard.tsx:345` | Light mode, hero card (Total Views), label `opacity-80` on `bg-[var(--color-primary)]` | White-on-blue label renders 4.12:1 < 4.5 (AA fail; WCAG normal text) | **Minor** (was 4.24 pre-change; lateral) | Replace `opacity-80` with solid label token, e.g. `text-[var(--ph-blue-50)] #dbeafe`-equivalent `text-celeste/white` at ≥4.5, or `opacity-90`+`text-white` (≈4.63) or a dedicated `--color-on-primary-muted` token verified ≥4.5 |
| D2 | `AnalyticsDashboard.tsx:356` | Same, sub-label `opacity-75` (“Last 30 days”) | 3.82:1 light / **4.47** dark (marginal) | **Minor** | Same as D1 (bump opacity to ≥0.90 light; verify dark ≥4.5, currently 4.47 at 0.75→needs 0.80+) |
| D3 | `AnalyticsDashboard.tsx:84–95` (`DeltaPill isHero`) | Hero delta pill `bg-white/25 text-white` both modes | 3.52 light / 2.28 dark — pre-existing fail; dark worsened by intentional brighter dark primary | **Minor** | Swap to solid token pair (`bg-[var(--color-surface)]/90 text-…`) or dark-ink text like the new app pattern |
| D4 | `__tests__/design-tokens.test.ts` (suite design gap) | Hero labels “pass” while `opacity-*` compositing is unmodeled | Contrast helper computes straight hex pairs only; cannot catch opacity regressions like D1/D2 | Test-gap | Add blended-foreground helper (alpha composite then ratio) and assert hero-label pairs |
| D5 | `src/app/globals.css:409` | Source formatting | `--canvas-alt: #f5f5f7;  --tile-1: #272729;` merged on one line — cosmetic only | Cosmetic | Split into two lines |
| D6 | `src/app/admin/revenue/page.tsx:225,248–249` + other admin/builder `emerald/amber/rose` leftovers (list in §8) | Light mode | Pre-existing AA-failing chips/icons missed by migration; consistency debt | Minor/debt | Phase 2 batch migration to `--color-success/--color-warning/--color-danger` |
| D7 | `RadialGaugeCard.tsx:86` `stroke='#2563eb'`; `ProjectViews.tsx:44` dark-hover `#0f172a`; `#161b26` surfaces; `#D4A017` badges | Dark/light | Non-consumed hardcoded accents; judged intentional viz color (passes 3:1) | Info | Optional Phase-2 unification via tokens |

**Risks explicitly cleared:** no auth/authorization/subscription/payment/storage changes; no DB/data migrations; no customer appearance overwrite path found; no new failures vs HEAD in tests, tsc, or lint.

---

## 14. Manual Staging Verification Checklist

1. **Appearance isolation QA (real flow, staging data):**
   - Sign in to a pre-existing portfolio; confirm muted text on the public page still matches that account's saved appearance (pre-Phase-1 customers should look identical to before); export/inspect DB row to confirm no drift (`appearance.mutedText` unchanged).
   - User with NO `appearance.mutedText` set → light mode label renders `#54647A`.
   - Builder: edit muted text → save → publish → public page reflects exactly; project detail page `/u/[username]/projects/[slug]` matches main portfolio color resolution (incl. `--color-on-primary` computed from `primaryColor` with dark-ink on light primaries).
   - Reset theme in builder → defaults now include `#54647A`; explicit re-save keeps custom values (no injection on load).
   - Create brand-new account → `appearance.mutedText === '#54647A'` on first save.
2. **Landing parity:** load `/` (Arabic) and `/en`; toggle `/en` dark; screenshot-compare accents (#0066cc family), CTA label readability, RTL/LTR; confirm landing never renders app-dark ink while system prefers-color-scheme dark.
3. **Admin migrations:** Warning badge collapsed/mobile (`bg-[var(--color-warning)] text-[var(--on-warning)]`), Maintenance pill both states, PaymentActions Confirm buttons, UserTableClient bulk-delete rose→danger, support page pills/toast states — âvisual diffâ old vs new screenshots light+dark.
4. **Analytics:** Hero card labels (light+dark: light-mode D1/D2 gaps visible, confirm acceptable before Phase 2); DeltaPill hero; tooltips/axis/legend; table sort/search chevrons alignment under RTL; Sorting/traffic columns align `text-end`; empty-state banner.
5. **Toast QA:** trigger success/warning/error/info toasts in light & dark; solid fills #15803d/#b45309/#dc2626 + correct on-ink; no transparency bleeding.
6. **Buttons/IconPicker/ConfirmModal/not-found/FileViewer:** normal, hover, disabled, focus ring states in both themes; not-found arrow flips in Arabic.
7. **`tsc --noEmit`; full suite; eslint changed files; build** as CI gate before staging deploy.
8. **A quick pass with a screen reader tab-through** on admin pages migrated from `text-white` (focus/active state legibility).
9. Optional: `npm run build` once before staging deploy (was skipped in audit).

---

## 15. Production Deployment Readiness

- Source-level verification: **YES** — the implementation is internally consistent, appearance-isolated, AA-safe in all headline token pairs, RTL-safe, and introduces zero regressions versus `7c1d08f` (tests/tsc/lint all clean of new issues). Staging gate can proceed.
- Not yet verified at browser/runtime: expectation from the audit is staging, not production. Real-user staging checks (§14 items 1–6), the five documented minor AA/compositing gaps (D1–D3, D4-test-gap, D5 formatting), and one optional build re-run stand between “staging-ready” and “production go”.
- Nothing in this audit blocks the eventual deploy; D1–D3 are 1–2-line class-level fixes typically batched into a Phase 2 (or applied in a single follow-up PR before staging deploy if desired).
- Verdict stands: **VERIFIED WITH MINOR ISSUES —Decision A.**
