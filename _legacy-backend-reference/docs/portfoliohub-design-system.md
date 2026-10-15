# PortfolioHub Design System
**Version 1.0** | Showcase. Connect. Grow.

> نظام التصميم الكامل للبراند — مرجع لكل من يعمل على الموقع أو المواد التسويقية.

---

## 1. Brand Identity

### Mission
PortfolioHub turns scattered files and links into professional portfolios that present content creators the way they deserve — **From Visibility to Credibility.**

### Taglines
- **English:** Showcase. Connect. Grow.
- **English (alt):** From Visibility to Credibility.
- **Arabic:** براندك يستحق إنه يبرز!
- **Arabic (alt):** متخليش شغلك يضيع في زحمة ملفات ومرفقات!

### Brand Personality
| Trait | Description |
|---|---|
| Aspirational | يُلهم العميل بإمكانية مستقبل أفضل |
| Professional | يعكس الاحترافية في كل تفصيلة |
| Bold | خطوط جريئة، نصوص مباشرة |
| Trustworthy | يبني الثقة من أول نظرة |
| Empowering | يُمكّن الـ content creator من التميز |

---

## 2. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Navy Deep** | `#0D1B3E` | rgb(13, 27, 62) | Hero backgrounds, navbar, dark sections |
| **Navy Mid** | `#1A3A6E` | rgb(26, 58, 110) | Card backgrounds, icon backgrounds, borders |
| **Gold** | `#D4A017` | rgb(212, 160, 23) | CTAs, highlights, accent elements |
| **Gold Light** | `#EFA820` | rgb(239, 168, 32) | Hover states, headings on dark backgrounds |

### Neutral Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Cards, body text on dark, main background |
| **Light Gray** | `#F5F7FA` | rgb(245, 247, 250) | Section backgrounds, subtle separation |
| **Mid Gray** | `#E8ECF0` | rgb(232, 236, 240) | Dividers, inactive borders |
| **Text Gray** | `#6B7280` | rgb(107, 114, 128) | Body text secondary, captions |

### Color Usage Rules

```
✅ Navy Deep + Gold = الكومبو الأساسي للـ hero sections
✅ White + Navy Deep = أقوى combination للـ CTAs على الخلفيات الداكنة
✅ Gold على Navy = أرقام، headings مميزة، animated text
❌ لا تستخدم Gold على White بخط رفيع (contrast منخفض)
❌ لا تجمع Navy Mid مع Navy Deep في نفس الـ element بدون فاصل
```

### CSS Variables

```css
:root {
  /* Primary */
  --ph-navy-deep:   #0D1B3E;
  --ph-navy-mid:    #1A3A6E;
  --ph-gold:        #D4A017;
  --ph-gold-light:  #EFA820;

  /* Neutrals */
  --ph-white:       #FFFFFF;
  --ph-gray-light:  #F5F7FA;
  --ph-gray-mid:    #E8ECF0;
  --ph-gray-text:   #6B7280;

  /* Overlays */
  --ph-navy-overlay-10: rgba(13, 27, 62, 0.10);
  --ph-navy-overlay-20: rgba(13, 27, 62, 0.20);
  --ph-gold-overlay-10: rgba(212, 160, 23, 0.10);
  --ph-gold-overlay-15: rgba(212, 160, 23, 0.15);
}
```

---

## 3. Typography

### Font Stack

```css
/* Primary — English */
font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;

/* Arabic */
font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif;

/* Fallback */
font-family: -apple-system, BlinkMacSystemFont, sans-serif;
```

> **ملاحظة:** استخدم `Cairo` للعربي لأنه يدعم الـ bold weights بشكل أقوى وأنسب للـ headlines الكبيرة.

### Type Scale — English

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 40–52px | 800 | 1.05 | Hero headlines (Your FUTURE) |
| `h1` | 28–36px | 700 | 1.15 | Section headlines |
| `h2` | 22–26px | 700 | 1.25 | Sub-headlines |
| `h3` | 18px | 600 | 1.35 | Card titles |
| `body-lg` | 16px | 400 | 1.7 | Main body copy |
| `body` | 14px | 400 | 1.7 | Secondary body, cards |
| `caption` | 12px | 400 | 1.6 | Labels, captions, metadata |
| `eyebrow` | 11px | 500 | 1 | ALL CAPS pre-headlines |

### Type Scale — Arabic

