# Phase 1 — Proposed Unified Token Architecture

Read-only proposal. This document defines a target token set for implementation later. No CSS, Tailwind, component, or configuration changes were made.

## 1. Design constraints

- Keep the existing Tailwind CSS v4 (`@theme inline`) setup.
- Preserve the existing brand blue (`#0066cc` light / `#2997ff` dark) as the global primary.
- Preserve customer portfolio color resolution; do not let global tokens override saved appearance values.
- Keep chart, status, and contrast-safe combinations as documented.
- Reduce duplicated tokens to **role-based** names, while preserving backward-compatible aliases during a migration period if needed.
- Do not introduce new abstractions unless used by at least real components, routes, or tokens in the current repo.

## 2. Core architecture

### 2.1 Brand tokens (customer-facing brand, not portfolio colors)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-brand-primary` (alias `--color-primary`) | `#0066cc` | `#2997ff` | Links, CTAs, focus, active nav |
| `--color-brand-primary-hover` (alias `--color-primary-hover`) | `#0071e3` | `#4aa3ff` | Hover/pressed primary state |
| `--color-brand-primary-subtle` (`primary-light`) | `rgba(0,102,204,.12)` | `rgba(41,151,255,.12)` | Tinted backgrounds |
| `--color-brand-accent` (alias current `--color-accent` where appropriate) | `#272729` | `#2997ff` | Secondary brand action / old call-site preservation |
| `--color-brand-gradient` | `linear-gradient(135deg,#0066cc,#0071e3)` | same with dark values | Hero/feature highlights |

Preferred canonical classes over aliases:
- New code should use `--color-brand-primary-*`.
- Existing `--color-primary*` remains supported as aliases for compatibility.

### 2.2 Surface tokens

| Token | Light | Dark |
|---|---|---|
| `--color-surface-page` (alias `--color-page`) | `#f5f5f7` | `#0e0e10` |
| `--color-surface-base` (alias `--color-surface`) | `#FFFFFF` | `#18181b` |
| `--color-surface-secondary` | `#f5f5f7` | `#1f1f23` |
| `--color-surface-tertiary` (partially `--color-surface-hover`) | `#e0e0e0`? Recommend `#f0f0f2` | `#27272b` |
| `--color-surface-overlay` | `rgba(255,255,255,.88)` | `rgba(22,22,24,.88)` |
| `--color-surface-card` alias | surface base | surface base |
| `--color-surface-popover` alias | surface base | surface base |

Aliases must remain internally defined. Do not let components refer to multiple duplicate names.

### 2.3 Text tokens

| Token | Light | Dark | Requirement |
|---|---|---|---|
| `--color-text-primary` | `#272729` | `#f5f5f7` | Primary body text |
| `--color-text-secondary` (revised) | `#4a4a4a` | `rgba(255,255,255,.82)` | Secondary labels/metadata |
| `--color-text-muted` (revised) | `#6b6b70` | `#a1a1a6` | Tertiary/help text |
| `--color-text-disabled` | `#a3a3a8` | `rgba(255,255,255,.45)` | Disabled controls only; not required for AA but readable |
| `--color-text-inverse` | `#FFFFFF` | `#1f1f23` | high-contrast text on brand fills in context |

Text-token changes must be validated against page, secondary surface, and card backgrounds.

### 2.4 Border tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-border-subtle` (alias `--color-border`) | `#e0e0e0` | `#333336` | Decorative separators, nonessential rules |
| `--color-border-strong` | `#a1a1a6` | `#6b6b70` | Input/control boundaries requiring clearer contrast |
| `--color-border-focus` alias brand primary | `#0066cc` | `#2997ff` | focus |

Keep the existing universal token names in use, but distinguish strong/interactive boundaries rather than making all borders darker.

### 2.5 Semantic tokens

Introduce `text-on-*` tokens for colored fills. This avoids guessing with white text.

