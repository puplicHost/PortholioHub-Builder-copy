# PortfolioHub — Design System (DESIGN.md)

> Extracted from the reference code: `index.html` (public landing page, primary source of truth) and `dashboard.html` (admin panel, secondary). All values below are copied verbatim from the code — nothing invented. Anything absent from the code is marked **"not defined"**.

---

## 1. Overview

**Feel.** A minimal, Apple-inspired marketing one-pager for a service that builds portfolios for content writers. The page alternates full-bleed light (`#ffffff`) and dark tile (`#272729`-family) sections like a museum wall; a single Action Blue accent carries every interactive signal; typography is large, tight, and confident (Arabic-first, Cairo font, weight 600). Motion is restrained: soft blur orbs floating behind the hero, 28px scroll-reveals, subtle 4px card lifts. Luxury level: high-end product-marketing restraint — big type, huge whitespace, near-invisible chrome, no imagery of the product itself except portfolio screenshots.

**Core design principles (max 5):**

1. **One accent only.** All interactive color is a single blue family (`#0066cc` light / `#2997ff` dark). No second brand color exists.
2. **Surface alternation = section divider.** Light tile → dark tile → light tile; the background color change IS the separator. No decorative borders between sections.
3. **Big type, negative tracking.** Headlines are huge (up to 120px) at weight 600 with `letter-spacing: -0.02em` (Latin). Arabic resets tracking to 0 and raises line-height.
4. **Flat UI.** Cards get 1px hairline borders and color-shift hover; shadows exist only on hover state and over imagery. No stacked elevation.
5. **Arabic-first RTL.** The page defaults to `dir="rtl"` + Cairo; logical properties (`margin-inline-start`, `inset-inline-start`, `padding-inline-end`) are used so the same CSS serves LTR/EN.

**The agent must avoid:**

- Emojis in the landing UI (the dashboard uses a few 💰💸📈📊 in stat labels — do not copy that onto the landing page).
- Random/decorative gradients. The only gradients are: hero blur orbs, the project-image hover scrim, and skeleton shimmer (all specified in §2/§5).
- Heavy shadows on resting elements. Only hover-state shadows (`0 8px 24px rgba(0,102,204,0.25)`, `0 20px 48px rgba(0,0,0,0.35)`).
- Multiple accent colors, serif fonts, banners with drop caps, illustrated blobs.
- Hard `left/right` margins where logical properties (`margin-inline-*`) exist in the reference.

---

## 2. Color System

### 2.1 Token table (light mode — `:root` / default)

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#0066cc` | Primary CTA bg, links, icons, section labels/numbers, active states, scrollbar thumb |
| `--accent-focus` | `#0071e3` | Hover bg of primary CTAs, WhatsApp float hover |
| `--accent-on-dark` | `#2997ff` | Accent variant used **on dark tiles** (labels, numbers, quotes, project type/link, why-`?` chip) |
| `--ink` | `#1d1d1f` | Primary text on light surfaces; hamburger bars |
| `--ink-muted` | `#7a7a7a` | Secondary text on light surfaces, nav links, footer links |
| `--canvas` | `#ffffff` | Page bg (light sections, hero) |
| `--canvas-alt` | `#f5f5f7` | Light card bg (service/feature cards), footer bg, scrollbar track, lang-switch bg |
| `--tile-1` | `#272729` | Dark section bg (`section-dark`) |
| `--tile-2` | `#2a2a2c` | Dark card bg (project cards, question list items), project media placeholder |
| `--hairline` | `#e0e0e0` | Stronger 1px border (theme toggle, lang switch, project card border, ghost button, platform chips) |
| `--divider` | `#f0f0f0` | Softer 1px border (light card borders, footer top/bottom rules, scrolled header border) |
| `--on-dark` | `#ffffff` | Text on dark tiles |
| `--on-primary` | `#ffffff` | Text/icons on accent bg |
| `--glass` | `rgba(255,255,255,0.88)` | Scrolled header bg (+ `blur(20px)`) |
| `--glass-solid` | `rgba(255,255,255,0.96)` | Mobile menu overlay bg (+ `blur(24px)`) |
| `--glass-bottom` | `rgba(255,255,255,0.92)` | Mobile bottom nav bg (+ `blur(20px)`) |
| `--card-hover` | `#f0f0f2` | Light card hover bg |
| `--tile-hover` | `#323234` | **Dead token — defined but never used in any file** |

### 2.2 Dark mode (`html[data-theme="dark"]`)

| Token | Value | Notes |
|---|---|---|
| `--accent` | `#2997ff` | Same value as `--accent-on-dark` |
| `--accent-focus` | `#4aa3ff` | Hover bg |
| `--accent-on-dark` | `#2997ff` | Unchanged |
| `--ink` | `#f5f5f7` | |
| `--ink-muted` | `#a1a1a6` | |
| `--canvas` | `#0e0e10` | |
| `--canvas-alt` | `#1a1a1d` | |
| `--tile-1` | `#141417` | |
| `--tile-2` | `#1e1e21` | |
| `--hairline` | `#3a3a3c` | |
| `--divider` | `#2a2a2c` | |
| `--on-dark` | `#ffffff` | Not redefined (inherits) |
| `--on-primary` | `#ffffff` | Not redefined (inherits) |
| `--glass` | `rgba(22,22,24,0.88)` | |
| `--glass-solid` | `rgba(22,22,24,0.96)` | |
| `--glass-bottom` | `rgba(22,22,24,0.92)` | |
| `--card-hover` | `#232326` | |
| `--tile-hover` | `#28282b` | Dead token |

**Note (Arabic):** نظام الثيمات بيتحكم فيه `data-theme` على عنصر `<html>` — مفيش `.dark` class ولا Tailwind dark mode. نفس الـ tokens بيتبدلوا بالكامل تحت `html[data-theme="dark"]`.

### 2.3 Status colors (dashboard.html only — NOT on landing page)

| Token | Value | Usage |
|---|---|---|
| `--danger` | `#ff3b30` | Delete buttons, expense amounts/badges |
| `--danger-bg` | `rgba(255,59,48,0.1)` | Danger button bg, confirm icon circle |
| `--success` | `#30d158` | Income amounts/badges, success toast icon |
| `--success-bg` | `rgba(48,209,88,0.1)` | Success badge bg |
| Warning | `#ff9f0a` with bg `rgba(255,159,10,0.1)` | Inline style on a dashboard stat icon only |
| Purple | `#af52de` with bg `rgba(175,82,222,0.1)` | Inline style on a dashboard stat icon only |

On the landing page there is **no** success/error/warning color at all — copy that.

### 2.4 Gradients & glows (exact values)

