# Second Portfolio Template — Source Analysis

**Mode:** Read-only audit.
**Reference location (verifiable source, local machine):** `/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/projectss/Esraaa/`

## 1. Reference files and sizes

- `index.html` (28,688 bytes)
- `css/style.css` (2310 lines)
- `js/main.js` (281 lines)
- 6 case-study HTML files under `projects/` (`project-english-course.html`, `project-cafe.html`, `project-dental-clinic.html`, `project-physiotherapy.html`, `project-air-conditioning.html`, `project-furniture.html`)
- `assets/images/profile.jpg`
- `assets/images/previews/` (4 files: `refit-plan.jpg`, `cafe-presentation.jpg`, `english-strategy.jpg`, `aircon-content-plan.jpg`)
- `assets/images/previews` logos × 9 under `assets/logos/` (all `.jpeg`, WhatsApp filenames)
- 34 files under `assets/projects/` across 6 folders (insight images, insight PDFs, content plans, content strategy presentation, post graphics)
- 1 CV at `assets/docs/Esraa Ahmed...CV`/`Esraa-Ahmed-CV.pdf`
- 2 PDF portfolios at the repo root (out of scope for the public page)

## 2. Visual identity (tokens found in `css/style.css`, `:root`)

- Accent: `--color-primary: #6E1E35` (burgundy/wine) + deep `#551629` + `rgba(110,30,53,.07)`
- Surfaces: bg `#FBF7EE` (warm white), `--color-bg-alt: #F4EDDF` (beige), `--color-card: #FFFFFF`, `--color-secondary: #EBDCC1`
- Text: `#2A2622` (charcoal), soft `#3E3830`, muted `#6F6759`
- Line/structure: border `#E7DDC9`, strong `#D8CBAC`
- Fonts: `--font-display: "Playfair Display"` (Georgia fallback) and `--font-body: Inter` (`Helvetica Neue` fallback)
- Box model tokens: `--space-1..7 (0.5–8rem)`, `--container: 1180px`, `--radius: 6px`, `--shadow-card`, `--transition: 280ms cubic-bezier(.4,0,.2,1)`
- Font embedding via Google Fonts (preload-friendly `preconnect` in `<head>`)

## 3. View / section structure (`index.html`)

1. Sticky header — brand wordmark + 4-link nav (Work, About, Services, Contact) + hamburger
2. Hero — name (`Esraa Ahmed`), professional title, description copy, 2 CTAs, portrait object (`logo-style` portrait ring + portrait cap), mobile phone preview
3. Brands section — dynamic grid injected (`[data-brands]`) from `assets/logos/`
4. Featured projects / Work — dynamic grid injected (`[data-projects]`), 6 cards
5. About — narrative copy + 4 stat cards
6. Statistics area uses `count(c.stats)` in the Classic template through the `about` section
7. Skills — 2 columns (skills + tools), 8 skills each
8. Services — 3 cards
9. Education — timeline card with 3 items
10. Contact — email pill, WhatsApp pill, contact cards, social footer
11. Footer — nav + contact cards + back-to-top
12. Section anchors: `#brands/#work/#about/#skills/#services/#education/#contact`

Note: reference has its **own** `cs-hero` case-study layout and a project case-study page shell.

## 4. JavaScript patterns (`js/main.js`)

- IIFE, `"use strict"`; `DOMContentLoaded` bootstrap.
- `PROJECTS` static array of 6 records, each containing `id, title, industry, tag, desc, badges, cover, ratio, page`.
- `LOGOS` static array of raw asset URLs.
- `buildBrands()` + `buildProjects()` directly set `container.innerHTML = …map()` (no escaping, no React).
- `observeReveals(scope)` wraps IntersectionObserver (`threshold 0.12`, `rootMargin 0 -6%`) adding an `is-visible` class.
- `setupNav()`: hamburger toggles `.is-open` and `aria-expanded`; clears open on a link click.
- `setupScrollState()`: header `.is-scrolled` and active nav link via window scroll + `offsetTop`.
- `setupBackToTop()`, `setupYear()`, `initLucide()`.
- `lucide.createIcons()` after DOM update because of dynamic markup.