| Token | Light | Dark | On-color text token | On-color text value |
|---|---|---|---|---|
| `--color-success` | `#16A34A` | `#4ADE80` | `--color-on-success` | `#052e16` both modes |
| `--color-warning` | `#b45309` | `#EFA820` | `--color-on-warning` | `#ffffff` light / `#1f1f23` dark |
| `--color-danger` | `#DC2626` | `#F87171` | `--color-on-danger` | `#ffffff` light / `#1f1f23` dark |
| `--color-info` | `#0066cc` | `#2997ff` | `--color-on-info` | `#ffffff` both modes |

Light warning is intentionally changed from brand blue to a conventional amber that still meets white-text contrast. This is a semantic correction only and does not affect customer portfolio appearance.

### 2.6 Interactive state tokens

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--state-hover-overlay` | `rgba(39,39,41,.06)` | `rgba(255,255,255,.06)` | hover surfaces |
| `--state-active-overlay` | `rgba(0,102,204,.10)` | `rgba(41,151,255,.15)` | active selected |
| `--state-focus-ring` alias brand primary | `#0066cc` | `#2997ff` | focus |
| `--state-disabled-opacity` | `0.50` | `0.45` | uniform disabled UX |
| `--state-selected-ring` | brand primary | brand primary | selected cards/rows |

## 3. Tokens that should remain specialized

### Chart palette (must not be replaced by brand color)

Use a documented semantic chart token group rather than scattered hex values:

| Token | Value | Role |
|---|---|---|
| `--chart-1` | `#2563eb` | primary distribution series (same as brand optional, but text-on-chart is `#ffffff`) |
| `--chart-2` | `#3b82f6` | secondary series |
| `--chart-3` | `#10b981` | positive/quantitative series |
| `--chart-4` | `#f97316` | tertiary/warning-like series |
| `--chart-5` | `#8b5cf6` | auxiliary series |
| `--chart-6` | `#06b6d4` | auxiliary/gradient |
| `--chart-positive` | `#10b981` | positive delta |
| `--chart-negative` | `#dc2626` | negative delta |
| `--chart-neutral` | `#64748b` | axis/neutral indicator |
| `--chart-grid` | `rgba(148,163,184,.3)` | gridlines |
| `--chart-axis-text` | `#4a4a4a` light / `#a1a1a6` dark | axis labels |

Dark-mode chart colors must retain contrast-safe text and grid opacity. The chart palette should be a named group and not imported into ordinary UI.

Project card visual accents (`#3b82f6`, `#f97316`, `#8b5cf6`, `#06b6d4`) are intentional category colors and can remain, but real badge text should be dark text on each fill or darken each fill to support white text.

### Decorative colors

These may remain deliberately hardcoded:
- HomePage fake macOS window dots (`#ff5f57`, `#febc2e`, `#28c840`).
- Hero orbs (`#4a9eff`) and mesh backgrounds.
- Decorative overlays with alpha.

## 4. Customer portfolio tokens remain outside this system

The unified app token system does **not** change customer portfolio token resolution. Colors from `appearance` continue to use component-level variables such as `--color-primary`, `--color-bg`, `--color-text`, defined locally in `ClassicTemplate.tsx` and `ProjectPageView.tsx`.

If customer color values are null, the current hardcoded fallbacks remain unless approved under category B. Their contrast should be improved during any future default correction.

## 5. Recommended de-duplication approach

1. Define a single canonical variable for each role in `globals.css`.
2. Immediately beneath it, define old names as aliases through `var(...)` so no component changes are required before alias cleanup.
3. Upgrade components gradually to canonical names.
4. Remove obsolete aliases only after grep confirms zero usage.
5. Avoid centralized “theme object” runtime state; keep server-rendered CSS variables, which already work with next-themes and customer portfolio wrappers.

## 6. Compatibility notes

- Tailwind 4’s `@theme inline` treats these variables as theme extensions; no JS config needed.
- `next-themes` class and data-theme selectors already provide forward-compatible dark mode.
- RTL is served through `[dir='rtl']`, and CSS logical properties can replace physical spacing without affecting tokens.
- Avoid altering `className` based on theme state; rely on CSS variables.
EOF
echo done