| Effect | Exact CSS | Where |
|---|---|---|
| Hero orb 1 | `width/height: 500px; background: var(--accent); border-radius: 50%; filter: blur(80px); opacity: 0.15; top: -15%; left: -8%; animation: floatOrb 25s ease-in-out infinite;` | Hero bg |
| Hero orb 2 | `width/height: 400px; background: #4a9eff; filter: blur(80px); opacity: 0.15; bottom: -12%; right: -6%; animation: floatOrb 30s ease-in-out infinite reverse;` | Hero bg |
| Hero orb 3 | `width/height: 300px; background: var(--accent); filter: blur(80px); opacity: 0.08; top: 40%; right: 20%; animation: floatOrb 20s ease-in-out infinite 5s;` | Hero bg |
| Project hover scrim | `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)` | Overlay on project media on hover |
| Skeleton shimmer (landing) | `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)`, `background-size: 200% 100%`, `animation: skelShimmer 1.4s infinite` | Project skeleton |
| Skeleton shimmer (dashboard) | `linear-gradient(90deg, var(--canvas-alt) 25%, var(--hairline) 50%, var(--canvas-alt) 75%)`, `animation: shimmer 1.4s infinite` (`@keyframes shimmer { to { background-position: -200% 0; } }`) | Dashboard skeletons |
| CTA hover glow | `box-shadow: 0 8px 24px rgba(0,102,204,0.25)` | Primary buttons hover only |
| Project card hover shadow | `0 20px 48px rgba(0,0,0,0.35)` | Project card hover only |
| Dashboard card hover shadow | `0 8px 24px rgba(0,0,0,0.08)` light / `0 8px 24px rgba(0,0,0,0.4)` dark | Dashboard project cards |
| Modal shadow (dashboard) | `0 24px 64px rgba(0,0,0,0.2)` | Modal panel |
| Toast shadow (dashboard) | `0 8px 24px rgba(0,0,0,0.3)` | Toast |

**No other gradients exist.** Backgrounds of sections are flat colors.

### 2.5 Contrast ratios (computed, ≈)

| Foreground / Background | Ratio | WCAG |
|---|---|---|
| `--ink #1d1d1f` / `--canvas #ffffff` | ≈ 16.8:1 | AAA |
| `--ink-muted #7a7a7a` / `#ffffff` | ≈ 4.3:1 | **Fails AA for normal text** (passes large text ≥ 18.66px) — used heavily at 13–14px |
| `--accent #0066cc` / `#ffffff` | ≈ 5.6:1 | AA |
| `--on-primary #ffffff` / `--accent #0066cc` | ≈ 5.6:1 | AA |
| `--ink #f5f5f7` / `--canvas #0e0e10` | ≈ 17.7:1 | AAA |
| `--ink-muted #a1a1a6` / `#0e0e10` | ≈ 7.5:1 | AA+ |
| `--accent #2997ff` / `#0e0e10` | ≈ 6.4:1 | AA |
| `#2997ff` / tile-1 `#272729` | ≈ 5.0:1 | AA |
| `#ffffff` / tile-1 `#272729` | ≈ 14.9:1 | AAA |
| `rgba(255,255,255,0.75)` body / tile-1 | ≈ 9.0:1 | AAA |
| `rgba(255,255,255,0.6)` lead / tile-1 | ≈ 6.3:1 | AA |
| `rgba(255,255,255,0.7)` questions / tile-2 `#2a2a2c` | ≈ 7.8:1 | AA |
| `rgba(255,255,255,0.4)` specialty / tile-2 | ≈ 3.5:1 | **Fails AA (12px text)** |

---

## 3. Typography

### 3.1 Fonts (loaded via Google Fonts CDN, single `<link>` with `preconnect`)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Six+Caps&family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

| Role | Family | Weights used | Source |
|---|---|---|---|
| Latin primary / UI | `Inter` → `system-ui, -apple-system, sans-serif` | 400, 500, 600 (700 only in dashboard stat values) | Google Fonts |
| Arabic primary | `Cairo` (prepended for Arabic) | 400, 500, 600 (600 for headings) | Google Fonts |
| Display / numbers | `Six Caps` → `sans-serif` | 400 only (ultra-condensed) — section numbers `01–06` and dashboard sidebar "PH" monogram | Google Fonts |

Stacks (from code):

```css
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Six Caps', sans-serif;
html[lang="ar"] { --font-primary: 'Cairo', 'Inter', system-ui, -apple-system, sans-serif; }
```

Note (Arabic): الفونس بتتحمّل من Google Fonts مرة واحدة، والتحويل للـ Cairo بيحصل تلقائي عبر تغيير `--font-primary` حسب `html[lang="ar"]`. مفيش font-loading JavaScript.

### 3.2 Type scale

Base: `body { line-height: 1.47; }` · Arabic body: `line-height: 1.65`.

| Token | Desktop | Mobile (≤767px) | Small (≤479px) | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|---|---|
| display (hero-title) | `clamp(48px, 9vw, 120px)` | `clamp(36px, 8vw, 56px)` | `38px` | 600 | 1.07 → AR: 1.25 | -0.02em → AR: 0 | Hero H1 |
| h2 (section-title) | `clamp(28px, 4vw, 52px)` | (same clamp) | `22px` | 600 | 1.15 → AR: 1.3 | -0.02em → AR: 0 | Section titles |
| section-number | `clamp(36px, 4vw, 64px)` | (same) | `48px` | 400 (Six Caps) | 1 | 0.02em, `direction: ltr` | Big `01–06` numerals |
| hero-subtitle | `clamp(14px, 1.2vw, 20px)` | `15px`, max-width 100% | same | 400 | 1.6 (AR body 1.65) | 0 | Hero paragraph |
| body-lg (problem-body) | `clamp(15px, 1.3vw, 18px)` | (same) | (same) | 400 | **1.85** | — | Dark-section narrative |
| body | 14px cards/links; 15px question items; 16px highlight-card & cta-desc | same | same | 400 | 1.6–1.75 | -0.01em on nav/filters only | Card text, leads |
| small | 13px (nav links, hero-note, project-open, project-link, footer-heading, stat labels) | 13px filters mobile | same | 400–600 | — | -0.01em (0 in RTL) | Nav, notes |
| caption | 12px (project-type, platform chips, footer-bottom, project-specialty) | same | same | 400–600 | — | 0.04em uppercase (project-type), 0.02em (badge) | Meta text |
| button label | 15px | 15px | 15px | 600 | — | -0.01em | All CTA buttons |
| hero-tag | 14px | 14px | 13px + `uppercase` + `letter-spacing: 0.06em` (EN only; AR: none) | 400 (500 small) | — | -0.01em (0 in RTL) | Hero eyebrow |
| mobile menu links | — | `28px` | `24px` | 600 | — | -0.03em | Overlay nav |
| dashboard stat-value | `24px` | — | — | 700 | — | -0.03em | KPI numbers |

Arabic overrides block (verbatim pattern):

