# Phase 7 — Test Report

## Automated
- `npx tsc --noEmit` — **passed**.
- Full `npx vitest run` — **171 passed, 2 pre-existing `features-v2` failures**.
- Targeted Phase 2/6 tests — passed.
- ESLint: no new Phase 7 errors; pre-existing React Compiler/URL-effect findings remain.

## Manual checklist
1. Preview Editorial; confirm persistent “Preview” indicator and Exit.
2. Apply with pending edits; confirm copy matches behavior and all edits save.
3. Preview → close X → Save; confirm saved template unchanged and indicator visible.
4. Footer legacy links: verify editor shows/edits them; save; verify public footer.
5. New profile: font selector shows Cairo; theme seed valid.
6. Keyboard: drawer Escape, visible focus on project/contact/footer links.
7. Screen-reader link list: project link names include titles.
8. Measure contrast for Editorial tokens/Classic palettes with a tool; fix only measured failures.
9. RTL/EN/AR visual pass.

## Not verified
Contrast numbers, screen reader output, browser preview, and long-form UX flows.
