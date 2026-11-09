# Phase 1 — Current Color Architecture

Read-only inspection. No source code, CSS, config, schema, database, or dependency changes were made.

## 1. Summary

PortfolioHub has four distinct color/token systems in production:

1. **App shell tokens** in `src/app/globals.css` (CSS variables + Tailwind 4 `@theme inline`), used by dashboard, builder, admin, forms, toasts, shared UI.
2. **Landing-page tokens** scoped to `.landing-page` in the same `globals.css` file, independently redefining conceptually identical colors.
3. **HomePage tokens** injected by `src/components/home/HomePage.tsx` inside `.ph-home`, redefining the same concepts again.
4. **Customer portfolio color system** stored as JSON on `UserProfile.appearance` and resolved inside `ClassicTemplate.tsx` (and `ProjectPageView.tsx`) into component-level CSS variables.

The app-shell system is the primary development target for this phase. Customer portfolio colors are data-driven and are not inherited from app-shell tokens, so app-shell token changes are safe only if they do not modify default seed values silently.

Hardcoded colors are concentrated in Analytics/Admin (slate/blue chart styling), Template defaults, Toasts, and decorative effects.

## 2. Technology baseline

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS v4 via `@tailwindcss/postcss`; theme is configured almost entirely in CSS through `@theme inline`. No separate `tailwind.config.*` file.
- `next-themes` sets light theme by default (`enableSystem=false`).
- Dark mode: `.dark`, `[data-theme="dark"]`, explicit builder `.builder-root[data-theme="dark"]`.
- Global CSS is 468 lines in `src/app/globals.css`.
- Runtime external Google Fonts imports are used globally and per portfolio.

## 3. App shell token system

### 3.1 Legacy ph tokens in `:root` (`globals.css`)

| Variable | Value | Semantic use |
|---|---|---|
| `--ph-navy-deep` | `#272729` | Primary app text / dark surface |
| `--ph-navy-mid` | `#2a2a2c` | Info/subtle text |
| `--ph-gold` | `#0066cc` | Primary brand/link/CTA |
| `--ph-gold-light` | `#0071e3` | Primary hover |
| `--ph-white` | `#FFFFFF` | Surface/text |
| `--ph-gray-light` | `#f5f5f7` | Page background |
| `--ph-gray-mid` | `#e0e0e0` | Borders/hover surface |
| `--ph-gray-text` | `#7a7a7a` | Muted text |
| `--ph-navy-overlay-10/20` | rgba(39,39,41) overlays | Decorative/overlay |
| `--ph-gold-overlay-10/15` | rgba(0,102,204) overlays | Glow/hover |

### 3.2 Semantic Tailwind tokens in `@theme inline`

| Variable | Light value | Dark value | Duplicated by |
|---|---|---|---|
| `--color-page` | `#f5f5f7` via `--ph-gray-light` | `#0e0e10` | `--ph-gray-light` |
| `--color-surface` | `#FFFFFF` | `#18181b` | `--card`, `--popover`, `--dropdown` |
| `--color-surface-secondary` | `#f5f5f7` | `#1f1f23` | none |
| `--color-surface-hover` | `#e0e0e0` | `#27272b` | none |
| `--color-border` | `#e0e0e0` | `#333336` | none |
| `--color-primary` | `#0066cc` | `#2997ff` | landing `--accent`, HomePage `--ph-gold` |
| `--color-primary-hover` | `#0071e3` | `#4aa3ff` | none |
| `--color-primary-light` | rgba(0,102,204,.15) | rgba(41,151,255,.12) | none |
| `--color-accent` | `#272729` | `#2997ff` | `--color-primary` in dark |
| `--color-text-primary` | `#272729` | `#f5f5f7` | `--ph-navy-deep` |
| `--color-text-secondary` | `#7a7a7a` | rgba(255,255,255,.75) | `--color-text-muted` light same, landing `--ink-muted` |
| `--color-text-muted` | `#7a7a7a` | `#a1a1a6` | `--color-text-secondary`, `--ph-gray-text` |
| `--color-success` | `#16A34A` | `#4ADE80` | Toast solid `#16a34a`, client `color-mix` palettes |
| `--color-warning` | `#0066cc` (same as primary) | `#EFA820` | HomePage uses `#d97706`; semantic drift |
| `--color-danger` | `#DC2626` | `#F87171` | Toast solid `#dc2626` |
| `--color-info` | `#2a2a2c` | `#2997ff` | none |

### 3.3 Duplicate aliases