```css
html[lang="ar"] body { line-height: 1.65; }
html[lang="ar"] .hero-title { letter-spacing: 0; line-height: 1.25; }
html[lang="ar"] .section-title { letter-spacing: 0; line-height: 1.3; }
html[lang="ar"] .hero-tag, html[lang="ar"] .section-label, html[lang="ar"] .filter-btn,
html[lang="ar"] .project-type, html[lang="ar"] .footer-logo, html[lang="ar"] .mobile-nav-item,
html[lang="ar"] .project-name, html[lang="ar"] .service-card h3 { letter-spacing: 0; }
```

Weights actually used: 400, 500, 600 on the landing page (700/800 are loaded but unused there; 700 appears in dashboard). Weight 300/800 are loaded but never used — keep loading them (URL is part of the contract) but don't style with them.

### 3.3 English words inside Arabic sentences

- The code does **not** use `<bdi>` or `dir="ltr"` wrappers. English brand terms ("Portfolio", "Copywriters", "Google Docs", "Template") are embedded as plain text inside Arabic strings, e.g. `'Portfolio احترافي لكتّاب المحتوى'` and `'ابدأ الـ Portfolio بتاعك'`. Unicode bidi handles them automatically; do **not** add `bdi` markup — it would diverge from the reference.
- The **only** explicit direction control: `.section-number { direction: ltr; display: block; }` so the numerals `01…06` always read left-to-right, in both languages.
- Hyphenated constructions like `الـ Portfolio` (Arabic article + Latin word) are intentional copy style. Preserve them.

### 3.4 Big numbered sections (01, 02, 03…)

```css
.section-number {
  font-family: var(--font-display);   /* Six Caps */
  font-size: clamp(36px, 4vw, 64px);
  color: var(--accent);               /* on dark tiles: var(--accent-on-dark) */
  line-height: 1;
  margin-bottom: var(--space-sm);     /* 16px */
  letter-spacing: 0.02em;
  direction: ltr;
  display: block;
}
```

Order inside a section header: number → label (14px, accent) → title. On mobile (≤479px) the number shrinks to 48px.

---

## 4. Layout & Spacing

### 4.1 Container & breakpoints

```css
.container, .section-inner {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 var(--space-xl);   /* 0 48px */
}
```

Breakpoints (landing page, all `max-width`):

| Breakpoint | Change |
|---|---|
| `≤1024px` | container padding `0 32px`; hero indents shrink; subtitle/lead widths widen (55%); projects grid 3→2 cols |
| `≤767px` | container padding `0 24px`; hero padding `140px 24px 64px`; title clamp 36–56px; all grids 1 col; filter bar becomes horizontal scroller; hamburger + mobile menu + bottom nav activate; body gets `padding-bottom: 64px` |
| `≤479px` | hero collapses to flow (`min-height: auto; padding: 72px 24px 40px`); hero-tag restyles with dash; buttons full-width; footer 1 col; project-card radius 14px |

Dashboard uses **different** breakpoints (`1100px`, `900px`, `600px`) — see Inconsistencies.

### 4.2 Spacing scale (exact)

```css
--space-xs: 8px;   --space-sm: 16px;   --space-md: 24px;
--space-lg: 32px;  --space-xl: 48px;   --space-2xl: 64px;
--space-3xl: 80px; --space-4xl: 100px; --space-5xl: 140px; --space-6xl: 180px;
```

### 4.3 Section padding

- Standard section: `padding: var(--space-3xl) 0;` → **80px vertical**, 0 horizontal (horizontal comes from `.section-inner`).
- Hero: `min-height: 100vh; padding: var(--space-6xl) var(--space-xl) var(--space-3xl);` → `180px 48px 80px` (top padding clears the fixed header).
- Footer: `padding: var(--space-4xl) 0 0;` → 100px top, 0 bottom (footer-bottom row adds `32px 0` inside).
- Highlight-card padding: `24px 32px`; card padding: `48px` (→ 32px at ≤479px); project body padding: `32px`.

### 4.4 Grid rules

| Grid | Columns | Gap | Collapse |
|---|---|---|---|
| `.cards-grid` (services/features) | `repeat(3, 1fr)` | 24px | stays 3 at ≤1024px → `1fr` at ≤767px (repeated again at ≤479px, redundant) |
| `.projects-grid` (portfolio) | `repeat(3, 1fr)` | 32px | 2 cols at ≤1024px → 1 col, gap 24px at ≤767px |
| `.footer-grid` | `1.5fr 1fr 1fr 1fr` | 80px | `1fr`, gap 64px at ≤479px |
| `.hero-ctas` / `.cta-btns` | flex, gap 16px, `flex-wrap: wrap` | — | column + `align-items: stretch` at ≤479px |
| `.why-questions` | 1 col grid, `gap: 12px`, `max-width: 560px` | — | — |

**Empty/short-row balancing:** there is no fill/spacer trick in the code — a 3-col grid with 5 items simply leaves the last row ragged (services has 5 cards: row 2 shows 2 cards aligned to the start edge). Reproduce as-is; do not center orphans, do not add fake filler cards.

### 4.5 RTL handling

- `<html lang="ar" dir="rtl">` is the **default** (Arabic-first). Inline head script re-applies RTL from `localStorage('ph_lang')` before first paint.
- Alignment flips automatically via logical properties. Used in code: `margin-inline-start: auto` (header actions), `inset-inline-start` (project badge), `padding-inline-end` (hero title indent), `margin-inline-end` (question `?` chip), `margin-inline` (CTA title).
- Arrow/chevron icons that point forward are mirrored in RTL: `html[dir="rtl"] .btn-ghost:hover svg, ... { transform: translateX(-3px) scaleX(-1); }` and static mirrors `html[dir="rtl"] .project-card:hover .project-open svg, html[dir="rtl"] .project-link svg { transform: scaleX(-1); }`.
- Letter-spacing is zeroed on Arabic text elements (`html[lang="ar"] …` block above).
- Physical properties that do NOT flip (intentional in code): WhatsApp float uses `right: 24px` in both directions; hero orbs keep physical `left/right`.
- `html[dir="rtl"] .footer-bottom { text-align: right; }`.

Note (Arabic): اعتمد على logical properties (`inline-start/end`) مش `left/right`، واعكس أي سهم "للأمام" بـ `scaleX(-1)` في RTL زي المرجع بالظبط.

---

## 5. Components

All values verbatim from `index.html` unless marked *(dashboard)*.

### 5.1 Navbar

**Anatomy:** fixed bar → `.container.header-inner` (flex, `justify-content: space-between`, gap 16px) → left: `.header-nav` (flex gap 24px, 3 anchor links) → right: `.header-actions` (flex gap 8px, `margin-inline-start: auto`; contains lang-switch, theme toggle, hamburger). **No logo/brand in the header** — brand text exists only in the footer. On mobile the nav links hide and the hamburger shows.

