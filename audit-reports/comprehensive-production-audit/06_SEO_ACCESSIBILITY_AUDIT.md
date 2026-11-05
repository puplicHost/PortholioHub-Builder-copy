# SEO & Accessibility Audit — PortfolioHub Builder

## SEO

**Metadata:**
- `src/app/layout.tsx` generateMetadata: title template, description, metadataBase, OG, Twitter, images via dynamic `/og`. Good.
- `src/app/page.tsx`, `src/app/en/page.tsx`: per-language titles/descriptions, hreflang, OG/Twitter. Verified phase H.
- `src/app/u/[username]/page.tsx`: generateMetadata with profile data, canonical, JSON-LD Person, og:image via `/og?title=...`. Evidence: page.tsx:67.
- `src/app/u/[username]/projects/[slug]/page.tsx`: project metadata, JSON-LD CreativeWork, og:image. Evidence: page.tsx:73.

**Canonical / hreflang:**
- Landing has hreflang ar/en/x-default. Public portfolios: verify canonical absolute (per Sprint B B12 added). Good.

**Sitemap / robots:**
- `src/app/sitemap.ts`: includes `/`, `/en`, published profiles/projects (capped 500+500). `src/app/robots.ts`: allows `/`, `/u/`; disallows `/profile/`, `/api/`, `/admin`. Verified phase H adds sitemap entries.

**Structured data:**
- JSON-LD Person (portfolio) and BreadcrumbList (project pages) with `<` escaping (per prior audit). Minimal Person (no sameAs/image). **SEO-SD-01 (Low):** enrich Person with image/sameAs.

**OG images:**
- Dynamic `/og` route (`src/app/og/route.tsx`) generates 1200×630. Earlier audit's "missing og.svg/opengraph.png" is **stale** — current code uses dynamic route. Verified no references to og.svg/opengraph.png in src (grep). Good. But the dynamic route must render correctly (verify via curl in safe env).

**Indexing safety:**
- Draft/hidden/ineligible portfolios → 404 via `isPortfolioVisible` + notFound. Good. `noindex` on not-found (per Sprint B B12). Verify.

**Duplicate content:**
- `/u/username` and subdomain rewrite could create duplicate URLs. Middleware rewrites subdomain → `/u/...` (same canonical). Verify canonical points to canonical host to avoid duplicates. **SEO-DUP-01 (Medium):** confirm canonical host consistency.

**Image alt text:**
- Raw `<img>` may lack alt. Not audited per-file. **SEO-ALT-01 (Low):** verify alt attributes in templates.

**Arabic/English SEO:**
- Independent metadata per language. Good. Verify hreflang reciprocity.

## Accessibility (WCAG 2.2 AA)

**Semantic HTML / headings:**
- Layout uses `<html lang dir>`. Heading hierarchy not fully audited (requires render). **A11Y-H-01 (Medium):** verify heading order on public pages and builder.

**Keyboard navigation:**
- DnD has keyboard support via sortableKeyboardCoordinates (per gap analysis). ReorderButtons provides up/down buttons. Focus-visible rings present (`focus-visible:ring-2`). Good.
- Modal accessibility: conflict modal client-state; verify focus trap/return. **A11Y-MOD-01 (Medium):** verify focus management.

**ARIA:**
- ReorderButtons have aria-label. Notification bell aria-label. Good. Drag handles may need aria-grabbed/role. **A11Y-ARIA-01 (Low).**

**Screen reader:**
- Form labels: verify all inputs have labels. Not fully audited. **REQUIRES SAFE TEST ENVIRONMENT** (screen reader / axe).

**Color contrast:**
- Not measured. **REQUIRES SAFE TEST ENVIRONMENT** (axe/Lighthouse). Design tokens: primary blue #0066cc on white likely passes; muted #7a7a7a on white ~4.5? verify.

**Touch targets:**
- ReorderButtons chevrons 14px (h-3.5 w-3.5) — below 44px recommended. Drag handles small. **A11Y-TOUCH-01 (Medium).**

**Reduced motion:**
- Stagger animation (0.55s) not gated by prefers-reduced-motion. **A11Y-MOTION-01 (Low).**

**Language attributes:**
- `<html lang dir>` set from server + client script. Good. `suppressHydrationWarning`. Good.

**RTL accessibility:**
- Direction set; verify logical properties / no horizontal overflow. **REQUIRES SAFE TEST ENVIRONMENT.**

## Summary
SEO fundamentals strong (metadata, hreflang, sitemap, robots, JSON-LD, canonical). Main gaps: enrich Person schema, verify canonical host duplicates, alt text audit, mobile/RTL visual validation. Accessibility: touch targets, focus management, contrast, reduced motion need verification (not measured here).<|end|><|start|><|start|>write to=assistant<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/My SaaS/PortholioHub-Builder-copy/audit-reports/comprehensive-production-audit/06_SEO_ACCESSIBILITY_AUDIT.md