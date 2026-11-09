# Global Settings Inventory

Appearance settings live in `UserProfile.appearance` (JSON) and `UserProfile.localized`; validated by `appearanceSchema` (`src/lib/portfolio-schema.ts:595-632`). UI is `src/app/profile/builder/ThemeSettings.tsx` (default right panel when no section is selected). Persistence: builder state → `updatePortfolio` server action → Prisma `appearance` JSON. Public rendering: `ClassicTemplate.tsx:374-435`, `1895-1963`.

## Inventory

| Setting | Exists | UI | Persists | Affects published page | Notes / gaps |
|---|---|---|---|---|---|
| Username | Yes | ThemeSettings:189-213 | Yes | Yes (URL) | validation + reserved list server-side |
| Default color mode (4 options) | Yes | ThemeSettings:215-266 | Yes | Yes | `light/dark/light-with-toggle/dark-with-toggle` |
| Visitor theme toggle visibility | Yes | ThemeSettings:515-532 | Yes | Yes | only shown when mode includes toggle |
| Font family | Yes | ThemeSettings:268-299 | Yes | Yes | 15 fonts, no pairing presets, loaded via Google Fonts link |
| Primary color | Yes | ThemeSettings:424-436 | Yes | Yes | raw color picker; no contrast check |
| Accent color | Yes | ThemeSettings:437-444 | Yes | Yes (gradient) | |
| Outline color | Yes | ThemeSettings:445-452 | Yes | Yes | |
| Light bg / card / text / muted / border | Yes | ThemeSettings:344-382 | Yes | Yes | 5 independent pickers, no preset palette |
| Dark bg / card / text / muted / border | Yes | ThemeSettings:383-421 | Yes | Yes | same |
| Footer background/text | **Render+schema only** | **No UI** | if set | Yes | `appearance.footerBg/footerText` (`portfolio-schema.ts:613-614`, `ClassicTemplate.tsx:2532-2533`) |
| Logo URL | **Schema only** | **No UI** | if set | not clearly consumed by template | `appearance.logoUrl` allowed, no editor |
| Avatar position (focal point) | Yes | elsewhere in Builder | Yes | Yes | `avatarPosition` x/y |
| Language mode (ar/en/both) | Yes | builder locale/section | Yes | Yes | `defaultLanguage` / `n` |
| Project card visual (image/file-icon/video/none) | Yes | Builder/ProjectManager | Yes | Yes | per item `itemCards` |
| Image/video aspect ratio | Yes | Builder/ProjectManager | Yes | Yes | new `imageAspect`/`videoAspect` |
| Image fit (cover/contain) | Yes | Builder/ProjectManager | Yes | Yes | |
| Section visibility | Yes | Sections list | Yes | Yes | `settings.isVisible` |
| Section order | Yes | dnd-kit | Yes | Yes | `sectionOrder` |
| Section heading/description/icons | Yes | per-section editors | Yes | Yes | |
| Project card link/label/extra links | Yes | Builder | Yes | Yes | |
| WhatsApp floating button + number | Yes | ThemeSettings:468-513 | Yes | Yes | |
| Scroll-to-top button | Yes | ThemeSettings:472-482 | Yes | Yes | |
| SEO title/description/OG | Partial | metadata from profile fields | Yes | Yes | no dedicated SEO editor; uses display name/bio |
| Navigation labels/order | Auto-derived | none | — | Yes | no explicit nav editor |
| Template selection | **No** | — | — | — | single `ClassicTemplate` |
| Preset palettes | **No** | — | — | — | competitors offer curated palettes |
| Typography scale / density | **No** | — | — | — | fixed section typography |
| Per-section background/theme | **No** | — | — | — | template alternates automatically |
| Contrast validation | **No** | — | — | — | users can publish unreadable color pairs |
| Reset to defaults | Yes | ThemeSettings:139-162 | Yes | Yes | resets to legacy `#38BDF8/#818CF8` palette, not app brand and not footer/logo |
| Custom CSS | No | — | — | — | |
| Favicon / site icon per portfolio | No | — | — | — | platform favicon only |

## Settings organization
ThemeSettings groups: Portfolio Settings (username, color mode, font) → Site Colors (light/dark tabs, 10 pickers) → Primary & Accent (3 pickers + gradient preview) → Floating Buttons. Content editing is separated into Sections/Projects tabs, so "content vs appearance" is generally clear; the Theme entry point is the panel header button or deselecting a section.

## Key gaps
1. No curated palette/preset system despite 13 color pickers.
2. Footer colors and logo are supported by schema but unreachable in UI.
3. No contrast guardrail or warning for any user-selected text/background pair.
4. Reset produces a palette inconsistent with the current app brand and does not reset every appearance key.
5. No template choice or per-section styling; one visual layout only.
6. Font list mixes Latin and Arabic families with no pairing/scale guidance.