| Property | Value |
|---|---|
| Position | `fixed; top:0; left:0; right:0; z-index: 1000` |
| Padding | `var(--space-sm) 0` → 16px 0 (mobile: + `padding-top: max(16px, env(safe-area-inset-top))` on `.header-inner`) |
| Default bg | transparent |
| `.scrolled` bg | `var(--glass)` + `backdrop-filter: blur(20px)` + `border-bottom: 1px solid var(--divider)` |
| Scroll trigger | `.scrolled` class toggled by JS when `window.scrollY > 40` |
| Transition | `background 0.4s` |
| Nav link | 13px / 500 / `letter-spacing: -0.01em` / `color: var(--ink-muted)`; hover → `color: var(--accent)`; transition `color 0.3s` |

Mobile menu overlay: `fixed inset 0`, bg `var(--glass-solid)`, `backdrop-filter: blur(24px)`, `z-index: 999`, fade `opacity/visibility 0.35s ease`; links 28px/600/`-0.03em`, centered column, gap 48px, hover underline bar (2px accent, `scaleX 0→1`, 0.3s ease). Body scroll locked via `overflow: hidden` when open. ESC closes.

### 5.2 Language toggle (AR/EN)

Pill segmented control:

```css
.lang-switch { display:flex; align-items:center; border:1px solid var(--hairline);
  border-radius: 9999px; padding: 3px; gap: 2px; background: var(--canvas); }
.lang-btn { font: 600 11px/normal var(--font-primary); letter-spacing: 0.03em;
  color: var(--ink-muted); padding: 5px 11px; border-radius: 9999px;
  min-height: 28px; transition: color .25s, background .25s; }
.lang-btn:hover  { color: var(--ink); }
.lang-btn.active { background: var(--accent); color: var(--on-primary); }
html[dir="rtl"] .lang-btn { letter-spacing: 0; }
```

- States: default (muted text) / hover (ink text) / active (accent bg + white text). Focus: browser default outline (not customized).
- ARIA: wrapper `role="group" aria-label="Language"`; each button `aria-pressed="true|false"`.

### 5.3 Theme toggle

```css
.theme-toggle { width:44px; height:44px; border:1px solid var(--hairline); border-radius:50%;
  background:none; color: var(--ink-muted); transition: color .3s, border-color .3s, background .3s; }
.theme-toggle:hover { color: var(--accent); border-color: var(--accent); }
.theme-toggle svg { width:18px; height:18px; transition: transform .3s; }
.theme-toggle:hover svg { transform: rotate(20deg); }
.theme-toggle .icon-sun { display:none; }                       /* light shows moon */
html[data-theme="dark"] .theme-toggle .icon-sun  { display:block; }
html[data-theme="dark"] .theme-toggle .icon-moon { display:none; }
```

Icon swap is pure CSS via `data-theme`. (Dashboard uses a labeled `.theme-btn` row variant instead.)

### 5.4 Buttons

**Primary (`.hero-cta` / `.cta-btn`, only size difference):**

```css
.hero-cta { display:inline-flex; align-items:center; gap:8px; padding:14px 32px;
  font-size:15px; font-weight:600; letter-spacing:-0.01em; color:var(--on-primary);
  background:var(--accent); border-radius:12px; border:none; cursor:pointer;
  font-family:var(--font-primary);
  transition: background .3s, transform .2s, box-shadow .3s; }
.hero-cta:hover { background:var(--accent-focus); transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,102,204,0.25); }
.hero-cta:active { transform: translateY(0); }
/* .cta-btn: same but padding: 15px 34px */
```

**Ghost (`.btn-ghost`):**

```css
.btn-ghost { display:inline-flex; align-items:center; gap:8px; padding:14px 32px;
  font-size:15px; font-weight:600; letter-spacing:-0.01em; color:var(--ink);
  background:none; border:1px solid var(--hairline); border-radius:12px;
  transition: border-color .3s, color .3s, transform .2s, background .3s; }
.btn-ghost:hover { border-color:var(--accent); color:var(--accent); transform: translateY(-2px); }
.btn-ghost:active { transform: translateY(0); }
```

- Trailing arrow svg inside buttons: hover → `translateX(3px)`; RTL hover → `translateX(-3px) scaleX(-1)`; transition `transform 0.3s ease`.
- Disabled state: not defined (no disabled buttons exist).
- Focus state: not defined (browser default outline).
- ≤479px: both become `width:100%; justify-content:center; padding:14px 28px`.

*(dashboard variants: `.btn-primary` 10×18px, radius 10px, hover `translateY(-1px)`; `.btn-secondary` canvas-alt bg + hairline border; `.btn-danger` danger-bg bg + danger text, radius 8px; `.btn-edit` 7×14px radius 8px. Landing never uses these sizes.)*

### 5.5 Cards

**Light card (`.service-card` / `.feature-card` — identical shells):**

```css
.service-card { background: var(--canvas-alt); border: 1px solid var(--divider);
  border-radius: 18px; padding: var(--space-xl); display:flex; flex-direction:column;
  transition: transform .3s, background .3s, border-color .3s; }
.service-card:hover  { transform: translateY(-4px); background: var(--card-hover);
  border-color: var(--hairline); }
.service-card:active { transform: scale(0.98); }
```

- `h3`: 19px (service) / 17px (feature), 600, `-0.02em`, lh 1.3, margin-bottom 16px (service) / 8px (feature).
- `p`: 14px, `var(--ink-muted)`, lh 1.7.
- `.platform-chips` (feature card 5): `margin-top: auto; padding-top: 24px; gap: 8px; flex-wrap: wrap`. Chip span: 12px, accent color, `background: var(--canvas)`, `border: 1px solid var(--hairline)`, `padding: 5px 12px`, `border-radius: 9999px`.

**Dark project card (`.project-card`):**

```css
.project-card { display:flex; flex-direction:column; background: var(--tile-2);
  border: 1px solid var(--hairline); border-radius: 18px; overflow: hidden; cursor: pointer;
  transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; }
.project-card:hover { transform: translateY(-4px); border-color: var(--accent);
  box-shadow: 0 20px 48px rgba(0,0,0,0.35); }
/* mobile press */ .project-card:active { transform: scale(0.98); }  /* ≤479px */
```

Anatomy: `.project-media` (aspect-ratio 16/10, bg `var(--tile-1)`, overflow hidden) → `.project-bg` (cover image, initial `transform: scale(1.01)`, hover `scale(1.06)`, transition `transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)`) → `.project-badge` (top: 12px, `inset-inline-start: 12px`, 11px/600/0.02em, `padding: 5px 12px`, pill, `background: rgba(0,0,0,0.45)`, `backdrop-filter: blur(8px)`, `color: rgba(255,255,255,0.92)`) → `.project-hover` overlay (gradient scrim above, `opacity 0→1` 0.35s ease, centers `.project-open` glass pill: `padding: 10px 20px`, 13px/600, `#fff`, `background: rgba(255,255,255,0.12)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.25)`, pill; rises `translateY(6px)→0` on hover) → `.project-body` (padding 32px, gap 6px, flex column) → `.project-foot` (`margin-top:auto; padding-top:16px; border-top: 1px solid rgba(255,255,255,0.08)`; specialty text 12px `rgba(255,255,255,0.4)` + link 13px/600 `var(--accent-on-dark)` with mirrored arrow).

