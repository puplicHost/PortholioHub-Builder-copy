# Asset Status — Editorial Marketing Template

Reference package: `local/2template/` (from the customer reference — `index.html`, `style.css`, `main.js` only).

## What the reference references but does not ship

| Referenced in `index.html` | Status in `local/2template/` | Disposition |
| --- | --- | --- |
| `assets/images/profile.jpg` (+ other referenced asset paths) | **Missing — no `assets/` directory exists** | Not reproduced. The template renders the customer's own `profile.avatarUrl`, project covers, client logos, testimonial photos, gallery images — no placeholder image is invented. |
| `assets/docs/Esraa-Ahmed-CV.pdf` | Missing | Used the existing `files` section (R2/cloud URLs) instead. |
| Six case-study pages (per task brief) | **Missing — the folder contains only `index.html`; no `case-*.html` files** | Not reproduced as demo content. Each "case study" maps to a real `ProjectPage` row (`isPublished`, real slug, cover, tags, description) with Classic's exact link semantics (page link for Pro owners, external link, or plain card). |
| Brand logos | Missing | Rendered from the `clients` section `items[].logoUrl`; items without a logo render their name in a logo card. |
| Playfair Display / Inter fonts | Source files not shipped (loaded from Google Fonts CDN in the reference) | Loaded via `next/font/google` (tree-shaken latin subset), Arabic text falls back to the system serif stacks already used app-wide. |
| Inline SVG accent art (data-URI favicon/profile mark) | Present inline | Not copied; builder/host `avatarUrl` is used. |

## Verified available in-code assets (reused, not vendored)

- `@/lib/project-card-visuals` file-type tones + `ProjectFileIcon` (shared with Classic cards).
- `getSocialIcon` / `getContactIcon` from `PortfolioFooter` (SVG icon set, no new dependency).
- `PORTFOLIO_ICON_MAP` for section icons (unknown icon names render nothing rather than a fake glyph).
- Palette + type scale recreated as fresh CSS custom properties — no reference CSS was copied wholesale and no image/font binaries were added to the repo.

**Conclusion:** nothing referenced by the customer package was fabricated. Every editorial section renders exclusively existing, customer-owned content; unavailable reference assets are documented here and mapped to real models.
