# Phase 1 — Contrast and Accessibility Report

Read-only inspection. Contrast ratios in this report were recalculated from the token values present in source code, not from browser-rendered output.

## 1. WCAG criteria used

- Normal text: 4.5:1.
- Large text or 14pt bold UI text: 3.0:1.
- Relevant non-text UI boundaries/focus states: 3.0:1 where the boundary conveys meaning and must remain visible.
- Decorative or non-essential adjacent color differences may be exempt, but any decision to make them exempt must be documented.

Ratios are for the combinations listed. Colors marked `pass` meet or exceed the required ratio.

## 2. Recalculated reported issues

| Pair | Ratio | Required | Result |
|---|---:|---:|---|
| Muted app text `#7a7a7a` on white `#FFFFFF` | 4.29 | 4.5 | FAIL |
| Muted app text `#7a7a7a` on page background `#f5f5f7` | 3.94 | 4.5 | FAIL |
| Light-mode success button `#16a34a` with white text | 3.30 | 4.5 | FAIL normal, PASS large text |
| Dark-mode success `#4ADE80` with white text | 1.74 | 4.5 | FAIL |
| Dark-mode warning `#EFA820` with white text | 2.04 | 4.5 | FAIL |
| Dark-mode danger `#F87171` with white text | 2.77 | 4.5 | FAIL (passes only for very large text) |

These four previous report values are confirmed accurate. Three additional pairs were found while inspecting the same components.

## 3. Additional failing combinations

### 3.1 Normal-text failures (16 rows total including app muted rows above)

| No. | Foreground | Background | Ratio | Required | Location |
|---:|---|---|---:|---:|---|
| 1 | `#7a7a7a` | `#FFFFFF` (surface/canvas) | 4.29 | 4.5 | `globals.css:55,91`; landing `--ink-muted`; Home `--text-muted` |
| 2 | `#7a7a7a` | `#f5f5f7` (page/canvas-alt) | 3.94 | 4.5 | same muted text contexts |
| 3 | `#7a7a7a` | `#ffffff` (landing canvas) | 4.29 | 4.5 | Landing `.landing-page` |
| 4 | `#7a7a7a` | `#f5f5f7` (landing canvas-alt) | 3.94 | 4.5 | Landing `.landing-page` |
| 5 | `#7a7a7a` | `#ffffff` (home canvas) | 4.29 | 4.5 | `HomePage.tsx` `.ph-home` |
| 6 | `#64748B` (portfolio default muted) | `#F0F9FF` (portfolio default light background) | 4.46 | 4.5 | `ClassicTemplate.tsx:388`, `ProjectPageView.tsx:141`, defaults in `portfolio.ts`, `ThemeSettings.tsx` |
| 7 | `#ffffff` (white text) | `#16A34A` | 3.30 | 4.5 | `--color-success` in light app shell, Toast success, `Button.tsx` success variant |
| 8 | `#ffffff` | `#4ADE80` (dark success) | 1.74 | 4.5 | dark shell semantic token, admin badge |
| 9 | `#ffffff` | `#EFA820` (dark warning) | 2.04 | 4.5 | dark shell semantic token, admin/table warnings |
| 10 | `#ffffff` | `#F87171` (dark danger) | 2.77 | 4.5 | dark shell semantic token, mobile actions/error states |
| 11 | `#ffffff` | `#d97706` (Home warning) | 3.19 | 4.5 | `HomePage.tsx` `.ph-home --warning`; admin-like badges |
| 12 | `#ffffff` | `#2997ff` (landing accent) | 3.02 | 4.5 | `.landing-page --accent` on-dark buttons/links |
| 13 | `#ffffff` | `#3b82f6` (analytics blue chips) | 3.68 | 4.5 | `AnalyticsDashboard.tsx`, project card visual mapping |
| 14 | `#ffffff` | `#10b981` (analytics green chips) | 2.54 | 4.5 | `AnalyticsDashboard.tsx` |
| 15 | `#ffffff` | `#f97316` (analytics/project status) | 2.80 | 4.5 | `project-card-visuals.ts`, chart status if used as fill |
| 16 | `#ffffff` | `#60a5fa` (decorative blue accent) | 2.54 | 4.5 | AuthShell/LandingPage hero orbs if text were used |

Total normal-text rows: 16.

### 3.2 Non-text UI/boundary failures (7 rows)

| No. | Foreground/boundary | Background | Ratio | Required | Location/impact |
|---:|---|---|---:|---:|---|
| 1 | app border `#e0e0e0` | white `#FFFFFF` | 1.32 | 3.0 | app shell form/card borders |
| 2 | app border `#e0e0e0` | page `#f5f5f7` | 1.21 | 3.0 | app surfaces adjacent to page |
| 3 | dark border `#333336` | dark surface `#18181b` | 1.41 | 3.0 | dark form/card boundaries |
| 4 | dark border `#333336` | dark page `#0e0e10` | 1.53 | 3.0 | dark surface adjacency |
| 5 | portfolio default light border `#BAE6FD` | portfolio default light bg `#F0F9FF` | 1.24 | 3.0 | default customer template borders |
| 6 | portfolio dark border `#4B5563` | portfolio dark card `#374151` | 1.36 | 3.0 | default customer template borders |
| 7 | neutral icon/tick `#94a3b8` | white `#FFFFFF` | 2.56 | 3.0 | chart axis labels/icons if informational |