**Safety defects to correct during React rebuild:**
- Unsanitized `innerHTML` insertion of titles/descriptions — XSS surface; must be React-rendered, not string-concatenated (security §6).
- Fixed relative `assets/…` paths — must resolve through PortfolioHub R2/Cloudinary URLs.
- Hardcoded sample content: titles, education, skills, services, stats, plain dates — **must never populate customer defaults**.
- JS-driven scroll spy as an event handler (must use passive + throttle or CSS `:target`); IntersectionObserver (per card) will need one shared instance.
- Lucide via CDN (`https://unpkg.com/lucide@latest` at the bottom of `index.html`) — global script dependency; SaaS should use the `lucide-react` package already available in the app and tree-shaken.
- `data-lucide` is the CDN stub — must become real React components (already used in app bundles).

## 5. Dependencies

- Google Fonts: `Playfair Display` + `Inter`. Inter is already shipped in PortfolioHub; Playfair Display must be loaded through `next/font/google`, **not** a `<link>` in `<head>` (to avoid FOUT + CSP issues).
- Icons: `lucide-react` already a dependency.
- No third-party JS library in reference other than CDN Lucide — good.
- No animations libraries outside CSS transitions / IntersectionObserver.

## 6. Accessibility

strengths
- ARIA labels on nav, hamburger (`aria-expanded`), decorative SVGs `aria-hidden`, unique section IDs, focus-visible styles at `.project-card__btn:focus-visible` and elsewhere.

Weaknesses
- No visible color contrast computation in source (need to test burgundy on warm white): `#6E1E35` on `#FBF7EE` ≈ ? (estimate: foreground luminance 0.0154, background 0.949 → (0.999)/(0.0654)=15.3 → pass).
- `#6F6759` muted on `#FBF7EE`: (0.949)/(0.0654+0.05=?) estimate ~4.5+ → likely pass.
- heading hierarchy needs verification (`h1` title, `h2` section headings); decorative `::before` rule is CSS-only, screen reader safe.
- IntersectionObserver scroll animation could hide page content if JS fails; ensure `.reveal` defaults visible in SSR/static output (avoid initial `opacity:0` being unoverridden).
- mobile nav close-on-link behavior good.

## 7. CSS isolation & responsive behavior

- Breakpoints at 420/520/560/680/700/760/820/860/900/1080px. The app's container-query design (`cq-sm/md/lg`) is more suitable for inline preview; reference is viewport-based. Need convert to cq-friendly layout or gut the fixed wrapper for inline previews.
- Some components assume custom properties on `:root`; must be namespaced to a template-local scope to avoid leakage into Classic/Marketing UI.
- For inline preview: must NOT reuse `.header { position: fixed }` on mobile sidebar? The preview uses containt to paint in `LivePreview`.
- Transition durations and shadows must not block primitive reset (the editor ui CSS reset already sets `box-sizing` in PortfolioHub; scoping required).
- Reduced motion handled but only for the one animation compound after `@media (prefers-reduced-motion: reduce)`.

## 8. Structural resemblance to PortfolioHub

Strong direct mapping possible. Section IDs line up with existing page section types. See `PORTFOLIO_DATA_MAPPING.md`.

## 9. Source anti-pattern summary

- Direct `innerHTML` (security, i18n, RTL).
- Implicit global (`window` access with optional chaining) — cron use.
- No error handling during DOM queries; quiet early return makes partial failure silent.
- Hard-coded asset mapping inside JS bundle instead of server-rendered props.
- Potential `window (scroll` storm; throttling absent.

## 10. Copy "data injection" accident risk

Every `desc`, `title`, `badges` is a literal in source — easy to accidentally seed user defaults. Mark any test/dev that unifies this data as requiring a separate seed/intent (none should ship defaults).

## 11. Do not migrate directly

Embedding `index.html` as-is via `dangerouslySetInnerHTML`, or adding a `static templateId` are all forbidden. A real implementation should reproduce the section DOM/components in React/Next.js using Portfolio data.

---

Estimated effort: 10–16 dev days after approval (interactive architecture can be phased, see `IMPLEMENTATION_ROADMAP.md`).
