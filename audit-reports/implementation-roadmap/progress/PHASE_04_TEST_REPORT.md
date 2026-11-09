# Phase 4 — Test Report

## Automated
- `npx tsc --noEmit` — **passed** after adaptations to Editorial.
- Full `npx vitest run` — **171 passed, 2 pre-existing `features-v2` failures**.
- `npx eslint` on changed files — no new Phase 4 fatal errors; remaining errors are pre-existing React Compiler/URL-effect warnings in Builder/Classic.
- Fixed two TypeScript issues introduced in the Editorial variant mapping (implicit any, nullable CTA href).

## Not automated
- Visual rendering of appearance colors/fonts/dark palette.
- Container-query behavior in Builder desktop/mobile/admin frames.
- Hero background/overlay and avatar focal point.
- Experience grid/list, Skills bars/both, Projects list.
- Section reordering, floating actions and analytics.
- RTL/AR typography and focus rings.
- F-37 reference Hero comparison.

## Manual staging checklist
1. Select Editorial; change primary/accent/background/text/font/color mode; publish/preview.
2. Verify all four color groups and font update; confirm Classic remains unchanged.
3. Switch experience/skills/projects modes; verify each variant.
4. Drag sections; verify public/preview order.
5. Preview at 375/768/1080; verify no desktop layout in mobile frame and no overflow.
6. Configure WhatsApp + scroll actions; click; check analytics.
7. Set avatar focal point and hero background/overlay.
8. Add 6 stats/features/extra links; verify all render.
9. Toggle clients shape/size/grayscale; add education image; testimonial subtitle; contact labels.
10. Test EN/AR/RTL, keyboard focus, and reduced motion.

## Not verified
No browser automation, real images, or database data. Visual results are source-inferred only.
