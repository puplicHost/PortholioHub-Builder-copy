# Design System Audit — PortfolioHub

Read-only audit. No source files were changed.

## 1. Stack & styling approach
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), `next/font` (Inter, Space Grotesk) + Google Fonts `@import` for Cairo/Cairo Play/Space Mono/Six Caps (`src/app/globals.css:1-3`).
- Tokens are CSS variables defined in `:root` / `@theme inline` / `.dark` (`globals.css:47-180`).
- Component primitives: `src/components/ui/{Button,Input,Card,Toast,Skeleton,EmptyState}.tsx`; builder-specific `src/app/profile/builder/ui/*`.
- One public template: `src/components/portfolio/templates/ClassicTemplate.tsx` (2,571 lines).
- Two marketing pages with separate token systems: `HomePage` for `/` (`src/components/home/HomePage.tsx`) and `LandingPage` for `/en` (`src/components/landing/LandingPage.tsx`).
- Admin reuses app tokens (`AdminLayoutShell.tsx` uses `var(--color-*)`).

## 2. Global tokens (app shell)
| Token | Light | Dark | Notes |
|---|---|---|---|
| `--color-primary` | `#0066cc` (`--ph-gold`) | `#2997ff` | brand blue; token name `ph-gold` is legacy |
| `--color-primary-hover` | `#0071e3` | `#4aa3ff` | |
| `--color-page` | `#f5f5f7` | `#0e0e10` | |
| `--color-surface` | `#FFFFFF` | `#18181b` | |
| `--color-surface-secondary` | `#f5f5f7` | `#1f1f23` | |
| `--color-border` | `#e0e0e0` | `#333336` | |
| `--color-text-primary` | `#272729` | `#f5f5f7` | |
| `--color-text-secondary`/`muted` | `#7a7a7a` | `rgba(255,255,255,.75)` / `#a1a1a6` | contrast issue below |
| `--color-success` | `#16A34A` | `#4ADE80` | |
| `--color-warning` | `var(--ph-gold)` = `#0066cc` | `#EFA820` | warning is brand-blue in light mode (semantic drift) |
| `--color-danger` | `#DC2626` | `#F87171` | |
| `--color-info` | `#2a2a2c` | `#2997ff` | |

Radii: `4/8/12/16/20/9999px` (`globals.css:108-113`). Shadow scale: 3 light / 3 dark. Spacing: `--spacing-unit: 8px` is defined but not referenced in components (grep found no usage).

## 3. Typography
- App: Inter (`--font-sans`), Space Grotesk (`--font-display`), Cairo Play (`--font-arabic`); Arabic overrides map `font-sans`/`font-display` to Cairo family and force `h1–h4` weight 900 (`globals.css:224-249`).
- Portfolio: per-user font from a 15-font list (Inter, Cairo, Poppins, Raleway, Nunito, Lato, Montserrat, Rubik + 6 serifs) loaded via a runtime Google Fonts `<link>` (`ClassicTemplate.tsx:406,1963`). No type scale tokens for the portfolio (sizes are Tailwind utilities per section).
- Landing: `HomePage` uses Space Grotesk/Cairo/Inter/Space Grotesk-mono; `LandingPage` uses Inter + Six Caps (`globals.css:408-409`, `HomePage.tsx` CSS block).

## 4. Color consistency findings
- **Three parallel token systems**: app (`globals.css`), `HomePage` (`.ph-home` CSS with its own radii 8–32px and `--warning:#d97706`), `LandingPage` (`.landing-page` tokens). Same concepts have different values and naming.
- **Hardcoded hex outside tokens**: 36× `#0f172a`, 20× `#2563eb`, 13× `#161b26`, plus `#f8fafc`, `#D4A017` etc. (grep). Analytics uses `#2563eb` while the brand primary is `#0066cc` (`AnalyticsDashboard.tsx`, `ViewsChart.tsx`, `ProjectViews.tsx`).
- **Duplicated tokens**: `--color-surface`/`--card`/`--color-card`/`--popover`/`--dropdown` all alias the same values (`globals.css:79-102`).
- **Precedence overrides**: global `!important` rules for `[role=menu]`, `[role=listbox]`, Radix poppers, `.dropdown-menu`, `.popover-content` (`globals.css:182-213`) — a maintenance risk when components add new popovers.
- **Gradients**: primary→accent gradient is user-controlled (`ThemeSettings.tsx:458-464`) and used in the portfolio (`ClassicTemplate.tsx:2363`); no gradient token in the app shell.