| Alias/group | Defined by | Notes |
|---|---|---|
| `--card`, `--popover`, `--dropdown` | `:root` and `@theme inline` | All alias `--color-surface` |
| `--color-card`, `--color-popover`, `--color-dropdown` | `@theme inline`; dark overrides them | All alias surface |
| `--color-text-secondary` / `--color-text-muted` | same computed value light, different dark | Semantic duplication |
| `--ph-gold` / `--color-primary` | same value | Legacy naming |
| `--ph-gray-light` / `--color-page` / `--color-surface-secondary` | same value | Triplicate role |
| Toast tokens | separate variables | Fixed solid palette, independent of app tokens |

### 3.4 Radii, spacing, shadow

- Radii: `--radius-sm: 4px`, `md: 8px`, `lg: 12px`, `xl: 16px`, `2xl: 20px`, `full: 9999px`.
- `--spacing-unit: 8px` is defined but no component references were found.
- Shadows: light scale `sm`, `md`, `lg`; dark scale adds `xl` in dark block. HomePage/LandingPage define their own shadows.

### 3.5 Global directives and overrides

- `[role="menu"]`, `[role="listbox"]`, Radix poppers, `.dropdown-menu`, `.popover-content` are forced with `!important` in both light and dark modes.
- Selected option/menu colors are overridden globally.
- This is a maintenance risk for future popover components.

## 4. Landing-page token system

Defined in `src/app/globals.css`, scoped under `.landing-page` (and `.landing-page[data-theme='dark']`).

| Token | Light | Dark | Relationship to app shell |
|---|---|---|---|
| `--accent` | `#0066cc` | `#2997ff` | same as `--color-primary` |
| `--accent-focus` | `#0071e3` | `#4aa3ff` | same as `--color-primary-hover` |
| `--accent-on-dark` | `#2997ff` | `#2997ff` | alias accent |
| `--ink` | `#1d1d1f` | `#f5f5f7` | similar but not identical text colors |
| `--ink-muted` | `#7a7a7a` | `#a1a1a6` | same muted failure as app |
| `--canvas` | `#ffffff` | `#0e0e10` | same page canvas |
| `--canvas-alt` | `#f5f5f7` | `#1a1a1d` | similar surface secondary |
| `--tile-1` / `--tile-2` | `#272729` / `#2a2a2c` | `#141417` / `#1e1e21` | decorative tile colors |
| `--hairline`, `--divider`, `--card-hover`, `--glass` | light/dark custom values | separate design |
| `--font-display` | `Six Caps` | `Six Caps` | different display family than app |

Arabic uses `.landing-page[lang='ar']` and switches `--font-primary`, line-height adjustments, and sets heading weight 600, overriding the global Arabic 900 rule via specificity.

## 5. HomePage token system

Defined inside the injected `CSS` string in `src/components/home/HomePage.tsx`, scoped to `.ph-home`.

| Token | Light value | Notes |
|---|---|---|
| `--ph-gold` | `#06c` | equivalent to `#0066cc` |
| `--ph-gold-light` | `#0071e3` | same primary hover |
| `--ph-white` | `#fff` | same |
| `--ph-gray-light` | `#f5f5f7` | same page background |
| `--ph-gray-mid` | `#e0e0e0` | same border/surface-hover |
| `--ph-navy-deep` | `#272729` | same text |
| `--ph-navy-mid` | `#2a2a2c` | same info |
| `--text-primary` | `#18181b` | not identical to app `#272729` |
| `--text-secondary` | `#4a4a4a` | darker muted than app |
| `--text-muted` | `#7a7a7a` | same muted failure |
| `--card` | `#fff` | same surface |
| `--card-hover` | `#f0f0f2` | near surface secondary |
| `--border` | `#e0e0e0` | same border |
| `--danger` | `#dc2626` | same danger |
| `--success` | `#16a34a` | same success |
| `--warning` | `#d97706` | conventional amber, unlike app warning |
| `--border radius scale` | 8–32px | larger than app scale |
| `--shadow-blue` | `rgba(102,204? no, 0,102,204,.18)` | unique |

HomePage is Arabic-only and hardcodes `direction:rtl`. It is not reusable for `/en`.

## 6. Customer portfolio token system

Customer appearance is stored as JSON in `UserProfile.appearance` with validation through `appearanceSchema` in `src/lib/portfolio-schema.ts`.

Public rendering (`ClassicTemplate.tsx` and `ProjectPageView.tsx`) does not consume global app tokens for saved colors. Instead it reads fields with hardcoded fallbacks:

