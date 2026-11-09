# Editorial Marketing Template — Implementation Report

Date: 2026-11-07 · Status: **implemented, verification pending approval** (no build/test/lint has been run yet — awaiting explicit approval per workflow)

## 1. Summary

The second portfolio template **Editorial Marketing** is implemented as a presentation-only,
Pro-only, fully reversible option inside the existing architecture:

- Same public route (`/u/[username]`), same `getPublicProfile` data path, **no new data models**.
- Template selection lives in `appearance.template` (JSON on `userProfile.appearance`) — **no schema migration**.
- Classic stays the default and safe fallback for missing/invalid/unknown values.
- Server-side entitlement enforcement at the single save choke point.
- Builder picker with preview ≠ apply semantics and an upgrade CTA for Free users.

## 2. Files created

| File | Purpose |
| --- | --- |
| `src/lib/templates.ts` | Dependency-free template registry: `TEMPLATE_IDS`, `TemplateId`, `DEFAULT_TEMPLATE_ID='classic'`, `EDITORIAL_TEMPLATE_ID='editorial-marketing'`, `resolveTemplateId()` (strict alias allow-list), `resolveTemplateFromAppearance()` (explicit key only). |
| `src/components/portfolio/templates/EditorialMarketingTemplate.tsx` | The full editorial layout — header, hero, brands, featured work, about + stats, skills, services, experience, education, testimonials, gallery, files, custom pages, contact, footer, back-to-top. |
| `src/components/portfolio/templates/editorial.module.css` | Scoped `.emk*` classes only; burgundy/beige/charcoal palette; `prefers-reduced-motion` support; no bleed into Classic or builder chrome. |
| `src/app/profile/builder/TemplatePickerModal.tsx` | Templates modal (Classic + Editorial), preview toggle, Pro badge, upgrade CTA for Free, Apply flow. |
| `__tests__/template-entitlements.test.ts` | Resolver / entitlement / save-guard / schema-hygiene / direction tests. |
| This report set under `audit-reports/second-template/`. |

## 3. Files modified