Total UI/boundary rows: 7.

### 3.3 Documented non-failures that should remain unchanged

| Pair | Ratio | Why it is acceptable |
|---|---:|---|
| Primary `#0066cc` on white `#FFFFFF` | 5.57 | Passes normal text |
| White on primary `#0066cc` | 5.57 | Passes normal text |
| Dark primary `#2997ff` on dark page `#0e0e10` | 6.40 | Passes normal text |
| Success `#16a34a` button on page `#f5f5f7` | 3.03 | Marginally passes UI boundary threshold, but white text still fails normal text on the fill |
| Light danger `#DC2626` with white text | 4.83 | Passes |
| App text primary `#272729` on page `#f5f5f7` | 13.4 approx | Passes |
| Dark text primary `#f5f5f7` on dark page `#0e0e10` | 17.71 | Passes |
| Dark muted text `#a1a1a6` on dark page `#0e0e10` | 7.50 | Passes |
| Dark portfolio muted `#858688` on `#111827` | 4.87 | Passes |
| Portfolio dark text `#E5E7EB` on `#111827` | passes | Passes |
| White on dark surface `#18181b` | passes | Dark theme chrome |
| Chart semi-transparent gray ticks (`#94a3b8`) only used as decorative/axis labels in small contexts | 2.56 | Should remain decorative or become labels with 4.5:1 text color if axis values are read as data |

## 4. Confirmed token-level failures requiring universal changes

These are safe app-shell corrections because they do not derive from customer appearance JSON:

1. `--color-text-muted` light value 4.29 failed.
2. `--color-text-secondary` light value 4.29 failed.
3. `--color-success` light value fails with white text at normal size.
4. Dark `--color-success` `#4ADE80` fails with white text.
5. Dark `--color-warning` `#EFA820` fails with white text.
6. Dark `--color-danger` `#F87171` fails with white text.
7. Landing `--ink-muted` fails.
8. Landing `--accent` white text fails in the dark variant if used for normal-weight button text.

Total token-level text failures: 8.

## 5. Proposed token-level corrections

### Primary/subtle text

- Replace `#7a7a7a` with `#6b6b70` for app-shell text-muted and text-secondary.
  - `#6b6b70` on white: 5.34
  - `#6b6b70` on `#f5f5f7`: 4.92
- Do not change dark muted values; they already pass.
- Landing `--ink-muted` same replacement in both light and dark? Dark already passes. Use `#6b6b70` light, keep `#a1a1a6` dark.

### Semantic semantic tokens

Use semantic tokens consistently. Required correction principle: button text must match the fill luminance.

Light mode:
- `--color-success`: retain `#16A34A` for checked success icon/outline, but use `#0f5132` text on the fill, or darken success fill to `#14532d` when white text is required.
- `--color-warning`: no change needed for primary, but replace all hardcoded `#d97706` representations with warning tokens. Use white text only if the fill is `#92400e` or darker; otherwise use `#1f2937` text.
- `--color-danger`: retain because white-on-danger passes; no change.
- Light semantic tokens with white text required: `--color-primary` already passes.

Dark mode:
- `--color-success`: use `#4ADE80` as fill but `#052e16` text by default. If white text is required, invert to `#0f766e`? Simpler: black/near-black text on bright fill.
- `--color-warning`: use `#EFA820` fill with `#1f1f23` text rather than white.
- `--color-danger`: use `#F87171` fill with `#1f1f23` text rather than white.

### Dark border and non-text boundary cleanup
- Do not force low-contrast borders to 3:1 everywhere, because many subtle separators are intentional. Increase interactive/focus boundaries and card outline contrast only when used around form controls, focus, and active states.
- Focus ring `var(--color-primary)` already passes (5.11+).
- Toast warning fill currently `#d97706` should either darken to `#92400e` for white text or switch to dark text.

## 6. Portfolio boundary special case

The default portfolio border `#BAE6FD` on `#F0F9FF` fails badly (1.24). However it only affects default/fallback rendering and reset behavior, not globally applied customer colors (because most profiles save explicit values). Proposed correction only updates default-fallback, reset, and newly created profiles; leave stored appearance values untouched.

Customer colors that fail_contrast should be addressed with a non-blocking contrast warning in the builder rather than silent mutations.

## 7. Components affected in Phase 1A

| File | Change |
|---|---|
| `src/app/globals.css` | `--ph-gray-text`, `--color-text-muted`, `--color-text-secondary`, landing `--ink-muted`, combined `-text` semantic colors |
| `src/components/home/HomePage.tsx` | CSS token `--text-muted`; warning button text color (`#d97706` background must use dark text) |
| `src/components/landing/LandingPage.tsx` | ambient fixes only if local; external accent white text handling |
| `src/components/ui/Toast.tsx` | solid color text/fill combinations |
| `src/app/admin/page.tsx` | warning badge text color |
| `src/components/portfolio/analytics/*` | hardcoded chip colors may become primary/accent tokens or chart palette with contrast-safe text |

No database migration is required for any change in this report.
EOF
echo done