| Appearance field | Fallback when missing/null |
|---|---|
| `primaryColor` | `#38BDF8` |
| `accentColor` | `#818CF8` |
| `bgColorLight` | `#F0F9FF` |
| `bgColorDark` | `#111827` |
| `textColorLight` | `#0F172A` |
| `textColorDark` | `#E5E7EB` |
| `mutedText` | `#64748B` |
| `mutedTextDark` | `#858688` |
| `cardBackground` | `#FFFFFF` |
| `cardBackgroundDark` | `#374151` |
| `borderColor` | `#BAE6FD` |
| `borderColorDark` | `#4B5563` |
| `outlineColor` | primary color |
| `footerBg` | CSS variable fallback `--color-bg` |
| `footerText` | CSS variable fallback `--color-text` |
| `avatarPosition`, font, default color mode | additional behavior |

The template then writes these into a component-local `React.CSSProperties` object with variables such as `--color-primary`, `--color-bg`, `--color-text`, etc., so all descendants render the customer’s saved palette.

Creation-time defaults are set in `src/lib/actions/portfolio.ts` for new profiles, and reset defaults are defined in `ThemeSettings.tsx`. These are currently aligned to the legacy slate/sky palette.

## 7. Shared UI primitives

- `src/components/ui/Button.tsx`: five variants; semantic app tokens (`--color-primary`, `--color-danger`, `--color-success`).
- `src/components/ui/Input.tsx`: token colors; radius 14px versus button 8px.
- `src/components/ui/Toast.tsx`: solid hardcoded colors for success/error/warning; info uses surface tokens. Token variables would improve consistency.
- Admin pages: mostly token-based, but light/dark semantic warning badge uses `--color-warning` and therefore inherits the brand-blue light warning issue.

## 8. Hardcoded color locations

Top hardcoded hex usage from `src`:

| Hex | Count | Main locations | Classification |
|---|---:|---|---|
| `#0f172a` | 36 | Analytics UI dark text | Should become dark text token |
| `#2563eb` | 20 | Analytics buttons/badges/charts | Should become primary/analytics token; investigate branding |
| `#161b26` | 13 | Analytics dark surface | Should become dark surface token/equivalent |
| `#ffffff/#FFFFFF` | 25 combined | surfaces/text | semantic surface/text token |
| `#f5f5f7` | 13 | backgrounds | shell surface/page |
| `#18181b` | 12 | dark surfaces/text | shell dark text/surface |
| `#38BDF8` / `#818CF8` | 9 / 5 | template defaults, creator defaults, reset | Default-only legacy customer palette |
| `#2997ff` / `#4aa3ff` | 8 / 3 | dark primary/accent | shell token |
| `#7a7a7a` | 6 | muted text | accessibility failure |
| `#D4A017` | 5 | `PortfolioBottomNav` active icon, badge backgrounds | investigate: deliberate gold highlight or brand drift |
| `#f8fafc`, `#F0F9FF`, `#BAE6FD`, `#64748B` | 7 / 5 / 5 / 5 | portfolio defaults, analytics surfaces | Default-only palette / repeated token opportunity |
| `#f97316`, `#3b82f6`, `#8b5cf6`, `#06b6d4`, `#10b981`, `#e8c547` | 2-3 each | charts or project card badges/status | chart palette, mostly legitimate |
| `#ff5f57`, `#febc2e`, `#28c840` | 1 each | HomePage fake window controls | decorative only |

Additional RGB/RGBA literals are used for glass, overlays, decorative tile effects, and chart ticks; these are mostly localized to HomePage/LandingPage decorative wrappers.

## 9. Dynamic and inherited color paths

- `ClassicTemplate.tsx` passes colors through `React.CSSProperties` and then consumes them via inline variable references; this protects saved colors from global CSS variable changes.
- `PortfolioFooter.tsx` resolves footer values and passes them as inline styles.
- `PortfolioBottomNav.tsx` uses saved primary when available but hardcodes `#D4A017` for the active project-page highlight.
- Charts use hardcoded Tailwind blue/slate/green/orange palettes rather than theme-aware token variables.
- Admin warning is token-based but light mode warning is brand blue, so its visual meaning is weak.

## 10. Non-color style-related direction issues (collected for Phase 1C)

Physical directional utilities found:
- `mr-1.5` (6 occurrences) in `ThemeSettings.tsx` mode toggle icons.
- `pl`/`pr` and `text-left`/`text-right` across `ProjectViews.tsx`, `ViewsChart.tsx`, `AnalyticsDashboard.tsx` (tables and inputs).
- Arabic `text-right` inputs are explicit and acceptable.
- Most portfolio code uses logical `ms/me`/`ps/pe` utilities.

No changes were made.
EOF
echo done