## 5. Contrast (computed from token values)
| Pair | Ratio | WCAG AA (normal text 4.5) |
|---|---:|---|
| `#7a7a7a` on `#FFFFFF` (muted/secondary) | **4.29** | FAIL |
| `#7a7a7a` on `#f5f5f7` (page) | **3.94** | FAIL |
| `#0066cc` on `#FFFFFF` (primary) | 5.57 | PASS |
| `#FFFFFF` on `#0066cc` | 5.57 | PASS |
| `#FFFFFF` on `#16A34A` (success button/toast) | **3.30** | FAIL normal |
| `#FFFFFF` on `#EFA820` (dark warning) | **2.04** | FAIL |
| `#FFFFFF` on `#4ADE80` (dark success) | **1.74** | FAIL |
| `#FFFFFF` on `#F87171` (dark danger) | **2.77** | FAIL |
| `#BAE6FD` on `#F0F9FF` (default portfolio border) | **1.24** | FAIL UI boundary 3:1 |
| `#64748B` on `#F0F9FF` (default muted text) | 4.46 | Marginal FAIL |

Locations: `globals.css:55,91,151-153`; `Button.tsx:22-25` (`success` uses white text); `toast` tokens `globals.css:69-72`; admin warning `src/app/admin/page.tsx:220`.

## 6. Components
- **Button** (`Button.tsx`): 5 variants, 2 sizes (`h-9`, `h-[42px]`), `focus-visible:ring`, radius `--radius-md` (8px).
- **Input** (`Input.tsx`): `h-12` (48px), `rounded-[14px]`, label above, error below, token colors. Radius differs from Button (14 vs 8).
- **Cards**: no shared Card usage by portfolio templates; cards use `--color-card`, `--color-card-border`, radius `15px` (`ClassicTemplate.tsx:427`).
- **Icons**: `lucide-react` everywhere except two hand-written social SVGs in `HomePage.tsx` and `LandingPage` social icons. Stroke width not standardized.
- **Toast**: solid tokens; success/error white text contrast noted above.
- **Loading/empty/error**: shared `Skeleton`, `EmptyState`, `ErrorBoundary`, `error.tsx`, `loading.tsx`.

## 7. Theme capability matrix (app)
| Capability | Status |
|---|---|
| Light/dark global | Yes (`next-themes` + `.dark`, `[data-theme=dark]`) |
| Theme toggle | Yes (`ThemeProvider`, `defaultTheme=light`, system disabled) |
| Per-portfolio color mode | Yes (`defaultColorMode`: light/dark/light-with-toggle/dark-with-toggle) |
| Per-portfolio colors | Yes (primary, accent, outline, bg, card, text, muted, border; light+dark) |
| Palette presets | **No** (raw color pickers only) |
| Typography presets/pairings | **No** (single font dropdown) |
| Template gallery / second template | **No** (one `ClassicTemplate`) |
| Per-section theme variants | **No** (automatic alternating backgrounds) |
| Contrast validation / warnings | **No** |
| Reset to defaults | Yes, but resets to the legacy slate/sky palette (`ThemeSettings.tsx:139-162`) |
| Footer bg/text, logo URL | Stored/supported in schema+render, **no UI** (`portfolio-schema.ts:613-614`, `ClassicTemplate.tsx:2532-2533`) |

## 8. RTL / LTR
- Root sets `lang`/`dir` from cookie (`layout.tsx:66-89`); Arabic font override and RTL input alignment in `globals.css:224-277`.
- Portfolio uses logical utilities (`ps/pe/start/end`, `cq-*`), mostly correct.
- Residual physical spacing: `mr-1.5` in `ThemeSettings.tsx:227-259`; analytics tables use `pl/pr/text-right` with only partial `rtl:` overrides (`ProjectViews.tsx`, `ViewsChart.tsx`); `UserTimeline.tsx:80` has explicit RTL overrides.
- `HomePage` hardcodes `direction:rtl` inside `.ph-home` (fine for `/`, would break if reused for `/en`).

## 9. Accessibility strengths
- Global `*:focus-visible` outline (`globals.css:332-335`), reduced-motion block (`337-346`), 44px builder mobile targets (`348-370`), skip of `h-screen` (template uses `min-h`), semantic headings in template, `aria-label`s on icon buttons, `role=switch`/`aria-checked` in `ThemeSettings`, `role=progressbar` in storage UI.

## 10. Maturity assessment
**6/10.** The app shell has a coherent token system, dark mode, RTL, focus and reduced-motion handling. It loses points for three divergent token systems, confirmed contrast failures in semantic colors, hardcoded color drift, a single template, raw color controls with no contrast guardrails, and hidden appearance settings.
