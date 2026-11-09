# Template 1 — Classic Portfolio Audit

Primary files: `src/components/portfolio/templates/ClassicTemplate.tsx` (≈2,600 lines), `src/components/portfolio/PortfolioFooter.tsx`, `src/components/portfolio/ProjectCard.tsx`, `src/components/portfolio/TestimonialsSlider.tsx`, `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx`.

## 1. What Classic actually consumes (verified)

### Appearance
| Stored property | Consumed | Evidence |
| --- | --- | --- |
| `primaryColor`, `accentColor`, `outlineColor` | Yes → CSS vars | `ClassicTemplate.tsx:395–429` |
| `bgColorLight/Dark`, `cardBackground/Dark`, `textColorLight/Dark`, `mutedText/Dark`, `borderColor/Dark` | Yes, selected by light/dark mode | `379–427` |
| `defaultColorMode` / legacy `colorMode` | Yes (light/dark, with visitor toggle) | `225–265` |
| `showThemeToggle` | Yes | `252`, `2000+` nav |
| `font` (Google Fonts link + root fontFamily) | Yes, charset-guarded | `399–408`, `1963`, `427` |
| `avatarPosition` | Yes (`object-position`) | `216`, `2338`, `2420` |
| `actionButtons.showScrollToTop` / `showWhatsapp` / `whatsappNumber` | Yes (floating buttons) | `337–345`, `2185–2215` |
| `footerBg` / `footerText` | Yes, inline styles | `2532–2552` (no Builder control) |
| `theme`, `layout`, `hideBadge`, `publicTheme`, `logoUrl` | **No renderer consumption found** | dead fields |

### Content
- Color-coded appearance is applied through CSS variables on the root (`411–429`); all sections read `var(--color-*)`.
- Section order respected: sections are sorted by `sectionOrder` (`355–372`), with a synthetic fallback footer when none exists (`357–367`).
- Display modes: skills `chips|bars|both` (`784–905`), experience `timeline|grid|list` (`948–1130`), home projects `grid|list` (`1346`, `1562–1590`).
- Clients: shape/size/padding/grayscale/underline (`1613–1641`, `1642–1690`).
- Gallery/files/custom/contact: rendered with section descriptions (`672–684`, `1694–1810`, `1837–1930`).
- Education: image with focal point and lightbox (`1156–1180`, `1225–1240`).
- Testimonials: slider (`1329–1334`), subtitle rendered (`1326–1331`).
- Hero: background image + position + overlay (`2221–2245`), avatar focal point (`2338`/`2420`), hardcoded anchors for primary CTAs (`2295–2325`, `2430+`).
- Filtering: hidden sections removed (`447–505`); clients require a logo (`442–446`); education requires a title; projects/about/etc. render even when content is empty (heading only).
- Project links: page links (Pro owners only), external links, extra http(s) links (`1393–1460`); R2 file cards are icon-only on home cards (no download action) — the actual attachment action lives on project detail items.

### Verified correct behaviors worth stating
- Free-plan content stripping occurs before render (`src/app/u/[username]/page.tsx:44–46`); Classic does not leak locked sections.
- Android/desktop layout uses container queries (`cq-*`) so the inline Builder preview scales to the preview box; this is the intended preview contract.
- Public project detail pages render via `ProjectPageView` with the same appearance keys and safeguards (`ProjectPageView.tsx:126–170`).

## 2. Confirmed defects

### F-13 (High) — Testimonials without a photo are silently invisible
- Builder: new testimonial starts with `photoUrl: ''` (`TestimonialsEditor.tsx:25–37`); no photo is required by UI or schema.
- Classic renders `<TestimonialsSlider items={testimonialItems} …>` whenever `testimonialItems.length > 0` (`ClassicTemplate.tsx:1329–1333`).
- Slider filters **out every item without a photo** and returns `null` if none remain (`TestimonialsSlider.tsx:51–56`).
- User scenario: add a testimonial with name + quote, no image → the public testimonials section is blank (not even the "coming soon" fallback, because that fallback is only used when the *unfiltered* list is empty).
- Root cause: the photo is treated as required by the renderer but optional by the editor/schema.
- Recommended fix: render text-only cards (or only require photo for the photo slider), and use the same filtered list to decide the empty state.

