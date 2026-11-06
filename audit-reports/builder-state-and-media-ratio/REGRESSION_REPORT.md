# Regression Report

## Behaviors checked (code review + automated where possible)
- **Normal navigation:** URL sync uses `replaceState` only; no router navigation or redirects added.
- **Builder tabs:** switching Sections/Pages still uses existing handlers; URL reflects the tab.
- **Project pages:** existing `handleSelectProjectPage` reused for restoration; ownership unchanged.
- **Sections:** restoration reuses `handleSelectSection`; Free locked sections are not restored/edited.
- **Authentication:** unchanged server-side `requireUser`; no client auth bypass.
- **Projects/cards:** create/edit/reorder/delete logic untouched; only presentation props added.
- **Visual switching:** Image/File Icon/Video/None behavior preserved; aspect is scoped per visual.
- **Legacy cards:** `'auto'` default means no visual change until a user selects a ratio.
- **External links & documents:** unchanged; R2 viewer links unchanged.
- **R2/video security:** ownership, private access, 50 MB limit unchanged.
- **Subscription permissions:** no changes to entitlements; locked-page server guards remain.

## Potential regressions / risks
1. **URL sync vs. browser back/forward:** `replaceState` intentionally avoids history entries; back/forward will not step through builder tabs (same as before). Not a regression.
2. **Scroll restoration accuracy:** depends on content height after hydration; may overshoot if images load later.
3. **Aspect ratio + `imageFit: cover`:** when a ratio is set, rendering forces `object-contain` to avoid cropping (documented decision).
4. **Very tall ratios (9:16) in a grid:** card height grows; responsive but visually tall.
5. **Legacy `attachment*`/`video*` metadata:** untouched.
6. **No DB migration required.**

## Unresolved
- Browser behavior not automated; manual verification required.
- Pre-existing `features-v2` test failures unrelated to these changes.