| Token | Size | Weight | Usage |
|---|---|---|---|
| `ar-display` | 36–48px | 800 | Headlines كبيرة على الـ hero |
| `ar-h1` | 26–32px | 700 | Section headlines |
| `ar-h2` | 20–24px | 700 | Sub-headlines |
| `ar-body` | 15px | 400 | Body text (أكبر من الإنجليزي لسهولة القراءة) |
| `ar-caption` | 13px | 400 | Captions, labels |

### Typography Rules

```
✅ Headlines: دايماً bold (700+)، Gold للكلمة المميزة
✅ Body: الإنجليزي 14-16px، العربي 15-16px، line-height 1.65+
✅ Eyebrow text: أصغر من الـ headline، Gold color، letter-spacing: 0.1em
✅ الـ CTA text: 13-14px، font-weight 500
❌ لا تستخدم وزن أقل من 500 على الـ dark backgrounds
❌ لا تخلط أوزان كثيرة في نفس الـ section (maximum 2 weights)
```

### CSS Typography Tokens

```css
:root {
  --ph-font-display:  clamp(36px, 5vw, 52px);
  --ph-font-h1:       clamp(24px, 3.5vw, 36px);
  --ph-font-h2:       clamp(20px, 2.5vw, 26px);
  --ph-font-h3:       18px;
  --ph-font-body-lg:  16px;
  --ph-font-body:     14px;
  --ph-font-caption:  12px;
  --ph-font-eyebrow:  11px;

  --ph-weight-black:  800;
  --ph-weight-bold:   700;
  --ph-weight-semi:   600;
  --ph-weight-medium: 500;
  --ph-weight-normal: 400;

  --ph-leading-tight:  1.1;
  --ph-leading-snug:   1.3;
  --ph-leading-normal: 1.6;
  --ph-leading-loose:  1.75;
}
```

---

## 4. Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon internal gap |
| `space-2` | 8px | Pill/badge padding |
| `space-3` | 12px | Icon-to-label gap |
| `space-4` | 16px | Card inner padding (small) |
| `space-5` | 20px | Card inner padding (standard) |
| `space-6` | 24px | Between card elements |
| `space-8` | 32px | Between sections (tight) |
| `space-10` | 40px | Component spacing |
| `space-12` | 48px | Section padding (compact) |
| `space-16` | 64px | Section padding (standard) |
| `space-24` | 96px | Hero padding |

```css
:root {
  --ph-space-1:  4px;
  --ph-space-2:  8px;
  --ph-space-3:  12px;
  --ph-space-4:  16px;
  --ph-space-5:  20px;
  --ph-space-6:  24px;
  --ph-space-8:  32px;
  --ph-space-10: 40px;
  --ph-space-12: 48px;
  --ph-space-16: 64px;
  --ph-space-24: 96px;
}
```

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Small badges, subtle rounding |
| `radius-md` | 8px | Buttons (non-pill), small cards |
| `radius-lg` | 12px | Cards, modals, containers |
| `radius-xl` | 16px | Large feature cards |
| `radius-2xl` | 20px | Hero sections, outer containers |
| `radius-pill` | 9999px | CTA buttons, tags, pills |

```css
:root {
  --ph-radius-sm:   4px;
  --ph-radius-md:   8px;
  --ph-radius-lg:   12px;
  --ph-radius-xl:   16px;
  --ph-radius-2xl:  20px;
  --ph-radius-pill: 9999px;
}
```

> **القاعدة:** الـ CTA buttons دايماً `radius-pill`. الـ cards تستخدم `radius-lg` أو `radius-xl`.

---

## 6. Buttons & CTAs

### Button Variants

#### Primary CTA — Gold Fill
```css
.btn-primary {
  background: var(--ph-gold);
  color: #ffffff;
  border: none;
  border-radius: var(--ph-radius-pill);
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-primary:hover {
  background: var(--ph-gold-light);
}
```
**نص CTA:** "Build My Portfolio →" | "ابدأ بورتفوليوك اليوم →" | "تواصل معنا اليوم →"

#### Secondary — Dark Fill
```css
.btn-dark {
  background: var(--ph-navy-deep);
  color: #ffffff;
  border: none;
  border-radius: var(--ph-radius-pill);
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
```

#### Outline — Navy Border
```css
.btn-outline-navy {
  background: transparent;
  color: var(--ph-navy-mid);
  border: 1.5px solid var(--ph-navy-mid);
  border-radius: var(--ph-radius-pill);
  padding: 11px 26px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
```