### F-14 (High) — Contact-section phone/WhatsApp links are malformed
- ContactEditor stores only `type` + `value` (`ContactEditor.tsx:54–60`, `144–172`); schema types `phone`/`whatsapp` expect phone numbers (`portfolio-schema.ts:139–177`).
- Classic builds href as: raw http/mailto/tel → as-is; contains `@` → `mailto:`; otherwise `https://{raw}` (`ClassicTemplate.tsx:1789–1800`).
- A valid WhatsApp/phone value such as `+201012345678` therefore becomes `https://+201012345678`, which is not a valid URL. Clicking does nothing / resolves incorrectly.
- Same block: `getSocialIcon(platform) || getContactIcon(platform)` (`1803`) — `getSocialIcon` returns a Globe fallback for unknown platforms, so the `getContactIcon` branch is unreachable. Email/phone links always show a Globe instead of Mail/Phone.
- Recommended fix: normalize by type (mailto/tel/wa.me), and choose icon by contact type before falling back to socials.

### F-30 (Medium) — Footer contact icons use the same unreachable fallback
`PortfolioFooter.tsx:265` calls `getSocialIcon(platform) || getContactIcon(platform)`. `getSocialIcon` never returns a falsy value, so footer email/phone/website links all show the Globe. Low visual impact, same fix.

### F-24 (Medium) — Ratings are collected (implicitly) but never rendered
`TestimonialsSlider` declares `rating?: number` (`15`) but never reads it. Builder seeds `rating: 5` (`TestimonialsEditor.tsx:30`) with no control. Classic ignores both, so the field is dead data in Classic. (Editorial renders it — see the template audit; that exposes the hidden default.)

### F-38 (Low) — Footer social link source duplication
Footer editor writes to both `profile.contactLinks` and `footer.content.links` (`BuilderClient.tsx:4130–4235`), while the editor reads `profile.contactLinks || c.links`. Empty arrays are truthy, so a legacy profile with links only in footer content shows an empty editor list. Not a render break for current data, but a persistence inconsistency.

### F-34 (Low) — Unpublished project pages can still be linked from cards
Card link rendering does not check `isPublished` (`ClassicTemplate.tsx:1409`); the public route filters unpublished project rows (`projects/[slug]/page.tsx:20–24`) → a linked unpublished page 404s. There is no Builder control to change `isPublished`, so this is only reachable via legacy/admin data. Label: confirmed risk, low reachability.

### Classic gaps that are design choices, not defects
- Clients with no logo are not rendered (`442–446`, `1606`) even though the editor supports name-only items. This is a content visibility choice; flagged under integration differences.
- Empty sections (projects/about) render a heading + empty body; Editorial hides them. Different but not broken.
- Hero CTAs are hardcoded to `#projects` / `#contact` (`2295–2325`), so they can link to absent sections. No Builder control exists, so this is legacy design rather than a setting mismatch.
- `appearance.footerBg/footerText` are supported by the renderer but not exposed in the Builder.

## 3. Classic ⇄ Editorial parity summary

| Capability | Classic | Editorial |
| --- | --- | --- |
| Appearance colors/font/mode/toggle | Yes | **No** |
| Section order | Yes | **No** |
| Experience modes | 3 | 1 (timeline cards) |
| Skills modes | 3 | 1 (pills) |
| Project grid/list | Yes | Grid only |
| Project groups | Yes | Ignored |
| Clients logo options | Yes | Ignored |
| Education images/lightbox | Yes | Ignored |
| Testimonials subtitle | Yes | Ignored |
| Testimonials without photo | Hidden | Shown |
| Rating | Not rendered | Renders hidden default 5 |
| Contact phone/WhatsApp href | Broken | Correct |
| Floating WhatsApp / scroll | Yes | No |
| Section icons | Yes | No |
| Stat cards >4 | All | First 4 |
| Footer design tokens | footerBg/footerText | Fixed dark footer |
| Mobile bottom nav | Yes | Header drawer only |

## 4. Test coverage relevant to Classic
- `__tests__/features-v2.test.ts` simulates the project-card extra-link filter (matches source) and asserts the classic link rules for external/extra links.
- `__tests__/clients-section.test.ts` covers schema/visibility/defaults for clients.
- `__tests__/inline-video.test.ts`, `attachment-persistence.test.ts`, `portfolio-save-items.test.ts`, `experience-reordering.test.ts` cover adjacent persistence paths.
- **No test covers photo-less testimonials, contact phone href construction, slug rename propagation, or Classic contact icons.** These were not executed in this audit (no runner was invoked).
