# Current Bug Fixes — Manual Staging Checklist

Use synthetic staging data only. No production DB or deployment.

## Issue A — Card CTA
1. Pro account → create standalone page `case-study`; create card linked to it; set link label; save.
2. Builder preview: button visible, label correct.
3. Publish → click card button → `/u/{user}/projects/case-study` loads.
4. Switch card to external URL → button still works.
5. Delete/unpublish target page → button must not appear / must not 404.
6. Free plan: internal page CTA remains hidden (Pro-only page).
7. Repeat in Classic and Editorial; preview and public.

## Issue B — WhatsApp icon
1. Configure floating WhatsApp number; publish.
2. Confirm actual WhatsApp glyph (not chat bubble) in Classic and Editorial, desktop/mobile.
3. Check link opens `wa.me`, RTL/LTR alignment, screen-reader label.

## Issue C — Template preview switching
1. Open Templates; Preview Editorial → canvas changes immediately.
2. Preview Classic → reverts; repeat several times.
3. Close with X: persistent preview indicator remains; Exit works.
4. Apply Editorial with unsaved edits: saved template updates, preview remains Editorial, content preserved.
5. Apply Classic back: preview Classic immediately, no reload.
6. Reload: saved template matches last Apply, not preview-only state.

## Issue D — Footer credit
1. Classic public page and Editorial public page: “Developed by Portfolio Hub” visible, low emphasis.
2. Arabic: translated and correctly aligned RTL/LTR.
3. Dark appearance/editorial dark palette: readable contrast.
4. Check no duplicate credit.

## Issue E — Analytics
1. Open `/profile/builder/analytics` as a normal Pro user; note load time.
2. Confirm metrics unchanged vs before (views, 7/30-day, project counts, countries, daily chart).
3. Empty analytics state shows zeros/series without errors.
4. Cross-user: another account cannot see this user's analytics.
5. Check server logs/query count for the action; compare with previous implementation if possible.

## Issue F — Project detail template
1. Classic portfolio → open card: Classic detail layout/colors/spacing.
2. Editorial portfolio → open card: Editorial layout, burgundy/beige palette, typography, header/back/footer credit.
3. Switch templates back and forth; detail presentation follows the homepage.
4. Project items: images, file/R2 attachments, videos, external links, page links all work.
5. EN/AR + RTL; mobile/desktop.
6. Draft/unpublished/Free access rules unchanged.

## Issue G — End-to-end
1. Build a Classic portfolio with internal and external cards; publish; click through; switch to Editorial; repeat both.
2. Confirm no project content/media metadata/appearance values changed.
3. Deleted/unpublished targets show no dead CTA.