#### Outline — Gold Border
```css
.btn-outline-gold {
  background: transparent;
  color: var(--ph-gold);
  border: 1.5px solid var(--ph-gold);
  border-radius: var(--ph-radius-pill);
  padding: 11px 26px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
```

#### Ghost — On Dark Backgrounds
```css
.btn-ghost-light {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--ph-radius-pill);
  padding: 11px 26px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.btn-ghost-light:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.08);
}
```

### Button Rules
```
✅ CTA الأساسية دايماً Gold على كل الـ sections
✅ دايماً في الـ CTA يكون فيه arrow: → أو ←
✅ حجم الـ padding: 10-14px vertical، 20-32px horizontal
✅ اثنين CTA بجنب بعض: Primary (Gold) + Ghost/Outline
❌ متستخدمش أكتر من 2 CTAs في نفس الـ area
❌ الـ CTA متتكلمش عن نفسها — تكلم عن الـ action: "Build" مش "Click here"
```

---

## 7. Icon System

### Style Guide
- **Type:** Outline only (filled icons ممنوع)
- **Stroke width:** 1.5px – 2px
- **Corner style:** Rounded (stroke-linecap: round)
- **Sizes:** 16px (inline) · 20px (card) · 24px (feature) · 32px (hero feature)

### Icon Container Styles

#### Gold Circle (Feature icons on dark)
```css
.icon-container-gold {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(212, 160, 23, 0.15);
  border: 1.5px solid var(--ph-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ph-gold);
}
```

#### Navy Circle (Feature icons on light)
```css
.icon-container-navy {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(26, 58, 110, 0.08);
  border: 1.5px solid var(--ph-navy-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ph-navy-mid);
}
```

#### Gold Square (Card feature icons)
```css
.icon-container-square {
  width: 40px;
  height: 40px;
  border-radius: var(--ph-radius-md);
  background: var(--ph-gold-overlay-15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ph-gold);
}
```

### Recommended Icons per Service

| Service | Icon Name (Tabler) |
|---|---|
| Portfolio / Showcase | `ti-layout-2` |
| Connect / Network | `ti-users` |
| Grow / Career | `ti-trending-up` |
| Achieve / Goals | `ti-target` |
| Brand Identity | `ti-fingerprint` |
| Creative Design | `ti-pencil` |
| Digital Marketing | `ti-speakerphone` |
| Credibility | `ti-shield-check` |
| One Link | `ti-link` |
| Mobile Responsive | `ti-device-mobile` |
| Content Writing | `ti-file-text` |

---

## 8. Cards & Components

### Feature Card
```css
.feature-card {
  background: #ffffff;
  border-radius: var(--ph-radius-lg);
  border: 0.5px solid var(--ph-gray-mid);
  padding: 20px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.feature-card:hover {
  box-shadow: 0 8px 24px rgba(13, 27, 62, 0.10);
  transform: translateY(-2px);
}
.feature-card .card-icon { margin-bottom: 12px; }
.feature-card .card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ph-navy-deep);
  margin-bottom: 6px;
}
.feature-card .card-desc {
  font-size: 13px;
  color: var(--ph-gray-text);
  line-height: 1.65;
}
```

### Dark Feature Card (on navy background)
```css
.feature-card-dark {
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--ph-radius-lg);
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  padding: 20px;
}
.feature-card-dark .card-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6px;
}
.feature-card-dark .card-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.65;
}
```

### Stat / Highlight Box
```css
.stat-box {
  background: var(--ph-gold-overlay-10);
  border: 1px solid rgba(212, 160, 23, 0.25);
  border-radius: var(--ph-radius-lg);
  padding: 16px 20px;
  text-align: center;
}
.stat-box .stat-number {
  font-size: 32px;
  font-weight: 800;
  color: var(--ph-gold);
  line-height: 1;
  margin-bottom: 4px;
}
.stat-box .stat-label {
  font-size: 13px;
  color: var(--ph-navy-mid);
  font-weight: 500;
}
```

### Carousel Number Badge
```css
.carousel-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--ph-navy-deep);
  border: 2px solid var(--ph-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  position: absolute;
  top: 16px;
  right: 16px;
}
.carousel-badge span { color: var(--ph-gold); font-size: 11px; }
```

---

## 9. Labels, Badges & Pills

### Variants

