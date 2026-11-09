# Phase 1 — Implementation Plan

Read-only planning. Implementation has not started. No source file has been changed.

## Plan structure

- Phase 1A: Accessibility fixes for app-shell and shared UI.
- Phase 1B: Token unification and hardcoded-color reduction.
- Phase 1C: RTL direction safety and predictable borders.
- Separate approval is required before each category B/C change.

## 1. Phase 1A — Accessibility fixes

### Task A1 — Muted text contrast
- Priority P0.
- Current implementation: `--color-text-muted = --color-text-secondary = #7a7a7a` light; dark values already pass.
- Files: `src/app/globals.css`, optionally `src/components/home/HomePage.tsx`, `src/components/landing/LandingPage.tsx` if local copies remain.
- Proposed change: revise app light muted token to `#6b6b70`, and `--ink-muted` on landing/Home to `#6b6b70`.
- Visual impact: slightly darker subtle text globally.
- Customer impact: none (app UI only).
- Risk: low. Existing disabled/muted text appears more pronounced.
- Tests: token value assertion, contrast calculation, visual inspect.
- Rollback: revert the CSS token values; no database involved.

### Task A2 — Light success semantic color
- Priority P0.
- Current implementation: success fill `#16A34A` always used with white text.
- Proposed change: tokens remain, but usage requires dark text (`--on-success`) or darken fill when white text is needed. Update `Button.tsx` success variant and Toast.
- Files: `src/app/globals.css`, `src/components/ui/Button.tsx`, `src/components/ui/Toast.tsx`.
- Visual impact: success buttons/toasts use `#052e16` text instead of white, still green-filled.
- Customer impact: none.
- Risk: low.
- Rollback: revert variant classes only.

### Task A3 — Dark semantic colors
- Priority P0.
- Current implementation: `.dark` and `[data-theme="dark"]` set success/warning/danger fills that fail white text.
- Proposed change: retain bright fills for icons but use dark text on them, or introduce on-color text tokens.
- Files: `src/app/globals.css`, `src/components/ui/Toast.tsx`, admin page badge classes.
- Visual impact: dark success/warning/danger text becomes dark gray in light-covered warning and error toasts. Danger keeps white because fill is dark enough.
- Risk: low; requires checking admin warning badge.
- Rollback: revert token/text variants.

### Task A4 — Landing accent white text
- Priority P1.
- Current implementation: `.landing-page` dark accent `#2997ff` on dark canvas 6.40 passes when large; white helper text on that accent is only 3.02.
- Proposed change: use dark text (`#1d1d1f`) for normal text on `#2997ff` accent in dark mode, or darken accent.
- Files: `globals.css` landing section only; component classes affected.
- Risk: medium due to marketing pages.
- Rollback: revert landing tokens.

### Task A5 — Toast warning
- Priority P0.
- Current implementation: solid `#d97706` in both light/dark toast styles.
- Proposed change: `#92400e` high-contrast fill, or dark text.
- Files: `src/components/ui/Toast.tsx`.
- Risk: low.

### Task A6 — Default portfolio muted fallback
- Priority P1. (Category B)
- Current: `#64748B` gives 4.46, marginally fail. Replace with `#6b6b70`.
- Files: `ClassicTemplate.tsx`, `ProjectPageView.tsx`, `ThemeSettings.tsx`, `src/lib/actions/portfolio.ts`.
- Visual impact: default text for newly created/blank profiles slightly darker.
- Existing customers: only profiles that have null optional field or newly created profiles. Saved explicit `mutedText` remains unchanged.
- Migration: none.
- Tests: must set all constants in one change or default mismatch occurs.

### Phase 1B — Token unification

### Task B1 — Canonical token introduction
- Files: `src/app/globals.css`.
- Add canonical names with aliases.
- Visual impact: none.
- Existing customers: no effect.
- Rollback: remove new variables.

### Task B2 — Homepage and LandingPage convergence
- Files: `src/components/home/HomePage.tsx`, `src/components/landing/LandingPage.tsx`, `globals.css`.
- Make homepage warning and text-normal values converge to app tokens. Do not remove marketing visual identity.
- Risk: high. Requires screenshot approval.
- Existing customers: marketing only.

### Task B3 — Analytics hardcoded #2563eb
- Priority P1.
- Files: `src/components/portfolio/analytics/AnalyticsDashboard.tsx`, `ViewsChart.tsx`, `ProjectViews.tsx`, `RadialGaugeCard.tsx`.
- Proposed change: replace `bg-[#2563eb]` with `bg-[var(--color-primary)]`; `/hover:bg-[#1d4ed8]` becomes `hover:opacity-90` or `hover:bg-[var(--color-primary-hover)]`. Text remains white.
- Excellent use of canonical token, since contrast already passes.
- Risk: medium, many classes. Should be done via careful edit, then compile.
- Visual impact: minimal, because values are equivalent.