Empty state: `.projects-empty` spans full grid row, `text-align:center; padding:64px 24px; color:rgba(255,255,255,0.4); font-size:15px`.

Skeleton: `.project-skeleton` = tile-2 bg, aspect 16/10, radius 18px, shimmer animation (§2.4).

### 5.6 Icon container (`.card-icon`) & icon library

```css
.card-icon { width:44px; height:44px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  background: rgba(0,102,204,0.1); color: var(--accent);
  margin-bottom: var(--space-md); }
html[data-theme="dark"] .card-icon { background: rgba(41,151,255,0.12); color: var(--accent); }
```

- Inner svg: `20×20`, `stroke="currentColor"`, `stroke-width="2"`, round caps/joins, `fill="none"` (Feather Icons glyphs, hand-inlined — no icon library/font). Brand glyphs (Facebook, WhatsApp, Instagram, LinkedIn) are `fill="currentColor"` solid paths at 18–20px.
- Icon sizes in the code: 18px (theme toggle, footer social), 20px (card icons, hero social), 22px (mobile bottom nav), 24px (WhatsApp float), 13–15px (button arrows).

### 5.7 Section header

Stack (all inside a `.reveal` wrapper): `.section-number` (Six Caps numeral, §3.4) → `.section-label` (14px / 400 / `-0.01em` / accent; margin-bottom 8px) → `.section-title` (§3.2; margin-bottom 32px) → optional `.section-lead` (`clamp(14px, 1.2vw, 18px)`, ink-muted, lh 1.7, `max-width: 45%`, margin-bottom 64px). `.section-title-wide { max-width: 60%; }` (80% at ≤1024px, 100% at ≤767px). On dark tiles: title `var(--on-dark)`, label+number `var(--accent-on-dark)`, lead `rgba(255,255,255,0.6)`. Centered CTA variant: `.cta-section` centers everything; title `max-width: 700px; margin-inline: auto;`.

### 5.8 Callout / highlight box (`.highlight-card`)

```css
.highlight-card { display:inline-block; margin-top: var(--space-2xl);
  padding: var(--space-md) var(--space-lg);              /* 24px 32px */
  border: 1px solid rgba(41,151,255,0.3);
  border-radius: 16px;
  background: rgba(41,151,255,0.08);
  color: var(--accent-on-dark);
  font-size: 16px; font-weight: 600; line-height: 1.6; max-width: 620px; }
```

Used at the end of both dark narrative sections (01 Problem, 03 Why Portfolio). Never appears on light tiles.

### 5.9 Question list items (`.why-questions`)

```css
.why-questions { display:grid; gap:12px; max-width:560px; margin-top: var(--space-lg); }
.why-questions li { padding:15px 20px; background: var(--tile-2); border-radius:14px;
  color: rgba(255,255,255,0.7); font-size:15px; line-height:1.6;
  border: 1px solid rgba(255,255,255,0.04); }
.why-questions li::before { content:'?'; display:inline-block; width:22px; height:22px;
  border-radius:50%; background: rgba(41,151,255,0.15); color: var(--accent-on-dark);
  font-size:12px; font-weight:700; text-align:center; line-height:22px;
  margin-inline-end:10px; }
html[lang="ar"] .why-questions li::before { content:'؟'; }
```

No hover state (static list).

### 5.10 Floating WhatsApp button

```css
.whatsapp-float { position: fixed; bottom: 24px; right: 24px;   /* physical right, both dirs */
  width:56px; height:56px; background: var(--accent); color: var(--on-primary);
  border-radius: 50%; display:flex; align-items:center; justify-content:center;
  z-index: 99; transition: transform .2s, background .2s; }
.whatsapp-float:hover  { background: var(--accent-focus); transform: scale(1.05); }
.whatsapp-float:active { transform: scale(0.95); }
/* ≤767px: bottom: 80px (clears bottom nav); right: 16px; width/height: 50px */
```

Icon: WhatsApp glyph svg 24px, `fill="currentColor"`.

### 5.11 Footer

- Container: `background: var(--canvas-alt); border-top: 1px solid var(--divider); padding: var(--space-4xl) 0 0;` (100px top).
- `.footer-grid`: `grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: var(--space-3xl)` (80px). Cols: brand (logo text + desc + social), Navigation links, Services links, Get in Touch links.
- `.footer-logo`: 18px/600/`-0.02em`, ink, margin-bottom 24px. `.footer-desc`: 14px, lh 1.7, ink-muted, `max-width: 280px`.
- `.footer-social a`: 38×38px, `border-radius: 10px`, `border: 1px solid var(--divider)`, ink-muted; hover → accent bg + on-primary color + accent border. Icons 18px.
- `.footer-heading`: 13px/600/`0.02em`, ink, margin-bottom 32px. `.footer-links`: column, gap 12px; links 14px ink-muted, hover accent, transition `color 0.25s`.
- `.footer-bottom`: `margin-top: 100px; padding: 32px 0; border-top: 1px solid var(--divider); font-size: 12px; color: var(--ink-muted);` flex space-between; right side `#back-top` button (12px, min-height 44px, hover accent, arrow svg `translateY(-2px)` on hover).
- ≤479px: grid → 1 col (gap 64px); footer-bottom → column, centered.

### 5.12 Mobile bottom nav (≤767px only)

```css
.mobile-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; height:64px;
  padding-bottom: env(safe-area-inset-bottom, 0); background: var(--glass-bottom);
  backdrop-filter: blur(20px); border-top: 1px solid var(--hairline); z-index: 100;
  justify-content: space-around; align-items: center; }
.mobile-nav-item { flex-direction:column; gap:2px; font-size:10px; color: var(--ink-muted);
  padding: 4px 16px; min-height: 44px; }
.mobile-nav-item.active { color: var(--accent); }
.mobile-nav-item.active::before { content:''; position:absolute; top:-1px; left:50%;
  transform: translateX(-50%); width:24px; height:3px; background: var(--accent);
  border-radius: 0 0 3px 3px; }
.mobile-nav-item svg { width:22px; height:22px; }
.mobile-nav-item.active svg { transform: scale(1.1); }
```

Active state synced by a scroll spy (`section top ≤ 50% viewport height`). Hamburger: 44px, three 22×2px bars (gap 5px), active → `translateY(7px) rotate(45deg)` / fade middle / `translateY(-7px) rotate(-45deg)`, transition `0.3s ease`.

*(Dashboard-only components for reference: sidebar 240px fixed with `.nav-item` rows (active = accent-subtle bg + accent text), topbar 64px sticky, stat cards radius 16px padding 20×24, modal radius 20px padding 28px, toasts fixed bottom-right on tile-1 bg. These are dashboard-specific; do not port to the landing page.)*

---

## 6. Motion

### 6.1 Durations & easings (all from code)

