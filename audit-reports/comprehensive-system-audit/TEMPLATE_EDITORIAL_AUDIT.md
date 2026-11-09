# Template 2 — Editorial Marketing Audit

Primary files:
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx` (≈1,190 lines, uncommitted implementation)
- `src/components/portfolio/templates/editorial.module.css`
- `src/app/profile/builder/LivePreview.tsx`
- `src/app/u/[username]/page.tsx`
- `src/components/admin/BuilderPreviewClient.tsx`
- `src/lib/templates.ts`, `src/lib/entitlements.ts`

Line references are from the audited working tree. This audit is source-trace based; nothing was rendered in a browser.

## 1. Executive answer

**Editorial Marketing responds to the customer's *content*, but not to the customer's *design configuration*.** It reads the same section JSON and project rows as Classic — names, bios, brands, projects, experience, education, testimonials, contact links, footer — but every visual decision (palette, fonts, spacing, card shape, logo treatment, hero frame, layout variants) is hardcoded in the template and CSS module. **No appearance key is read anywhere in the template** (grep for `appearance.` / `var(--color` returns none; the only `appearance` use is for the `n`/`defaultLanguage` language key via `getPortfolioLang`).

It is therefore a well-executed **fixed presentation layer**, not a configurable template.

## 2. Compatibility matrix — every Builder setting traced

Legend: ✅ visibly works · ⚠️ partial/conditional · ❌ ignored.

### 2.1 Appearance (Settings panel)

| Builder setting | Stored property | Classic | Editorial | Actual Editorial behavior | Required action |
| --- | --- | --- | --- | --- | --- |
| Default color mode (light/dark/toggle) | `appearance.defaultColorMode` (legacy `colorMode`) | ✅ light/dark + visitor toggle | ❌ | Always warm-light; no dark variant, no toggle | Map mode to an Editorial light/dark token set or hide the control when Editorial is active |
| Theme toggle in navbar | `appearance.showThemeToggle` | ✅ | ❌ | No toggle rendered | Same |
| Font family (16 options) | `appearance.font` | ✅ Google font + root family | ❌ | Fixed Playfair Display + Inter | Resolve customer font into `--emk-display/--emk-body` or declare template-owned typography in UI |
| Primary color | `appearance.primaryColor` | ✅ `--color-primary` | ❌ | Fixed `#6e1e35` (`editorial.module.css:4`) | Bind theme tokens to saved colors |
| Accent color | `appearance.accentColor` | ✅ gradient/accent | ❌ | Ignored | Same |
| Outline color | `appearance.outlineColor` | ✅ focus/outline | ❌ | Fixed focus outline accent | Same |
| Light bg / card / text / muted / border | `appearance.bgColorLight`, `cardBackground`, `textColorLight`, `mutedText`, `borderColor` | ✅ | ❌ | Fixed beige/white/charcoal/`#6f6759`/`#e7ddc9` | Bind to `--emk-bg/-card/-ink/-ink-muted/-line` |
| Dark bg / card / text / muted / border | `appearance.bgColorDark`, `cardBackgroundDark`, `textColorDark`, `mutedTextDark`, `borderColorDark` | ✅ when dark mode | ❌ | No dark rendering at all | Either implement dark tokens or mark Editorial light-only in the UI |
| Footer background/text | `appearance.footerBg/footerText` | ✅ | ❌ | Fixed dark charcoal footer; no Builder control exists anyway | Add control or remove dead keys |
| Floating WhatsApp switch/number | `appearance.actionButtons.showWhatsapp`, `.whatsappNumber` | ✅ floating CTA + analytics event | ❌ | No floating button, no `whatsapp_click` tracking | Render a themed floating action set or per-template explicit opt-out |
| Floating scroll-to-top switch | `appearance.actionButtons.showScrollToTop` | ✅ conditional floating button | ❌ | Always renders footer back-to-top; ignores switch | Respect the switch |
| Avatar focal point | `appearance.avatarPosition` | ✅ `object-position` | ❌ | Hero image always center-cover, no `object-position` | Apply focal point to the portrait |
| Visibility of each section | `visible` + `settings.isVisible` | ✅ | ✅ | Uses `isSectionVisible` (`editorial:243–250`) | Correct |
| Section order | `sectionOrder` | ✅ sorted (`Classic:355–372`) | ❌ | Fixed order: clients → projects → about → skills → services → experience → education → testimonials → gallery → files → custom → contact; `sectionOrder` is only used for the `.sort()` before `byType` lookups | Render in saved order or explicitly document a fixed editorial narrative |

### 2.2 Section-specific controls

| Builder setting | Stored property | Classic | Editorial | Actual behavior | Required action |
| --- | --- | --- | --- | --- | --- |
| Experience layout: timeline/grid/list | `experience.content.displayMode` | ✅ 3 layouts (`Classic:948`) | ❌ | Always the card timeline (`editorial:886–905`); the value is never read | Implement 3 variants |
| Experience section icon | `experience.content.icon` | ✅ | ❌ | Not rendered | Render icon in section head |
| Experience section description | `experience.content.description` | ✅ | ❌ | Not rendered | Render intro |
| Skills layout: chips/bars/both | `skills.content.displayMode` | ✅ 3 layouts (`Classic:784–905`) | ❌ | Always pills; percentage appended as text (`editorial:369–388`, `829–859`) | Implement bars/both; progress semantics |
| Skills heading | `skills.content.heading` | ✅ `heading || title` (`Classic:814`) | ❌ | Reads only `title`; defaults to "Skills" (`editorial:833`) | Read `heading` |
| Skills group icon | `groups[].icon` | ✅ | ❌ | Not rendered | Render or document |
| Skills group percentages | `groups[].skills[].percentage` | ✅ bars | ⚠️ | Text suffix `· 80%`, no bar | Acceptable only if bars mode implemented |
| Project layout: grid/list | `projects.content.displayMode` | ✅ (`Classic:1346`, `1562–1590`) | ❌ | Always `auto-fill` grid (`editorial:719`, CSS 186) | Implement list mode |
| Project groups | `projects.content.groups` + `project.content.groupId` | ✅ grouped headings | ❌ | Group metadata ignored | Render group sections |
| Project card visual: image/file-icon/video/none | `project.content.cardVisual` etc. | ✅ | ✅ | Image/file icon/inline R2 video (`editorial:321–338`, `731–750`); file tile uses shared tones | Correct |
| Cover image fit/aspect | `content.imageFit`, `content.imageAspect` | ✅ | ✅/⚠️ | Fit/aspect applied (`editorial:727–739`); uses inline aspect wrapper | Correct |
| Video aspect | `content.videoAspect` | ✅ | ✅ | Applied through the same media wrapper | Correct |
| Page/external link + label | `content.linkType`, `linkedPageSlug`, `externalLink`, `linkLabel` | ✅ | ✅ | Same semantics, page links gated by `!isFree` (`editorial:295–310`) | Correct |
| Extra links | `project.items[]` https URLs | ✅ all | ⚠️ first 3 only (`editorial:319`) | Extra buttons limited to 3 | Render all or show +n |
| Clients logo shape/size | `clients.content.logoShape/logoSize` | ✅ (`Classic:1613–1636`) | ❌ | Fixed 84 px card with 46 px logo (CSS 171–184) | Bind to shape/size utilities |
| Clients grayscale | `clients.content.grayscale` | ✅ | ❌ (inverted/always on) | Logos are always `filter: grayscale(1)` at rest (CSS 183) | Respect the flag |
| Clients underline | `clients.content.showTitleUnderline` | ✅ | ❌ | Editorial section heads never render an underline | Either respect or note template-owned style |
| About stat cards | `about.content.stats[]` | ✅ all | ⚠️ first 4 (`editorial:367`) | Later stats silently dropped (schema allows 10) | Render all |
| About title/biography | `about.content.title/biography/text` | ✅ | ✅ | `editorial:357–358`, `804–827` | Correct |
| About section icon | `about.content.icon` | ✅ | ❌ | Only stat icons rendered | Render section icon |
| Education image + focal point | `items[].image/imagePosition` | ✅ lightbox (`Classic:1156–1180`) | ❌ | Images not rendered at all (`editorial:437–445`) | Render image/lightbox or explicit omission |
| Education description | `education.content.description` | ✅ | ❌ | Not rendered | Render intro |
| Services section description | `services.content.description` | ✅ | ❌ | Only title rendered (`editorial:865`) | Render intro |
| Service item icon/features | `services.services[].icon/features` | ✅ first 4 + `+n` | ⚠️ | Icon rendered; features capped at 4 silently (`editorial:399`) | Show `+n` or all |
| Testimonials subtitle/description | `testimonials.content.subtitle/description` | ✅ (`Classic:1326–1331`) | ❌ | Not rendered | Render intro |
| Testimonials rating | `items[].rating` | ❌ (dead) | ⚠️ renders 5-star default | Builder has no rating control; `rating:5` seeded (`TestimonialsEditor:30`), so stars are not user-authored | Do not render unconfigured ratings; add control |
| Testimonial photo | `items[].photoUrl` | ✅ required by slider | ✅ optional avatar | Correct behavior, parity difference |
| Gallery/files descriptions | `content.description` | ✅ | ❌ | Only titles rendered (`editorial:955`, `972`) | Render intro |
| Custom section icon/underline | `content.icon`, `showTitleUnderline` | ✅ | ❌ | Not rendered; `SectionHead` has no icon/underline support | Decide template style vs setting |
| Custom card icon/linkIcon/imagePosition | `cards[].icon/linkIcon/imagePosition` | ✅ | ❌ | Ignored (`editorial:992–1074`) | Render or document |
| Contact labels/links | `contact.content.links`, `profile.contactLinks` | ✅ (with F-14 href bug) | ✅/⚠️ | Href logic is correct (mailto/tel/wa.me); **label is overwritten by raw type** (`editorial:504–515`: `label: type || label`) | Use saved label, show type only as fallback |
| Footer headline/subheading/links | `footer.content.*` | ✅ | ✅ | Used (`editorial:535–558`, `1107–1165`) | Correct |
| Footer quick links | derived | ✅ PortfolioFooter | ⚠️ custom set | `SECTION_LABELS`-driven; omits custom sections | Include custom sections |
| Header nav | derived | ✅ full nav + bottom bar | ⚠️ only first 5 quick links (`editorial:608`) | Files/contact can be absent from desktop header | Render all or prioritise |
| Hero background image/position/overlay | `hero.content.backgroundImage/backgroundPosition/overlayOpacity` | ✅ (`Classic:2221–2245`) | ❌ | Not used; hero is plain beige | Bind or declare unsupported |
| Hero avatar focal point | `appearance.avatarPosition` | ✅ | ❌ | Not used | Bind |
| Hero CTAs (legacy `hero.content.cta`) | `hero.content.cta[]` | ❌ Classic ignores | ✅ | Editorial uses saved CTAs if present (`editorial:574–587`); Builder has no CTA editor | Keep as legacy support |
| Section icon (hero, projects, clients, testimonials…) | `content.icon` | ✅ | ❌ | Only stats and service-item icons rendered (`sectionIcon` at 144, 364, 396) | Render section icons or document |

### 2.3 Template selection and content preservation

| Requirement | Result | Evidence |
| --- | --- | --- |
| Pro-only activation | ✅ Server guard rejects Free before any write | `actions/portfolio.ts:455–468`; `entitlements.ts:48–55` |
| Classic default/fallback | ✅ Missing/invalid → Classic | `templates.ts:11–30` |
| Preview without persistence | ✅ `previewTemplateId` only feeds `LivePreview` | `BuilderClient.tsx:1406–1422`, `4424`; `LivePreview.tsx:16–41` |
| Apply changes only template | ✅ when builder has no unsaved edits; **⚠️ saves pending edits too** (F-27) | `handleApplyTemplate` uses full snapshot |
| Switching back preserves appearance/content | ✅ (server payload unchanged apart from template) | `handleSaveChanges` sends current snapshot |
| Existing customers unaffected | ✅ explicit `template` key only; legacy `theme:'warm'` no longer maps | `templates.ts:22–30` |
| Invalid template values fall back | ✅ | `safeTemplate` drops junk (`portfolio-schema.ts:591–609`); resolver fallback |
| Public route selection + code split | ✅ dynamic import only for editorial | `u/[username]/page.tsx:105–113`, `131–137` |
| Admin preview selection | ✅ resolver + lazy import | `BuilderPreviewClient.tsx:27–55`, `140–146` |

## 3. Confirmed defects (IDs match the master register)

- **F-01 (Critical):** all appearance tokens ignored (matrix §2.1).
- **F-02 (Critical):** no template-specific defaults. `templates.ts` contains only IDs; `ThemeSettings` is template-agnostic and its "Reset defaults" writes the Classic palette (`ThemeSettings.tsx:112`, `139–162`, `346–452`). Selecting Editorial changes nothing in the appearance panel.
- **F-03 (Critical):** experience/skills/projects layout variants ignored.
- **F-04 (High):** responsive preview contract broken. Editorial uses viewport media queries (`editorial.module.css:117, 125, 179–180, 227, 244`) while `LivePreview` renders it inside a width-constrained `@container` (`LivePreview.tsx:24–27`). Classic uses `cq-*` classes. On a desktop browser, the 375 px mobile preview renders Editorial's desktop two-column hero and 5-column logo grid. Admin preview device modes suffer the same problem.
- **F-05 (High):** section order ignored (matrix §2.1). The builder drag-reorder has no visible effect on Editorial.
- **F-06 (High):** the appearance of a fixed template combined with misleading controls. (Missing section creation is tracked separately in the Builder audit.)
- **F-08 (High):** floating WhatsApp / scroll-to-top actions and `whatsapp_click` analytics absent. Only Classic fires the event (`ClassicTemplate.tsx:2197`); the analytics dashboard counts it (`actions/portfolio.ts:1450`).
- **F-15 (High):** hero background image/position/overlay and avatar focal point ignored.
- **F-16 (High):** project detail pages always render Classic styling (`ProjectPageView.tsx:126–170` + Classic classes) even when the portfolio template is Editorial.
- **F-20–F-30 (Medium):** content truncation and section-level options ignored (stats 4 max, features 4, extras 3; titles/descriptions/icons; clients options; education images; testimonial subtitle/rating; custom card options; presence divergence; contact label bug; hero intro duplication; header nav limit).
- **F-04 sub-finding (Low):** editorial scroll state listens to `window` (`editorial:564–572`) while the Builder preview scrolls an inner `[data-preview-scroll]` container, so the sticky-header shadow never updates in preview.
- **F-32 (Low):** `preview` prop is explicitly voided (`editorial:230–231`); no preview-specific adjustments exist.

## 4. Template defaults — required architecture (not implemented)

The requirement distinguishes three layers. Current state:

| Layer | Where it lives today | Status |
| --- | --- | --- |
| Template defaults | Hardcoded CSS custom properties in `editorial.module.css:3–13` and font constants `16–17`; Playfair import `EditorialMarketingTemplate.tsx:40–47` | Exists visually, invisible to the Builder, not editable |
| Customer-saved appearance | `appearance.*` JSON (Classic-named keys: `primaryColor`, `bgColorLight`, …) | Consumed by Classic, ignored by Editorial |
| Runtime fallback | Classic `|| '#38BDF8'`-style defaults in code; Editorial CSS values | Two independent, conflicting fallback systems |

There is **no template-scoped appearance object** and no resolver that merges the three layers. `templates.ts` holds identity only.

### Recommended design (migration-free)

1. **Pure defaults registry** in `src/lib/templates.ts` (or a sibling, client-safe module):
   ```ts
   TEMPLATE_APPEARANCE_DEFAULTS: Record<TemplateId, {
     primary, accent, bg, bgAlt, card, text, textMuted, border, borderStrong,
     displayFont, bodyFont, mode: 'light' | 'dark'
   }>
   ```
   Classic keeps its existing runtime fallbacks unchanged.
2. **Resolution order:** `saved customer override → template defaults → hard runtime fallback`. Read customer overrides from an optional namespaced key already permitted by the schema’s `.catchall`: `appearance.templates?.[templateId] = { primary, bg, … }`; fall back to existing flat keys **only for Classic** (backward compatibility). Do not copy Classic keys into Editorial — that would re-skin existing customers.
3. **Builder awareness:** `ThemeSettings` receives the active template; it renders effective values (saved override or template default labelled "Template default"), and “Reset defaults” writes only `appearance.templates[activeTemplate]`. Never reset the other template’s namespace.
4. **Template consumption:** Editorial sets CSS variables from the resolved object on its root (`--emk-accent: ${resolved.primary}`, etc.) instead of the CSS literals in `editorial.module.css`; font resolution uses the selected family for body/display with Playfair as the template default.
5. **Selection semantics:** applying a template writes only `template` (and optionally seeds the new namespace if absent). Switching back leaves Classic keys untouched. This is exactly what the current `handleApplyTemplate` already does for other fields; only resolution/UI work is missing.
6. **No migration required:** the new key lives inside the existing JSON; `appearanceSchema` already permits unknown keys via `.catchall(z.unknown())`. Document it in the schema with an explicit optional shape to avoid drift.

## 5. Hardcoded values inventory (all candidates for tokenisation)

| Category | Value(s) | Location |
| --- | --- | --- |
| Palette · accent | `#6e1e35`, `#551629`, `rgba(110,30,53,.08)` | `editorial.module.css:4–6` |
| Palette · surfaces | `#fbf7ee`, `#f4eddf`, `#ffffff` | `9–11` |
| Palette · ink | `#2a2622`, `#3e3830`, `#6f6759` | `10–12` |
| Palette · lines | `#e7ddc9`, `#d8cbac` | `13–14` |
| Typography | Playfair variable + Georgia serif stack; Inter/system body | `16–17`; font import `EditorialMarketingTemplate.tsx:40–47` |
| Type scale | name `clamp(2.2rem,5vw,3.4rem)`; section title `clamp(1.7rem,3vw,2.4rem)`; about `clamp(1.6rem,2.6vw,2.2rem)`; stat `clamp(1.7rem,2.6vw,2rem)` | `128`, `54–58`, `228`, `239` |
| Container | `min(1180px, 100% − 3rem)` | `32–35` |
| Section rhythm | `padding-block: 4.5rem`; header gap 2rem | `51`, `50` |
| Hero portrait | `min(320px,78%)`, `aspect-ratio 4/5`, arch radius `200px 200px 26px 26px`, 1 px line, 8 px accent ring + fixed shadow | `151–160` |
| Hero caption | absolute, bottom −1.1rem, pill card | `161–170` |
| Buttons | 46 px min height, 999 px radius, fixed shadows | `131–150` |
| Logo cards | 84 px min height, 14 px radius, 46 px logo, always grayscale | `171–184` |
| Project cards | `minmax(280px,1fr)`, 18 px radius, 16/10 media, fixed shadows, hover translate −4 px | `186–211` |
| Stats/quote/service cards | 16–18 px radius, fixed padding | `230–272` |
| Contact cards | 16 px radius, fixed padding | `274–287` |
| Footer | charcoal `#2a2622`, `#fdfaf3` text, fixed paddings, white-alpha borders | `296–313` |
| Breakpoints | 640/860/900/1000 px (viewport, not container) | `117–244` |
| Picker swatches | duplicate palette/ink/paper hex values | `TemplatePickerModal.tsx:47–64` |

## 6. Hero findings (implementation only, no redesign)

### Current structure
`EditorialMarketingTemplate.tsx:634–676`: a two-column hero (`CSS 124–128`); left side eyebrow (`heroTitle`), H1 (`heroName` split into normal + italic `<em>`), intro paragraph, CTAs; right side `figure.emk__portrait` with `img` + absolutely-positioned `figcaption.emk__portrait-cap`. Portrait renders only when `profile.avatarUrl` exists.

### Exact CSS controlling the frame
`editorial.module.css:151–166`: fixed width `min(320px, 78%)`, aspect `4/5`, arch border-radius `200px 200px 26px 26px`, 1 px `--emk-line` border, white card background, `box-shadow: accent-soft 0 0 0 8px, …`, `overflow:hidden`; `img { width:100%; height:100%; object-fit:cover }`. Caption is `position:absolute; bottom:-1.1rem; inset-inline-start:50%; transform:translateX(-50%)`.

### Reference structure (source files supplied)
`local/2template/index.html:59–67` renders `.hero__portrait > .phone > .phone__screen > img` (phone mockup with island) plus a decorative offset `::before` border and a **static** caption below. `local/2template/style.css:423–452` defines the phone aspect (390/844), offset border and caption; the reference image is 828×1792 portrait. Current implementation uses an arch-masked 4/5 photo card with an overlapping pill caption — structurally and visually different from the reference (phone mockup, offset rule, static caption, larger name scale, divider rule).

### Configurability
- The frame is **100% hardcoded** in the CSS module; nothing in the Builder can change shape, border, radius, size, fit or caption placement.
- The only Builder controls that *should* affect the image are `profile.avatarUrl` (works) and `appearance.avatarPosition` (ignored: no `object-position` anywhere in the template).
- `hero.content.backgroundImage/backgroundPosition/overlayOpacity` are ignored entirely.
- Reference fidelity gap is a design decision; do not change without approval, but record it as F-15/F-37.

## 7. What is correct (explicitly verified)

- Data mapping matches the `portfolio-schemas` content shapes: about stats use `value/label` (not the older `number`), experience uses `items`, services uses `services` with a legacy `items` fallback, clients uses `items.name/logoUrl/url`, testimonials handles builder and legacy shapes.
- No fabricated content, no demo case studies, no assets imported from the reference folder.
- Section visibility is respected; sections disappear when empty.
- Project card link semantics mirror Classic (page/external, Pro gate, sanitized URLs, R2-only video).
- Content is React-escaped; no `dangerouslySetInnerHTML`; external URLs sanitized.
- Arabic/RTL: `dir/lang` derived from `getPortfolioLang`, logical CSS properties and mirrored arrows; AI/RTL layout itself is functional.
- Public route picks the template correctly and code-splits the editorial chunk; Classic fallback path is unaffected.
- Focus states exist for header/buttons/cards in the CSS module; reduced-motion switch present.

## 8. Prioritized remediation plan (for a separate approved implementation phase)

### Critical — Builder setting ignored or misleading
| Issue | File / control | Root cause | Expected behavior | Recommended fix | Regression risk |
| --- | --- | --- | --- | --- | --- |
| F-01 appearance tokens | `editorial.module.css:3–17`; `EditorialMarketingTemplate.tsx` | Fixed palette/fonts; no appearance read | Saved colors/font/mode visibly apply, or controls are declared template-owned | Resolve appearance into `--emk-*` variables; map light/dark; map font | Medium: must not alter Classic look; fall back to template palette when keys are absent |
| F-02 template defaults | `templates.ts`; `ThemeSettings.tsx` | No per-template defaults registry | Panel shows effective Editorial defaults, editable and scoped on reset | `TEMPLATE_APPEARANCE_DEFAULTS` + optional `appearance.templates[id]` overrides; template-aware ThemeSettings | Medium: preserve Classic keys; never write Classic keys on Editorial apply |
| F-03 layout variants | Builder `3260–3290, 3612–3635, 4057–4090`; Editorial sections | `displayMode` never read | Experience 3 modes, skills 3 modes, projects grid/list | Add variant renderers; share option metadata | Low: Editorial branch only; Classic untouched |
| F-04 preview breakpoints | `editorial.module.css` media queries; `LivePreview.tsx` | Viewport queries inside a container frame | Mobile/tablet previews match public mobile/tablet | Convert to container queries or a width-scoped wrapper | Medium: test 320/375/768/1080 widths and public `.no-cq` fallback |
| F-05 section order | Editorial fixed JSX | Order hardcoded | Drag order reflected | Map ordered sections to editorial section components | Low: define a fallback order for missing sections |
| F-06 section creation | `BuilderClient.tsx:1790–1830, 4920`; dead `SectionManager` | No add UI for contact/gallery/files | Users can add those sections (plan-gated) | Wire a section-add menu to the existing editors | Low: respect Free allowlist and caps |
| F-07 downgrade save block | `actions/portfolio.ts:455–468`; builder payload | Guard rejects full appearance on every save | Non-template saves succeed or a clear guided migration runs | Allow saves that keep the same template while Free, or prompt/force Classic on open | High: entitlement must remain non-bypassable |

### High — major visual/functional mismatch
- F-08: editorial action buttons + tracking. Add Editorial-styled floating actions and reuse `trackPortfolioEvent('whatsapp_click')`.
- F-11/F-28: rewrite card references on slug rename and clear card references on deletion, transactionally.
- F-12: add View Page with a disabled reason; align desktop View Live with the mobile draft check.
- F-13/F-14: fix the Classic testimonial photo gate and contact href/icon type handling.
- F-15: apply `avatarPosition` (`object-position`) and hero background/overlay layers.
- F-16: add an Editorial project-detail skin, or explicitly keep detail pages Classic and say so in the picker.
- F-17: resync `editingItem` after a save response remaps ids.
- F-18/F-19: remove the hard-coded email; delete or allow-list `updateProjectPage`.

### Medium — partial support/default inconsistencies
- Consume `skills.heading`, section descriptions/icons, and testimonials subtitle; stop rendering unconfigured ratings (F-21/F-23).
- Bind clients logo options and education images (F-20/F-22).
- Render all stats/features/extras or show `+n` (F-25); align presence rules with Classic (F-26).
- Fix preview-state UX and Apply copy semantics (F-27); prefer the saved contact label (F-30).
- Make the footer link source unambiguous (F-38); split both templates in the public bundle (F-40); move migrations out of the read path (F-48).

### Low — minor styling/architecture
- Type/seed vocabulary (F-31/F-32), nav links (F-33), page publish control (F-34), visibility contract (F-35), preview scroll state (F-36), hero reference fidelity (F-37), Arabic font stack (F-39), R2 lifecycle (F-41), image dimensions (F-42), admin preview revalidation (F-43), dead fields (F-44), focus styles (F-45), preview link interception (F-46), picker thumbnails (F-47), card↔card links (F-49).

### Regression guard rails
1. Do not change the `appearance` JSON shape destructively; new keys must be optional and ignored by Classic.
2. Existing customers with no `template` key must render exactly as today.
3. Switching Editorial ↔ Classic must remain a one-key change with all other values preserved.
4. Free-plan enforcement must stay server-side; UI changes are never the gate.
5. Add tests for defaults resolution, display-mode variants, section order, preview width logic, slug-rename propagation, downgrade saving, and photo-less testimonials.