| File | Change |
| --- | --- |
| `src/lib/entitlements.ts` | Added `isProTemplate()` + `canUseTemplate(ent, id)`; imports the template registry. |
| `src/lib/actions/portfolio.ts` (`updatePortfolio`) | Pro-only guard: when the raw save carries an `appearance.template` key and the resolved template is Pro-only while the caller's server-resolved entitlements are Free, the **whole save is rejected** (`code: 'PRO_TEMPLATE_REQUIRED'`) before any transaction. Subscription-lookup failure propagates (fail-safe, no silent grant/revoke, no partial write). |
| `src/lib/portfolio-schema.ts` | `safeTemplate` zod validator (max 60 chars, only `classic`/`editorial-marketing`); unknown values are dropped via `.catch(undefined)` so junk never persists. |
| `src/lib/portfolio.ts` | `Appearance.template` typed as `TemplateId`. |
| `src/app/u/[username]/page.tsx` | Resolves `profile.appearance.template` → renders `ClassicTemplate` or `EditorialMarketingTemplate` (editorial chunk loaded via `await import` only when selected). |
| `src/app/profile/builder/LivePreview.tsx` | Accepts `templateOverride` (preview-only); editorial loaded via `useEffect` dynamic import; memo comparator extended. |
| `src/components/admin/BuilderPreviewClient.tsx` | Same resolver for read-only support previews. |
| `src/app/profile/builder/BuilderClient.tsx` | Header **Templates** button; `templateModalOpen` / `previewTemplateId` / `applyingTemplate` state; `handleApplyTemplate` (applies by saving the caller's current snapshot with ONLY the template key changed); passes `templateOverride` to both LivePreview sites; renders `TemplatePickerModal`. `handleSaveChanges` gained an optional state-override parameter (payload assembly refactor only — save semantics unchanged). |
| `src/app/profile/builder/i18n/dictionaries.ts` | `templates.*` keys in English and Arabic. |

## 4. Data mapping (no fabricated content anywhere)

Every value renders from the existing profile DTO — the same data Classic renders:

| Editorial section | Source |
| --- | --- |
| Hero (name, serif em-dash two-tone, intro, CTAs, portrait) | `hero` section (`name`/`title`/`jobTitle`/`description`/`cta[]`), `localized.displayName/professionalTitle/bio/location`, `profile.avatarUrl` via `portfolioImageUrl(...,640)` |
| Brands | `clients` section `content.items` (`name`, `logoUrl`, `url`) — logos named-only when no logo |
| Featured work | `profile.projectPages` with `showInProjects !== false`; link semantics copied from Classic (`linkType='page'` → `/u/{username}/projects/{slug}`, Pro-only pages; `external` → sanitized external link; other visuals render with no fake CTA); extras from `project.items` |
| About + stats | `about` section `text`/`biography` + `stats[]` (`value`, `label`, optional icon) |
| Skills | `skills` section `groups[]` (pills incl. percentage) else flat `skills[]` |
| Services | builder shape `content.services[]` (icon/title/description/features) + legacy `items[]` (title/description/price) |
| Experience | `experience` section `content.items[]` (`jobTitle`, `company`/`companyName`, `location`, `startDate`/`endDate`, `current`/`isCurrent`, `description`) with shared `formatExperienceRange` |
| Education | `education` section `content.items[]` |
| Testimonials | `testimonials` section `items[]` (builder photo-card shape and legacy `author/role/body`), rating stars when present |
| Gallery / Files | `gallery`/`files` section items, links sanitized |
| Custom pages | `custom` sections (`cards[]` or legacy `paragraphs[]`) |
| Contact | `contact` section `content.links[]` else `profile.contactLinks`; per-type href (mailto/tel/wa.me/https) |
| Footer | `footer` section (headline/subheading/links) + existing `getSocialIcon`/`getContactIcon`; copyright line; back-to-top |

Section ids match Classic (`hero`, `projects`, `about`, `skills`, `experience`, `education`, `services`, `testimonials`, `gallery`, `files`, `clients`, `contact-info`, `custom-{id}`, `contact`) so builder scrolling still lands correctly. Optional sections disappear automatically when empty. Arabic/RTL: `lang`/`dir` per `getPortfolioLang` with `.emk` logical-property CSS.

## 5. Pro entitlement enforcement locations

1. **Save gate (authoritative):** `updatePortfolio` — any save shape (regular, direct API, crafted bulk JSON) flows through it; subscription resolved server-side via `getEntitlements`, never from the client.
2. **Schema hygiene:** unknown `template` strings are dropped from the persisted JSON even if some Future future path bypassed the guard.
3. **Renderer allow-list:** unknown/absent values resolve to Classic; the editorial layout can only appear via the canonical id stored by an entitled save.
4. **Builder surface:** Free previews allowed, Apply locked with upgrade CTA — mirroring the server rule, purely UX.

Deliberate behavior: a portfolio that was saved with editorial while the owner had Pro keeps rendering editorial after a lapse (presentation-only, harmless); the owner cannot re-save it until Pro returns, and switching back to Classic is always allowed.

## 6. Preservation & reversibility

- Apply writes only `appearance.template`; every other appearance key, all sections/pages, project pages (cards, attachments, videos, links), contact links, order and typography travel unchanged in the same save payload (verified by tests once approved).
- Switching back = selecting Classic; no destructive paths were added; no delete/migration/reseed anywhere.
- A rejected save leaves the stored appearance untouched; the builder shows the existing save-error path.

## 7. Performance & accessibility

- Editorial is code-split: the public route and admin/preview load its chunk (Playfair Display subset + scoped CSS) only when rendering that template; Classic bundle unchanged.
- `next/font` Playfair Display (latin subset, 3 weights + italics, `display=swap`); Inter reuses the app-global `--font-sans`.
- Chinese-free table: no `dangerouslySetInnerHTML` anywhere; no new dependencies.
- Keyboard: skip-free semantic landmarks, focus-visible outlines on header/drawer/buttons/cards, Escape/focus-trap a11y in the picker, `aria-expanded` drawer, labeled nav.
- Motion: all transitions are hover-level; global reduced-motion kill-switch in the module.
- Images stay on the existing Cloudinary/R2 URLs (`portfolioImageUrl` sizing only).

## 8. Known limitations (documented, conscious)

- The reference's six hard-coded case studies and its local assets (`assets/images/profile.jpg`, `assets/docs/Esraa-Ahmed-CV.pdf` — the folder ships only `index.html`/`style.css`/`main.js`) were **not** reproduced; they map to customers' own project pages/files instead. See `ASSET_STATUS.md`.
- Editorial ignores `hero.backgroundImage`/`avatarMediaId`/`backgroundPosition`/`overlayOpacity` (portrait only) and does not reuse `hero.cta` override targets beyond sanitized anchors — documented as not mapped.
- `appearance.theme:'warm'` remains a Classic color theme (it was a candidate for mapping but would have silently changed existing customers' public layout — rejected).
- No visitor dark/light toggle in editorial (design is fixed warm-white; palette is template-owned).
- Preview ≠ apply is enforced in React state, not a separate API; persistence only happens through the same audited `updatePortfolio`.
