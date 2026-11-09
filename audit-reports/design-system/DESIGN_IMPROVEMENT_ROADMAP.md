# Design Improvement Roadmap

Priorities: **P0** critical (a11y/usability/broken config) · **P1** high · **P2** medium · **P3** optional.
`DB?` = requires a database change. `Existing?` = could affect current customer portfolios.

| ID | P | Finding | Evidence | User impact | Suggested improvement | Benefit | Complexity | DB? | Existing? | Risks |
|---|---|---|---|---|---|---|---|---|---|---|
| DS-01 | P0 | Dark-mode semantic colors (success/warning/danger) fail contrast with white text | `globals.css:151-153`; `Button.tsx:22-25`; `toast` tokens `globals.css:69-72`; `admin/page.tsx:220` | Buttons/toasts/admin badges become hard to read in dark mode | Use dark text on light dark-mode semantic fills, or darken fills; add contrast test | WCAG AA, fewer misreads | Low | No | No | Changing tokens affects app UI only; verify both modes |
| DS-02 | P0 | Muted/secondary text token fails AA (4.29 on white, 3.94 on page) | `globals.css:55,91`; landing `--ink-muted` | Table labels, helper text, metadata hard to read | Darken light-mode muted token to ≥4.5:1 (e.g. `#6b6b6b`) and adjust dark equivalent | Readability | Low | No | No | Broad visual change; check all muted usages |
| DS-03 | P0 | Portfolio color pickers allow unreadable text/background pairs and publish them | `ThemeSettings.tsx:344-452`; `ClassicTemplate.tsx:382-435` | Customers can publish invisible text (credibility loss) | Add live contrast check + non-blocking warning (or safe auto-fix suggestion) before save | Prevents broken portfolios | Medium | No | Only if user changes settings | Don't silently alter saved colors |
| DS-04 | P1 | Three parallel token systems; `/` and `/en` are different landing designs | `HomePage.tsx` `.ph-home` tokens; `LandingPage.tsx` `.landing-page` tokens; `globals.css` app tokens | Inconsistent brand between languages | Unify landing on one token contract + one component; keep Arabic/English variants | Brand consistency, less CSS | High | No | Marketing only | Large visual change; needs screenshots |
| DS-05 | P1 | Only one portfolio template | `src/components/portfolio/templates/` contains `ClassicTemplate.tsx` only | All portfolios look structurally identical | Add a second template behind a template picker (thumbnail + name) | Differentiation, perceived value | High | No (template id in content/appearance) | New choice only; default unchanged | Layout/renderer QA cost |
| DS-06 | P1 | No palette presets; 13 raw color fields | `ThemeSettings.tsx:302-466` | Decision fatigue, inconsistent portfolios | Add 4–6 curated palettes (light+dark pairs) + "apply" with undo | Faster, more professional results | Medium | No | Only on apply | Palette contrast must be pre-validated |
| DS-07 | P1 | Color drift: analytics uses `#2563eb` (20×), hardcoded `#0f172a` (36×) | `AnalyticsDashboard.tsx`, `ViewsChart.tsx`, `ProjectViews.tsx`, `BuilderClient.tsx` | Visual inconsistency inside builder | Replace with `var(--color-primary)` / tokens | Cohesion | Low–Medium | No | No | Low |
| DS-08 | P1 | Footer colors + logo supported but no UI | `portfolio-schema.ts:613-614`; `ClassicTemplate.tsx:2532-2533`; `ThemeSettings` | Users cannot finish customization they expect | Expose in existing Theme panel | Completes feature | Low | No | Only when used | None |
| DS-09 | P1 | Render-blocking font chain: 3 Google `@import`s + per-portfolio `<link>` | `globals.css:1-3`; `ClassicTemplate.tsx:406,1963` | Slower first paint, LCP | Self-host/next/font; load portfolio font on demand; drop unused families | Performance | Medium | No | Portfolio font rendering | Font fallback flash |
| DS-10 | P1 | Radius drift: Input 14px vs Button 8px vs arbitrary 24/28px | `Input.tsx:30`; `Button.tsx:45`; grep counts | Inconsistent component shapes | Adopt one radius contract (control 10–12px, card 16px, modal 20px) | Cohesion | Low | No | No | Broad but cosmetic |
| DS-11 | P1 | RTL spacing bugs in ThemeSettings and analytics | `ThemeSettings.tsx:227-259` (`mr-1.5`); `ProjectViews.tsx` / `ViewsChart.tsx` physical `pl/pr` | Mirrored spacing/alignment wrong in Arabic | Replace with logical `ms/me/ps/pe/text-start` | Correct RTL | Low | No | No | Low |
| DS-12 | P2 | Light-mode `--color-warning` equals brand blue | `globals.css:93` | Warning states don't read as warnings | Use amber token in both modes; keep contrast | Semantic clarity | Low | No | App UI | Verify admin usage |
| DS-13 | P2 | Default portfolio border `#BAE6FD` on `#F0F9FF` = 1.24 | `ClassicTemplate.tsx` defaults | Card boundaries nearly invisible | Darken default border or use `color-mix` | Definition | Low | No | New/default portfolios | Existing saved colors unaffected |
| DS-14 | P2 | No font preview or pairing guidance | `ThemeSettings.tsx:268-299` | Users guess font fit | Show preview text + recommend AR/EN pairs | Better choices | Low | No | No | Remote font preview latency |
| DS-15 | P2 | "Reset defaults" uses legacy palette and skips keys | `ThemeSettings.tsx:139-162` | Reset doesn't match brand; incomplete | Reset to documented brand palette; include all appearance keys | Predictability | Low | No | Yes (on reset) | Explain in UI |
| DS-16 | P2 | No section-level style controls | `ClassicTemplate.tsx` alternates backgrounds automatically | Limited art direction | Optional per-section background/tone preset | Flexibility | High | Maybe (content JSON) | Yes (new optional field) | Scope creep; keep additive |
| DS-17 | P2 | 9:16 aspect cards become very tall in 3-col grid | `ProjectCard.tsx` aspect handling; `getDynamicGridCols` | Awkward grids, long scroll | Adapt columns by dominant ratio (2-col for portrait) | Better composition | Medium | No | No | Visual change only when ratio set |
| DS-18 | P2 | Emoji used in Theme panel headings | `ThemeSettings.tsx:177,306,427` | Tone inconsistency | Replace with Lucide icons | Consistency | Low | No | No | None |
| DS-19 | P2 | No template naming clarity ("Theme" = colors) | Builder right panel | Users expect template switch | Rename to "Appearance"/"Design" and reserve "Template" for layouts | Clarity | Low | No | No | None |
| DS-20 | P2 | No project tag filtering on public portfolios | `ClassicTemplate` projects section | Hard to browse many projects | Optional tag filter (client-side) | Discoverability | Medium | No | No | Adds UI complexity |
| DS-21 | P3 | Icon stroke widths not standardized | `lucide-react` usage across app | Subtle visual inconsistency | Standardize `strokeWidth` constant | Polish | Low | No | No | None |
| DS-22 | P3 | No per-portfolio favicon/social default image customization | `app/layout` + dynamic `/og` | Generic share identity | Add optional favicon/OG override | Branding | Medium | Maybe | No | Upload/storage policy |
| DS-23 | P3 | No English/Arabic design QA harness | project tests | Regressions possible | Add screenshot matrix (manual/CI later) | Quality | Medium | No | No | No browser automation allowed now |
| DS-24 | P3 | Landing uses `Material Icons` external stylesheet (HomePage) | `src/app/page.tsx:68-72` | Extra request | Replace with Lucide/local icons | Perf/consistency | Low | No | Marketing | Icon fidelity |

## Recommended order
1. DS-01, DS-02, DS-03 (a11y + published quality, low risk).
2. DS-07, DS-08, DS-11, DS-10 (cohesion/quick fixes).
3. DS-06, DS-14, DS-15 (palette/preset UX).
4. DS-09 (performance).
5. DS-04, DS-05, DS-16 (larger design work; require approval/design review).

## Explicitly do not change
- Do not auto-rewrite existing customer portfolios or their saved colors.
- Do not remove the single-template default.
- Do not add free-form CSS or arbitrary HTML.
- Do not change billing/subscription behavior.
- Do not alter RTL behavior that already works; only fix confirmed physical-spacing cases.
