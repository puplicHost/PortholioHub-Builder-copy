# PortfolioHub — Comprehensive System Audit

**Mode:** read-only source-code audit · **Revision audited:** working tree on top of `7c1d08f` (includes uncommitted Editorial Marketing work) · **Date:** 2026-11-07
**No application source, schema, migration, test, or customer data was modified.**

Skills read and applied:
- `nextjs` — App Router server/client boundaries, dynamic imports of client components, Server Action security assumptions (Next 16.4.5 / React 19.2.4 detected).
- `security-audit` — evidence-before-report discipline, threat-model framing, object-level authorization, mass-assignment and entitlement review.

Other skill directories were present (`.agents/skills/…`), but only these two were loaded; per project instruction no more than two skills are combined in one session. The remaining audit work used the project's own `AGENTS.md` rules and direct source tracing.

---

## Executive Summary

PortfolioHub is a **mature, defensible implementation of one template** with a **partially integrated second template**. The data model, ownership checks, save transaction, entitlement gates and media authorization are generally sound. Classic is deeply wired to the Builder: display modes, palettes, typography, avatar focal points, hero backgrounds, clients options, education media and action buttons all flow from saved appearance/content into rendered output.

Editorial Marketing is **not yet a Builder-configurable template**. It is a fixed-brand presentation layer that reads customer *content* but ignores the customer's *design configuration* almost entirely. The most serious finding (F-01) is that every control in Settings → Appearance is inert while Editorial is active: primary/accent colors, light/dark palettes, text/muted/border colors, font family, color mode, theme toggle. Selecting Editorial does not change the Builder's displayed defaults (F-02), and "Reset defaults" writes the Classic blue palette. The experience/skills/projects layout selectors — explicitly called out in the audit brief — are ignored (F-03). Section ordering is also ignored (F-05), and the Builder's device preview renders the Editorial template with **viewport** breakpoints instead of the container width, so the mobile preview is visually wrong (F-04).

Two operational defects compound the template work: a Pro→Free downgrade while Editorial is saved makes **every subsequent save fail** because the application's own Builder payload always carries the stored template key (F-07); and the save pipeline can **silently discard keystrokes typed while a save is in flight** (F-09).

Classic is not defect-free: testimonials without a photo are completely invisible (F-13), contact-section phone/WhatsApp links produce invalid `https://+2010…` URLs (F-14), and several Builder sections (contact/gallery/files) cannot be created at all from the current Builder because their only creation UI is dead code (F-06).

### Confirmed findings by severity

| Severity | Count | Examples |
| --- | --- | --- |
| Critical | 7 | Appearance wholly ignored; no template defaults; layout modes ignored; preview breakpoints; section order; missing section creation; downgrade makes saves impossible |
| High | 12 | WhatsApp/action buttons lost; save race; dead undo/redo; slug rename breaks links; missing View Page; classic testimonial photo gate; malformed contact links; hero appearance ignored; Classic-styled project pages; hard-coded customer email; mass-assignment action |
| Medium | 13 | Stats/content truncation, section titles/icons, clients options, education images, testimonial subtitle/rating, custom card options, preview-state confusion, dangling links, hero intro duplication, contact labels, footer source, migrations on read |
| Low | 17 | Type drift, seed vocabulary, nav limits, page publish control, visibility contract, preview scroll, hero fidelity, Arabic typography, bundle-split hypothesis, R2 lifecycle, CLS, admin revalidation, dead appearance fields, focus styles, preview links, picker UX, card↔card links |

Exact evidence for every row is in `MASTER_FINDINGS.md`; severity rationale and user journeys are in the domain reports.

### Is the system integrated?

- **Classic ⇄ Builder:** integrated for all supported settings (verified by source consumption, not assumed).
- **Editorial ⇄ Builder:** integrated for content only; **not integrated for appearance or layout options**.
- **Editorial ⇄ project detail pages:** not integrated at all — detail pages always render Classic styling with Classic appearance keys.
- **Preview ⇄ public output:** content matches; responsive preview does **not** for Editorial.
- **Save/persistence:** transactionally sound in the happy path; two real hazards (save race, downgrade save block).

### Most serious user-facing problems (in order)

1. **F-01** A Pro customer selects Editorial, customizes colors/font → nothing changes; controls are misleading.
2. **F-02** Builder shows/reset Classic defaults while Editorial is active → no way to see or edit Editorial's effective design tokens.
3. **F-03/F-05** Selecting experience/skills/projects layouts or dragging section order has no effect on the published Editorial page.
4. **F-04** The mobile device preview lies: Editorial renders desktop layout inside the 375 px frame on a desktop browser.
5. **F-07** A downgraded customer with Editorial saved cannot save *any* content edit until they manually switch back to Classic.
6. **F-06** New users cannot create Contact, Gallery or Files sections at all; the editors exist but the add-section UI is dead.
7. **F-09** Typing during a save can lose the newly typed characters.
8. **F-13/F-14** Classic silently hides photo-less testimonials and emits broken contact links for phone/WhatsApp values.

### Recommended priority

1. Decide the Editorial design contract: either consume the existing appearance tokens, or introduce a template-scoped appearance namespace with explicit defaults (see `TEMPLATE_EDITORIAL_AUDIT.md §4`). Do not ship appearance controls that are inert.
2. Fix save-blocking and data-loss hazards (F-07, F-09, F-11, F-28).
3. Restore missing Builder affordances (F-06, F-10, F-12).
4. Fix the responsive-preview contract (container queries or a width-scoped wrapper) before claiming mobile preview parity.
5. Correct the Classic content-visibility bugs (F-13, F-14).
6. Treat the hard-coded customer email and mass-assignment action as release blockers for the next security pass (F-18/F-19).

### What is working (stated explicitly)

- Template allow-list + Classic fallback is correct; legacy `theme` values cannot silently switch layouts.
- Public route selects the correct template; Editorial is code-split via dynamic import.
- `appearance.template` switching preserves all other appearance keys and all content when no concurrent edits exist.
- Server-side Pro gate rejects crafted Editorial requests before any transaction; subscription-lookup failure fails closed.
- Classic consumes display modes, appearance colors/font/avatar position/background overlay, clients options and education media.
- Private R2 media is owner-gated; public media is intentionally public; rendered user content is React-escaped and URLs sanitized.
- Hidden sections are filtered consistently (`isSectionVisible`) in both templates; content is not duplicated into template-specific models.
- No `dangerouslySetInnerHTML` is used by either portfolio template for customer content.