| Motion | Duration / easing |
|---|---|
| Header bg change | `0.4s` (default ease) |
| Nav/footer link color | `0.3s` / `0.25s` |
| Button (bg, shadow) | `0.3s`; transform `0.2s` (default ease) |
| Card lift (light) | `transform .3s, background .3s, border-color .3s` |
| Project card lift | `0.35s ease` (transform, shadow, border) |
| Project image zoom | `0.6s cubic-bezier(0.22, 1, 0.36, 1)` |
| Hover overlay fade | `0.35s ease` |
| Glass pill rise | `0.35s ease` |
| Theme toggle icon rotate | `0.3s` |
| Mobile menu fade | `opacity/visibility 0.35s ease` |
| Hamburger morph | `0.3s ease` |
| Lang button | `0.25s` |
| Scrollbar/arrows | `0.3s` |

### 6.2 Scroll reveal

```css
.reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s, transform .7s; }
.reveal.visible { opacity: 1; transform: translateY(0); }
```

- Observer: `new IntersectionObserver(..., { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })` — one shared observer on `window.__revealObserver`; after re-render, previously-`.visible` elements are never re-hidden.
- Applies to: section headers, bodies, highlight cards, every card, filter bar, CTA stack.
- Hero (≤479px only) uses keyframe entrance instead: `.hero-content .reveal { animation: slideUp 0.6s ease both; }` with `nth-child` stagger `0.05s / 0.15s / 0.25s / 0.35s / 0.45s / 0.5s / 0.55s`; `@keyframes slideUp { from { opacity:0; transform: translateY(24px); } }`.

### 6.3 Ambient animation

`@keyframes floatOrb` (hero orbs): 4-step translate/scale path — `25%: translate(40px,-60px) scale(1.08); 50%: translate(-20px,30px) scale(0.95); 75%: translate(50px,40px) scale(1.05)` — `ease-in-out infinite`, 25s / 30s (reversed) / 20s (delay 5s). `scrollPulse` (hero scroll hint): 2s ease-in-out infinite, opacity 0.4↔0.8 + translateY 0↔4px.

### 6.4 Scroll progress bar

**Not present** in the reference (no progress-bar element or JS exists). If an agent adds one, it would be off-spec — skip it.

### 6.5 `prefers-reduced-motion`

**Not implemented** in the reference (no `@media (prefers-reduced-motion)` anywhere). Recommended minimum when rebuilding: disable `floatOrb`, `scrollPulse`, reveal transforms, and image zoom under `prefers-reduced-motion: reduce`. (This is an addition, not a match — flagged so agents know the reference lacks it.)

---

## 7. Page Structure (home page, top → bottom)

| # | Section id | Surface | Layout & contents | Spacing |
|---|---|---|---|---|
| — | `header` | transparent → glass on scroll | nav (3 links) + lang-switch + theme toggle (+ hamburger ≤767px) | fixed, 16px block padding |
| — | `#home` `.hero` | light `--canvas` + 3 blur orbs | tag (accent) → H1 two lines + accent-colored indented line → subtitle → support line → 2 CTAs (primary WA link + ghost anchor) → note → 4 social circles; centered scroll hint at bottom | `180px 48px 80px`, `min-height:100vh` |
| 01 | `#problem` | dark `.section-dark` (tile-1) | number+label+wide title → narrative body (max-width 620px, lh 1.85, with accent bold quote) → highlight-card | 80px vertical |
| 02 | `#service` | light | number+label+title → `.cards-grid` of 5 service cards (icon + h3 + p) | 80px vertical |
| 03 | `#why-portfolio` | dark | number+label+wide title → lead → 4 question tiles → highlight-card | 80px vertical |
| 04 | `#why-us` | light | number+label+wide title → `.cards-grid` of 5 feature cards (card 5 carries platform chips) | 80px vertical |
| 05 | `#portfolio` | dark | number+label+wide title → lead → filter bar (text tabs) → projects grid (JS-rendered, Supabase with local fallback), skeletons first | 80px vertical |
| 06 | `#cta` | light, centered | label → title (max 700px) → desc (max 540px) → single primary button (WA) → secondary text line with accent link | 80px vertical |
| — | floating elements | — | WhatsApp float (56px circle), mobile bottom nav (≤767px) | fixed |
| — | `footer` | `--canvas-alt` | 4-col grid (brand / nav / services / contact) + bottom bar (© + back-to-top) | 100px top + bottom bar |

**Alternation pattern:** light hero → dark 01 → light 02 → dark 03 → light 04 → dark 05 → light 06 → light-alt footer. Background color change is the only divider — never draw a border/HR between sections. `html { scroll-behavior: smooth; scroll-padding-top: 0; }` (anchor links scroll smooth; note the fixed header overlaps anchor targets because scroll-padding is 0 — keep as-is or fix deliberately).

Content is bilingual through `data-i18n` keys + a JS `I18N` dictionary (`en`/`ar`) applied with `textContent`; language change re-renders filters/projects and sets `document.title`.

---

## 8. Responsive Behavior

| Element | ≤1024px | ≤767px | ≤479px |
|---|---|---|---|
| Container/section-inner | padding 32px | padding 24px | padding 24px |
| Header nav | unchanged | links hidden → hamburger + overlay menu + bottom nav (body padding-bottom 64px) | unchanged |
| Hero | indent `padding-inline-end: 80px`; texts widen to 55% | padding `140px 24px 64px`; title `clamp(36px,8vw,56px)`; indent 0; texts 100% | `min-height:auto; padding:72px 24px 40px`; tag restyled (13px, uppercase, dash prefix — EN only); title 38px; CTAs stack full-width; social 46px; scroll hint hidden; entrance = staggered slideUp |
| Hero orbs | unchanged | 350/280/200px | 240/200/140px, orb-3 opacity 0.06 |
| Section number/title | unchanged | unchanged | number 48px, title 22px |
| Cards grid | unchanged (3 cols) | 1 col | 1 col; card padding 32px |
| Projects grid | 2 cols | 1 col, gap 24px | card radius 14px, `:active` scale(0.98) |
| Filter bar | unchanged | horizontal scroll (nowrap, hidden scrollbar), pills `padding: 8px 16px`, 13px | unchanged |
| Footer | unchanged | unchanged | 1 col, gap 64px; bottom bar stacked & centered |
| WhatsApp float | unchanged | bottom 80px, right 16px, 50px | unchanged |
| Section title wide | 80% | 100% | 100% |
| Mobile menu links | — | 28px | 24px |

---

## 9. Accessibility

