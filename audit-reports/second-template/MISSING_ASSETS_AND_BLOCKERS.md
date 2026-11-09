# Missing Assets and Blockers

## Verified from audit environment

Reference assets exist under `/projectss/Esraaa/` and are available locally:
- `assets/images/profile.jpg` ✓
- `assets/images/previews/` (4): `refit-plan.jpg`, `cafe-presentation.jpg`, `english-strategy.jpg`, `aircon-content-plan.jpg` ✓
- `assets/logos/` (9 JPEGs) ✓
- `assets/docs/Esraa-Ahmed-CV.pdf` ✓
- `assets/projects/` (6 folders; 34 image/PDF files) ✓
- 6 case study pages ✓

## Missing (inside PortfolioHub repo itself)

No assets are checked into `public/` yet for the second template. Required platform asset mappings:
- `assets/public/templates/editorial/cover.jpg/png` used in builder selector (must be generic screenshot, no sample logo).
- font optimization package integration (`next/font`) rather than reference style `<link>`.
- case study reference images should be real user uploads or seeded platform generic launch thumbnail, not example portraits.

## Verified findings vs assumptions

**VERIFIED**
- Reference source layout and JS behavior from actual index/style/main.
- Data models map directly to profile sections and project rows.
- Assets are staged but not committed in PortfolioHub.

**ASSUMPTIONS / NOT VERIFIED**
- Case study-specific layout interactions (testimonials within project page) — unread beyond headings.
- Cache/orphan behavior and schema migration policy in Supabase (cloud environment inaccessible).
- Subscription plan count/entitlement setup per template (choice left to product policy).
- End-user wants `editorial-marketing` template exposed only for paid users (unknown).

No assets need to be created by auditor. Do not treat vendor PDFs as default user content.

## Blockers (not architectural)

1. Exact product decision required: Free vs Paid access to editorial template.
2. Design docs to snapshot: final pixel dimensions/cover preview image approval perhaps.
3. Backend verification (Supabase DB unavailable in audit scope): user interaction schema interactions maybe.

## What remains safe to proceed without assets
- Architecture, mapping, safety rules, data-preservation.
- Builder selector UX.
- Integration boundaries.
- Rendering resolver.

These deliver effects prepared but implementation **must not** be attempted until approval.