```css
/* Navy solid */
.pill-navy {
  background: var(--ph-navy-deep);
  color: #ffffff;
  border-radius: var(--ph-radius-pill);
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

/* Gold solid */
.pill-gold {
  background: var(--ph-gold);
  color: #ffffff;
  border-radius: var(--ph-radius-pill);
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

/* Navy outline */
.pill-navy-outline {
  background: transparent;
  color: var(--ph-navy-mid);
  border: 1px solid var(--ph-navy-mid);
  border-radius: var(--ph-radius-pill);
  padding: 4px 13px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

/* Gold outline */
.pill-gold-outline {
  background: transparent;
  color: #B8880F;
  border: 1px solid var(--ph-gold);
  border-radius: var(--ph-radius-pill);
  padding: 4px 13px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

/* Light navy tint */
.pill-light {
  background: var(--ph-navy-overlay-10);
  color: var(--ph-navy-mid);
  border-radius: var(--ph-radius-pill);
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}
```

### Usage Examples
```
Brand Strategy     → pill-navy
Creative Design    → pill-gold
Digital Marketing  → pill-navy-outline
Business Growth    → pill-gold-outline
Results & Impact   → pill-light
```

---

## 10. Decorative Elements

### Dot Grid Pattern
```css
.dots-grid {
  display: grid;
  grid-template-columns: repeat(4, 8px);
  gap: 5px;
}
.dots-grid span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ph-gold);
  opacity: 0.55;
  display: block;
}
```
**Usage:** يظهر في زوايا الـ ads والـ sections كـ decorative element.

### Gold Swoosh Underline
```css
/* SVG داخل HTML */
/* <svg width="60" height="8" viewBox="0 0 60 8"> */
/*   <path d="M2 6 Q20 2 58 6" fill="none" stroke="#D4A017" stroke-width="3" stroke-linecap="round"/> */
/* </svg> */

/* أو CSS */
.swoosh-underline {
  display: block;
  width: 48px;
  height: 4px;
  background: var(--ph-gold);
  border-radius: 2px;
  margin: 8px 0 16px;
}
```
**Usage:** تحت الـ hero headline مباشرة.

### Gold Divider with Dot
```css
.accent-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0;
}
.accent-divider::before {
  content: '';
  display: block;
  width: 36px;
  height: 2px;
  background: var(--ph-gold);
  border-radius: 2px;
}
.accent-divider::after {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ph-gold);
}
```

### Slash Marks (Decorative)
```html
<!-- SVG Slash marks -->
<svg width="36" height="28" viewBox="0 0 36 28" fill="none">
  <line x1="0" y1="28" x2="10" y2="0" stroke="#D4A017" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="13" y1="28" x2="23" y2="0" stroke="#D4A017" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="26" y1="28" x2="36" y2="0" stroke="#D4A017" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

### Section Number (01, 02, 03...)
```css
.section-number {
  font-size: 11px;
  font-weight: 600;
  color: var(--ph-gold);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}
```

---

## 11. Navigation

### Navbar — Dark Version
```css
.navbar {
  background: var(--ph-navy-deep);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.navbar-logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}
.navbar-logo-text span { color: var(--ph-gold); }