- **Focus states:** not customized anywhere (no `:focus-visible` rules, no focus ring token). Browser default outline applies. `--accent-focus` exists but is used as *hover background*, not as a focus ring color. Recommend adding a `2px solid var(--accent)` outline rule when rebuilding — the token name invites it.
- **Contrast:** see §2.5. Known soft spots in the reference: `--ink-muted` 4.3:1 at 13–14px, and `rgba(255,255,255,0.4)` (≈3.5:1) at 12px for project specialty text.
- **Touch targets:** theme toggle 44×44, hamburger 44×44, social buttons 44×44 (46×46 on small mobile), mobile nav items `min-height: 44px`, filter buttons `min-height: 44px`, back-top `min-height: 44px`. **Below target:** lang buttons `min-height: 28px` (padding 5px 11px).
- **ARIA in use:** `role="banner"` (header), `role="contentinfo"` (footer), `role="group" aria-label="Language"` + `aria-pressed` on lang buttons, `aria-label="Toggle dark mode"`, hamburger `aria-expanded` + `aria-controls`, mobile menu `aria-hidden` toggling, filter bar `role="tablist"` + buttons `role="tab" aria-selected` (incomplete tabs pattern — no keyboard arrow handling, no `tabpanel`), sections `aria-labelledby`, icon-only links have `aria-label`, decorative hero orbs wrapped in `aria-hidden="true"`, ESC closes mobile menu, body scroll lock while open.

---

## 10. Design Tokens

### 10.1 CSS variables (copy-paste ready)

```css
:root {
  /* color */
  --accent: #0066cc;
  --accent-focus: #0071e3;
  --accent-on-dark: #2997ff;
  --ink: #1d1d1f;
  --ink-muted: #7a7a7a;
  --canvas: #ffffff;
  --canvas-alt: #f5f5f7;
  --tile-1: #272729;
  --tile-2: #2a2a2c;
  --hairline: #e0e0e0;
  --divider: #f0f0f0;
  --on-dark: #ffffff;
  --on-primary: #ffffff;
  --glass: rgba(255,255,255,0.88);
  --glass-solid: rgba(255,255,255,0.96);
  --glass-bottom: rgba(255,255,255,0.92);
  --card-hover: #f0f0f2;
  --tile-hover: #323234;            /* dead token in reference — kept for fidelity */
  /* dashboard-only status colors */
  --danger: #ff3b30;      --danger-bg: rgba(255,59,48,0.1);
  --success: #30d158;     --success-bg: rgba(48,209,88,0.1);

  /* spacing */
  --space-xs: 8px;   --space-sm: 16px;  --space-md: 24px;
  --space-lg: 32px;  --space-xl: 48px;  --space-2xl: 64px;
  --space-3xl: 80px; --space-4xl: 100px; --space-5xl: 140px; --space-6xl: 180px;

  /* type */
  --font-primary: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Six Caps', sans-serif;

  /* radii (derived from component values in the code) */
  --radius-sm: 10px;   /* dashboard buttons/inputs */
  --radius-md: 12px;   /* buttons, card icons */
  --radius-lg: 14px;   /* question tiles, small project cards */
  --radius-xl: 16px;   /* highlight card, dashboard cards/modals */
  --radius-2xl: 18px;  /* service/feature/project cards */
  --radius-pill: 9999px;
}

html[data-theme="dark"] {
  --accent: #2997ff;
  --accent-focus: #4aa3ff;
  --accent-on-dark: #2997ff;
  --ink: #f5f5f7;
  --ink-muted: #a1a1a6;
  --canvas: #0e0e10;
  --canvas-alt: #1a1a1d;
  --tile-1: #141417;
  --tile-2: #1e1e21;
  --hairline: #3a3a3c;
  --divider: #2a2a2c;
  --glass: rgba(22,22,24,0.88);
  --glass-solid: rgba(22,22,24,0.96);
  --glass-bottom: rgba(22,22,24,0.92);
  --card-hover: #232326;
  --tile-hover: #28282b;
}

html[lang="ar"] {
  --font-primary: 'Cairo', 'Inter', system-ui, -apple-system, sans-serif;
}
```

### 10.2 Tailwind equivalent

The project does **not** use Tailwind (pure CSS with variables, no build step, no `tailwind.config`). If an agent must build with Tailwind, this is the faithful mapping (extend-only; never `darkMode: 'class'` — the reference toggles `data-theme` on `<html>`):

```js
// tailwind.config.js (equivalent — not present in the reference project)
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    container: { center: true, padding: { DEFAULT: '48px', 1024: '32px', 767: '24px' }, screens: { '2xl': '1320px' } },
    screens: { sm: '480px', md: '768px', lg: '1025px' }, // reference triggers are max-width: 1024 / 767 / 479
    extend: {
      colors: {
        accent: { DEFAULT: '#0066cc', focus: '#0071e3', dark: '#2997ff' },
        ink: { DEFAULT: '#1d1d1f', muted: '#7a7a7a' },
        canvas: { DEFAULT: '#ffffff', alt: '#f5f5f7' },
        tile: { 1: '#272729', 2: '#2a2a2c' },
        hairline: '#e0e0e0', divider: '#f0f0f0',
        'card-hover': '#f0f0f2',
        danger: '#ff3b30', success: '#30d158',
      },
      fontFamily: {
        primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Six Caps', 'sans-serif'],
      },
      spacing: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px',
        '2xl': '64px', '3xl': '80px', '4xl': '100px', '5xl': '140px', '6xl': '180px' },
      borderRadius: { sm: '10px', md: '12px', lg: '14px', xl: '16px', '2xl': '18px' },
      boxShadow: {
        cta: '0 8px 24px rgba(0,102,204,0.25)',
        project: '0 20px 48px rgba(0,0,0,0.35)',
        modal: '0 24px 64px rgba(0,0,0,0.2)',
      },
    },
  },
};
```

---

## 11. Do / Don't

**Do**

1. Use exactly one accent family: `#0066cc` on light, `#2997ff` on dark, hover `#0071e3`/`#4aa3ff`. Nothing else.
2. Alternate full-bleed light (`--canvas`) and dark (`--tile-1`) sections; let the background change divide sections — no separators.
3. Start every narrative section with the Six Caps oversized number (`direction: ltr`), then the small accent label, then the big weight-600 title.
4. Put card icons in the 44px, radius-12px, 10%-alpha accent container (`rgba(0,102,204,0.1)` light / `rgba(41,151,255,0.12)` dark).
5. Keep hover motions physical and tiny: `translateY(-4px)` cards, `translateY(-2px)` buttons, `scale(1.05)`/`scale(0.95)` for the float button, image zoom `scale(1.06)` at `0.6s cubic-bezier(0.22,1,0.36,1)`.
6. Use logical properties (`inline-start/end`) so RTL/LTR share one stylesheet, and mirror forward arrows with `scaleX(-1)` in RTL.
7. Default to Arabic (`lang="ar" dir="rtl"`, Cairo) and restore it pre-paint from `localStorage('ph_lang')`; English words stay as plain inline text inside Arabic strings.
8. Keep all interactive targets ≥ 44px (except the 28px lang buttons, which are grandfathered in the reference).

**Don't**