### Task B4 — Analytics dark slate surfaces
- Replace `#161b26`, `#0b0f17` with a semantic dark-surface token or remain as component-local if no global
  equivalence. Decision: component-local decorative overrides unless identical to app dark surface.
- Risk: low.

### Task B5 — Chart palette tokens
- Files: `src/app/globals.css`, `ViewsChart.tsx`, project card visuals.
- Create `--chart-*` tokens and use them.
- Existing customers: if analytics/project chips change fill, this is an owner-only UI, no customer impact.
- Risk: low to medium.

### Task B6 — Duplicate alias cleanup
- Files: `globals.css`; components gradually.
- Remove `--card`, `--popover`, `--dropdown` only after grep confirms none.
- Existing customers: none.
- Risk: moderate due to hidden usage.

### Phase 1C — RTL/UI consistency

### Task C1 — ThemeSettings physical margin
- Files: `ThemeSettings.tsx`.
- Change `mr-1.5` to `ms-1.5` for logical spacing. This fixes RTL alignment.
- Risk: low.
- Existing customers: none.

### Task C2 — Analytics table physical padding
- Files: `ProjectViews.tsx`, `ViewsChart.tsx`, `AnalyticsDashboard.tsx`.
- Convert non-Arabic-intentional `pl-*`/`pr-*` and `text-left` where it is layout rather than content. Keep Arabic input `text-right`.
- Risk: moderate. Must not disturb table grid.
- Existing customers: owner-facing only.

### Task C3 — Portfolio bottom nav active color
- Files: `PortfolioBottomNav.tsx`.
- Replace hardcoded `#D4A017` with a token `--color-highlight-gold` or use `#D4A017` as documented deliberate highlight token. Need decide. Current visual identity uses gold highlight, not app brand blue.
- Risk: low. Existing customers see same current behavior if token points same value.

### Task C4 — Borders
- Files: `globals.css`, Input, Card.
- Differentiate default subtle from strong borders; stronger for interactive input.
- Risk: medium, broad visual change app UI only.

## Task table

| Task ID | Phase | Priority | Category | Files | Customer impact | Migration | Approval needed |
|---|---|---|---|---|---|---|---|
| A1 | 1A | P0 | A safe global | `globals.css`, `HomePage.tsx`, `LandingPage.tsx` optional | none | no | no |
| A2 | 1A | P0 | A safe global | `globals.css`, `Button.tsx`, `Toast.tsx` | none | no | no |
| A3 | 1A | P0 | A safe global | `globals.css`, `Toast.tsx`, admin page | none | no | no |
| A4 | 1A | P1 | A safe global | landing CSS/classes | none | no | no |
| A5 | 1A | P0 | A safe global | `Toast.tsx` | none | no | no |
| A6 | 1A | P1 | B default-only | `ClassicTemplate.tsx`, `ProjectPageView.tsx`, `ThemeSettings.tsx`, `portfolio.ts` | new/blank/null-color portfolios | no | yes |
| B1 | 1B | P1 | A safe global | `globals.css` | none | no | no |
| B2 | 1B | P1 | C marketing | Home/Landing pages | none app users, marketing visuals | no | yes |
| B3 | 1B | P1 | A safe global | analytics files | none | no | no |
| B4 | 1B | P2 | A safe global | analytics files | none | no | no |
| B5 | 1B | P1 | A safe global | `globals.css`, chart components | owner-only | no | no |
| B6 | 1B | P2 | A safe global | `globals.css`, any using aliases | none | no | no |
| C1 | 1C | P2 | A safe global | `ThemeSettings.tsx` | none | no | no |
| C2 | 1C | P2 | A safe global | analytics tables | none | no | no |
| C3 | 1C | P3 | B/C potential | `PortfolioBottomNav.tsx` | none unless token value changed | no | no |
| C4 | 1C | P2 | A safe global | input CSS and component | none | no | no |

## 2. Rollback strategy

- Keep the first implementation commit as token-only and style-only changes.
- Keep color value changes reversible via git.
- Run TS/lint before merge; no DB involved.
- If unexpected visual regressions appear, revert the offending sub-commit only (1A, 1B, or 1C).
- Do not touch customer data.

## 3. Sequence recommendation

1. Implement A1/A2/A3/A5 in one small commit.
2. Run TS/lint after approved.
3. Implement B1/B3/B5/B6.
4. Implement C1/C2.
5. A6 only after staging with synthetic profiles.
6. B2/B4/high-impact visual changes last.
EOF
echo done