# Performance and Accessibility Review for Editorial Marketing Template

## Performance strategy

1. **Dynamic import**
   - Lazy-load `EditorialMarketingTemplate` so Classic already-loaded bundles remain unchanged when first template selected globally.
   - Use `next/dynamic` at route + LivePreview to avoid adding font/JS to builder.
2. **Fonts**
   - Import Playfair Display + Inter via `next/font/google`; both benefits self-hosting, no flash, built-in display font; Inter dedupe.
   - Set `display: swap`, subset `latin`, optional Arabic fonts if RTL support demanded (see accessibility).
3. **Images**
   - Render `next/image` with appropriate sizes; re-use existing R2/CMS resized asset paths.
   - Lazy load non-critical covers.
   - Consider `sizes="(max-width: 760px) 100vw, 33vw"` for project grid.
4. **Animations**
   - IntersectionObserver with one instance; guard with `prefers-reduced-motion`.
   - initial rendered content visible in SSR (do not opacity:0 default requiring JS); use reduced-motion CSS.
   - Remove per-item observer on unmount.
5. **CSS scope**
   - `.emk-template` local custom properties; avoid clipping global `:root`; start with media→container via adapters.
6. **Bundle impact**
   - Avoid Lucide CDN (use bundle). Avoid SCSS, animation libraries.
7. **Data loading**
   - Single fetch/route load; avoid extra dedicated stats/users endpoint.
   - Use same `getPublicProfile` cache (works for React `cache`).
8. **Admin support**
   - Admin `BuilderPreviewClient` uses same component; match CSS width and theme and use layout class.
9. **Mobile**
   - Reference viewport breakpoints (420–1080), convert sections to grid using grid with safe minimum heights.
   - 6 brand/content cards → auto-fill columns `.grid-template-columns: repeat(auto-fill, minmax())`.
10. **Exclusion of regressions**
    - Add tests in `__tests__/templates/` ensure:
      - `classic` fallback unknown
      - profile data unaffected during template switches (new tests)
      - e2e last groundwork not yet enabled.

## Accessibility strategy

- Semantic sections + heading hierarchy (`h1` hero name, use h2 section headings).
- `nav` and `aria-label` for main nav; use left-to-right arrow handling via `rtl:` for LTR/RTL; update `arrow-right` icons via `rtl:rotate-180` or Lucide logical icon.
- ARIA controls for mobile menu (already preserved) and expanded semantics.
- Focus-visible styles (existing) on all links/buttons; new custom components need explicit styles.
- Color contrast (validate Tailwind/stated `#6E1E35` etc.): target 4.5/normal; burgundy on off-white is high contrast (>= 15:1). Muted `#6F6759` on `#FBF7EE` estimated around 4.5—measure with final.
- Link icon-only buttons need labels (copying labels).
- Video autoplay not used; no time-sensitivity.
- Dark mode: reference is light-only. To stay aligned with PortfolioHub builder's two-mode palette, ensure editorial template starts as fixed accessible light layout even if builder/dark settings active, or styles sufficient dark mode not needed if design is light-authoritative. However dark theme forces `--on-primary` dark. Suggest no dark palette for editorial unless approved.
- Reduced motion: default safe state and transitions off (`@media (prefers-reduced-motion)`) globally for template class; animation classes don't hide content in SSR.
- Keyboard cancellation: escape closes mobile nav (currently does not in `setupNav`).
- RTL behavior: replace `letter-spacing` overrides for Arabic; use `margin-inline`, `padding-inline`; headings Playfair may fallback to Arabic `Cairo` in RTL.
- Ensure page-level `<html lang>` matches `getPortfolioLang(appearance)` and direction reflects owner default as Classic currently does.

## Performance Risks

- Font weight including all Playfair variants increases bundle; trim to 400/500 italic.
- High-res project folder images (PNGs) may be large → platform image pipeline.
- IntersectionObserver: better observe root once instead of per card if grid.
- `innerHTML` removal prevents injecting safe text.

---

End review.