1. No emojis anywhere on the landing page (dashboard-only, and even there they're copy, not UI chrome).
2. No second accent color, no color-coded categories on the landing page (badges are monochrome glass).
3. No decorative gradients — only the three specified: hero orbs, project hover scrim, skeleton shimmer.
4. No resting shadows — shadows appear only on hover (`0 8px 24px rgba(0,102,204,0.25)`, `0 20px 48px rgba(0,0,0,0.35)`) and dashboard modals/toasts.
5. No letter-spacing on Arabic text — always zero it under `html[lang="ar"]`; never uppercase Arabic.
6. No borders around full-bleed sections, no rounded section containers, no horizontal section separators.
7. No `left/right` positioning for content alignment in shared CSS (use logical properties); don't re-mirror already-symmetrical things like the WhatsApp float.
8. No imagery beyond project screenshots — no illustrations, stock photos, or product renders; icons are inline Feather-style SVG strokes only (no icon font).

---

## 12. Implementation Notes

- **Stack:** Vanilla single-file HTML + embedded CSS + embedded JS. No framework, no bundler, no package.json, no Tailwind. Dev server: VS Code Live Server (port 5501). Pages: `index.html` (landing) and `dashboard.html` (admin).
- **Fonts:** Google Fonts CDN (`Inter 300–800`, `Six Caps`, `Cairo 300–800`), `preconnect` to `fonts.googleapis.com` + `fonts.gstatic.com crossorigin`, `display=swap`.
- **Theme switch without flash:** inline `<script>` in `<head>` (before the `<style>` block) reads `localStorage('theme')` or `matchMedia('(prefers-color-scheme: dark)')` and sets `document.documentElement.setAttribute('data-theme', …)` synchronously. Toggle handler flips `data-theme` + writes `localStorage('theme')`; all color change comes from the CSS variable swap.
- **Language switch without flash:** same pattern — head script applies `lang`/`dir` from `localStorage('ph_lang')` (default `'ar'` if anything other than `'en'`). Runtime `setLanguage()` sets `documentElement.lang/dir`, toggles `aria-pressed`, replaces `textContent` of every `[data-i18n]` element from the embedded `I18N` dict, re-renders filters/projects, and updates `document.title`. Arabic is the default language.
- **Data:** projects load from Supabase REST (`/rest/v1/projects?select=*&order=created_at.desc`, anon key in client — works because RLS/anon read); on failure it silently falls back to a hardcoded `DEFAULT_PROJECTS` array with local `portfolios/1..10.png` screenshots. Project meta (badge/type/tagline/specialty, bilingual) lives in a `PROJECT_META` map keyed by title.
- **RTL tricks:** logical properties everywhere; `direction: ltr` on the Six Caps numerals; arrow icons mirrored via `scaleX(-1)`; `letter-spacing: 0` for Arabic; `margin-inline-start: auto` pushes header actions to the visual end. The WhatsApp float and hero orbs keep physical `right/left` on purpose.
- **Icons:** inline SVG (Feather-style, stroke 2, currentColor) — no icon package.
- **Scrollbar:** custom 4px, track `--canvas-alt`, accent thumb, radius 2px.
- **Rendering behavior:** one shared `IntersectionObserver` for reveals (re-observed after each filter re-render); scroll-spy drives the mobile bottom nav; header gets `.scrolled` past `scrollY > 40`; mobile menu locks body scroll and closes on link click or ESC.

---

## 13. Inconsistencies (found in code, with recommendation)

1. **`--tile-hover` is a dead token** — defined in both files (`#323234` / `#28282b`), never used. Recommend: keep defined or drop; do not start using it without intent.
2. **Breakpoint systems differ per page** — landing: 1024/767/479; dashboard: 1100/900/600. Recommend: treat 1024/767/479 as canonical; dashboard values are internal-only.
3. **Class-name collision:** `.projects-grid` is `repeat(3,1fr)` gap 32px on the landing but `repeat(auto-fill, minmax(280px,1fr))` gap 16px in the dashboard. Recommend: keep per-page definitions; never share these selectors across pages.
4. **Skeleton shimmer gradients differ** — landing uses `transparent → rgba(255,255,255,0.06) → transparent` (over tile-2); dashboard uses `canvas-alt/hairline/canvas-alt`. Recommend: landing variant for dark surfaces, dashboard variant for light.
5. **Dashboard loads no Cairo font** but renders Arabic strings (finance labels, modals) in Inter fallback. Recommend: if porting Arabic strings, add Cairo.
6. **Dashboard uses emojis in labels** (💰💸📈📊) — violates the landing page's emoji-free rule. Recommend: no emojis.
7. **`lang-btn` min-height 28px** is below the 44px touch standard used everywhere else. Recommend: keep 28px visual pill but expand hit area to ≥44px (padding/negative margin) if modifying.
8. **Filter tabs use `role="tab"`/`aria-selected`** without `tabpanel` wiring or keyboard arrow support. Recommend: keep the visual style; either complete the ARIA pattern or drop to plain buttons.
9. **`scroll-padding-top: 0`** while the header is fixed → anchor jumps put section headers under the header. Recommend (if allowed to improve): `scroll-padding-top: 88px`; otherwise reproduce as-is.
10. **`logo.png` (1.1MB) exists but is never referenced** — only favicon is used, and the header shows no logo. Recommend: leave the header logo-less (matches reference).
11. **`.cards-grid` 3-col at ≤1024px** gets cramped while `.projects-grid` drops to 2 — asymmetric treatment of equal-width grids. Recommend: keep (reference behavior); if touching, drop cards to 2 cols at 1024 too.
12. **Redundant ≤479px rules** (`.cards-grid: 1fr`, `.section-dark` padding) duplicate the ≤767px values — harmless; safe to clean.
13. **Landing page has no status colors** while the dashboard defines danger/success — they are not part of the landing system. Recommend: do not introduce them on marketing pages.

---

## Summary (5 lines)

- Extracted from the code: full color system (17 theme tokens × 2 modes + 4 dashboard status colors), complete spacing scale, exact component specs with states (navbar, toggles, 3 button types, 4 card types, callout, question list, floats, footer, mobile nav), type scale with Arabic overrides, all motion timings/easings, page section order, and the flash-free theme/RTL init trick.
- Confirmed absent (marked "not defined"): scroll progress bar, `prefers-reduced-motion` handling, custom focus-visible rings, disabled button states, and `bdi/dir="ltr"` wrappers around embedded English words (only the section numbers force `direction: ltr`).
- Contrast: most pairs pass AA/AAA; two known reference soft spots documented (`--ink-muted` ≈4.3:1 at small sizes; `rgba(255,255,255,0.4)` ≈3.5:1).
- The reference is a zero-build vanilla stack — tokens are CSS variables only; a Tailwind mapping is provided in §10.2 as an equivalent, not a dependency.
- 13 code inconsistencies were logged in §13 with a recommended value for each; where behavior was quirky-but-intentional (dead token, no header logo, 0 scroll-padding), the recommendation is to reproduce the reference unless deliberately improving.
