# Phase 5 — Test Report

## Automated
- `npx tsc --noEmit` — **passed**.
- Full `npx vitest run` — **171 passed, 2 pre-existing `features-v2` failures**; no Phase 5 test was added because these are template-rendering paths without a DOM test harness.
- ESLint on changed files: remaining errors are pre-existing React Compiler/URL-effect findings; no new Phase 5 type error.

## Manual checklist
1. Classic testimonial with text only (no photo) → visible text card.
2. Mixed photo/no-photo testimonials → slider + text grid, no duplicates.
3. Contact links: email, phone, WhatsApp, website, invalid value; click each, check icon.
4. Footer email/phone links use correct icons.
5. Editorial portfolio → card → detail page: burgundy palette, readable contrast, links work.
6. Classic portfolio → detail page unchanged.
7. RTL/EN/AR and mobile checks.

## Not verified
No browser/visual or real data. F-16 is palette-only, not a fully designed Editorial detail skin.