.navbar-links {
  display: flex;
  gap: 28px;
  list-style: none;
}
.navbar-links a {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: color 0.2s;
}
.navbar-links a:hover { color: #ffffff; }

.navbar-cta {
  background: var(--ph-gold);
  color: #ffffff;
  border: none;
  border-radius: var(--ph-radius-pill);
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
```

---

## 12. Section Layouts

### Hero Section — Dark
```
Background: #0D1B3E
Padding:    96px top/bottom (mobile: 64px)
Content:
  - Eyebrow label (gold, 11px, uppercase)
  - H1 Headline (white, gold accent word)
  - Swoosh underline
  - Body text (white 65% opacity, max-width 520px)
  - 2 CTAs: Primary (gold) + Ghost (white border)
  - Decorative: dot grid top-right, slash marks bottom-left
```

### Feature Section — Light
```
Background: #F5F7FA
Padding:    80px top/bottom
Content:
  - Section number (01) + eyebrow
  - H2 Headline (navy)
  - Subtitle (gray)
  - Grid: 2-4 feature cards
```

### Problem/Pain Section
```
Background: #ffffff
Pattern:    Comparison layout (Before vs After)
Content:
  - Strong headline (problem statement)
  - Pain points list with ✗ icons
  - Transition to solution
  - Bold callout box: "العميل يقرر في 10 ثواني"
```

### CTA Section — Dark
```
Background: #0D1B3E (or gradient overlay)
Padding:    80px top/bottom
Content:
  - H2 white
  - Subtext white 65%
  - Single large CTA button (gold, pill)
  - Optional: WhatsApp icon + number
```

---

## 13. Responsive Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| `mobile` | 0 – 767px | Single column, reduced padding |
| `tablet` | 768px – 1023px | 2-column grids |
| `desktop` | 1024px – 1279px | Standard layout |
| `wide` | 1280px+ | Max-width container |

```css
/* Container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .container { padding: 0 32px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 48px; }
}
```

---

## 14. Brand Voice & Copy

### English Tone
- **Aspirational + Direct.** Short punchy headlines, warm body copy.
- Action verbs first: "Build", "Showcase", "Grow", "Achieve"
- Mix of statements and questions: "Your work is excellent. Is its presentation?"
- CTA language: Always includes action + benefit + momentum arrow →

### Arabic Tone
- **جريء + مباشر + محلي.** عامية تصل بسرعة + تفاصيل احترافية.
- تحدي ثم حل: "متخليش شغلك يضيع..." → "احصل على بورتفوليو احترافي"
- كلمات القوة: يبرز، يتميز، احترافي، مصداقية، يثبت نفسه
- الـ CTA العربية: دايماً تنتهي بـ ← أو →

### Copy Formulas

#### Headline Formula
```
[Pain/Problem] + [Gold accent word] + [Outcome]
مثال: "براندك يستحق" + "إنه يبرز!"
مثال: "One Move." + "Big Difference."
```

#### Sub-headline Formula
```
[Platform name] + [Verb] + [Benefit]
مثال: "إحنا في PortfolioHub بنساعدك تبني هوية احترافية"
```

#### CTA Formula
```
[Action verb] + [Destination/Result] + [Arrow]
مثال: "Build My Portfolio →"
مثال: "تواصل معنا اليوم →"
مثال: "Let's Build Your Future Together →"
```

---

## 15. Do's & Don'ts

### ✅ Do

- استخدم Gold للكلمة الأهم في كل headline
- خلي الـ CTA buttons دايماً pill shape
- حط dots pattern في زوايا الـ ads كـ decorative
- استخدم swoosh line تحت الـ hero headlines
- الـ numbered badges (2/5، 4/5) دايماً بحدود ذهبية
- Section numbers بـ format 01، 02، 03

### ❌ Don't

- متستخدمش Gold على White بخط رفيع جداً
- متحطش أكتر من 2 CTAs في نفس الـ view
- متخلطش Navy Deep مع Navy Mid بدون فاصل واضح
- متستخدمش filled icons — outline only
- متكسرش الـ pill shape للـ CTAs
- متستخدمش أكتر من 2 fonts في نفس التصميم

---

## 16. Logo Usage

### Minimum Sizes
- Digital: 120px wide minimum
- Print: 30mm wide minimum

### Clear Space
- يكون فيه space حول اللوجو يساوي على الأقل نص ارتفاع الـ "P" في كل الجوانب

### Logo on Backgrounds
| Background | Logo Version |
|---|---|
| Navy Deep `#0D1B3E` | Full color (white text + gold) |
| White `#FFFFFF` | Full color (navy text + gold) |
| Gold `#D4A017` | White version only |
| Photography | White version with subtle shadow |

### Logo Don'ts
```
❌ لا تغير ألوان اللوجو
❌ لا تحط اللوجو على backgrounds تقل الـ contrast
❌ لا تمد أو تضغط اللوجو
❌ لا تحط outline أو shadow على اللوجو
❌ لا تستخدم اللوجو أصغر من الحد الأدنى
```

---

## 17. Social Media Specs

### Instagram Post (1:1)
- **Size:** 1080 × 1080px
- **Safe zone:** 100px margin من كل الجوانب
- **Logo:** top-center، 200px wide
- **Carousel badge:** top-right (N/5)

### Instagram Story (9:16)
- **Size:** 1080 × 1920px
- **Logo:** top-center، 180px wide
- **CTA area:** bottom 300px

### LinkedIn Banner
- **Size:** 1584 × 396px
- **Style:** Dark navy background + Gold headline

---

*PortfolioHub Design System v1.0*
*آخر تحديث: أغسطس 2026*
