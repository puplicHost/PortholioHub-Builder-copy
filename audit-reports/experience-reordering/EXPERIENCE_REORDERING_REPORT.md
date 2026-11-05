# Experience Reordering Verification Report

## 1. Initial Implementation Status
Experience reordering was partially implemented in uncommitted WIP (ReorderButtons + SortableExperienceRow + moveExperienceItem). Drag-and-drop, keyboard move up/down, and persistence wiring existed, but touch targets were below 44px and boundary guards were incomplete. Public rendering already used array order.

## 2. Files Inspected
- `src/app/profile/builder/BuilderClient.tsx` (experience case ~3100-3230, moveExperienceItem, SortableExperienceRow)
- `src/app/profile/builder/ui/ReorderButtons.tsx`
- `src/lib/actions/portfolio.ts` (updatePortfolio save path)
- `src/lib/portfolio-schema.ts` (experienceItem schema)
- `src/components/portfolio/templates/ClassicTemplate.tsx` (experience rendering)
- `src/app/profile/builder/i18n/dictionaries.ts` (experience.* keys)
- `__tests__/portfolio-save-items.test.ts` (test pattern reference)

## 3. Files Modified
- `src/app/profile/builder/ui/ReorderButtons.tsx` — touch targets ≥44×44 (min-h/min-w).
- `src/app/profile/builder/BuilderClient.tsx` — moveExperienceItem bounds guards (from/to validation).
- `__tests__/experience-reordering.test.ts` — new persistence test (2 tests).
- `audit-reports/experience-reordering/EXPERIENCE_REORDERING_REPORT.md` — this report.

## 4. Bugs Discovered
- Touch targets for Move Up/Down buttons ~22px (below 44px requirement).
- moveExperienceItem did not validate `from` bounds (potential invalid index).
- No automated test covering experience order persistence.

## 5. Fixes Implemented
- Enlarged ReorderButtons touch targets to min 44×44.
- Added from/to bounds guards in moveExperienceItem.
- Added persistence regression test (reordered order persists; unchanged order skips write).

## 6. Drag-and-Drop Test Results
- DnDContext + SortableContext wired with PointerSensor + KeyboardSensor. onDragEnd validates active/over and indices. Status: NOT TESTED (no Playwright drag test added; existing conflict spec unaffected). Code review: PASS for logic.

## 7. Keyboard Test Results
- ReorderButtons Move Up/Down wired to moveExperienceItem; first item cannot move up (disabled + guard), last cannot move down. Labels present in ar/en. Focus-visible rings present. Status: PASS (code review + tsc).

## 8. Autosave and Persistence Test Results
- Reorder updates profile state → isDirty → manual save persists `content.items` order (verified by new test). Local draft autosave (localStorage) tracks dirty state. Conflict handling (expectedVersion) unchanged.
- Test: `experience-reordering.test.ts` — 2/2 PASS.

## 9. Public Portfolio Verification
- ClassicTemplate renders `expItems` in array order (no sort override). Status: PASS (code review). NOT TESTED visually (no browser run).

## 10. Arabic RTL and English LTR Verification
- Experience keys present in both ar/en. dir set on root. Status: NOT TESTED visually (no browser run).

## 11. Regression Test Results
- `tsc --noEmit`: PASS (exit 0).
- `eslint` on changed files: 0 errors, 17 warnings (pre-existing no-img/unused-vars).
- `vitest` (experience-reordering + portfolio-save-items + portfolio-schema): 3 files / 16 tests PASS.
- `npm run build`: PASS (all routes).
- Full vitest run: manifest.test.ts fails pre-existing (routes.manifest.ts missing 13 admin routes) — unrelated to this change; not modified.

## 12. Remaining Limitations
- No Playwright drag-and-drop test for experience reordering (deferred; requires browser env).
- Touch DnD not explicitly tested.
- Visual RTL/LTR verification not performed.
- Manifest test pre-existing failure unrelated.

## 13. Production Deployment Requirements
- None. Changes are client-side + one test file. No migration, no env changes, no deploy triggered. Safe to deploy via normal pipeline after review.

## 16. Separate Reorder Section Redesign (2026-11-05)

### Issues discovered
- Reordering controls were embedded inside the same rows as edit/delete/drag handle, mixing concerns.

### Files modified
- `src/app/profile/builder/BuilderClient.tsx` (added compact reorder section above existing entries card).
- `src/app/profile/builder/i18n/dictionaries.ts` (added reorderExperienceItems keys en/ar).

### Exact fixes
- New `#experience-reorder-card` FormCard at top titled "Reorder Experience Items" with compact rows showing only title + Move Up/Move Down (≥44×44 touch targets).
- Existing `#experience-entries-card` (drag handle, edit, delete, add) preserved unchanged below.
- Both sections share `experienceItems`, `experienceIds`, `moveExperienceItem` — single data source.

### Tests executed
- `tsc --noEmit`: PASS.
- `eslint` (BuilderClient): 0 errors, 17 warnings (pre-existing).
- `vitest` (experience-reordering): 3/3 PASS.

### Tests not executed
- Playwright/browser (user will test manually).

### Remaining limitations
- Browser verification deferred to user.

## 15. Code Review & Fixes (2026-11-05)

### Issues discovered
1. Touch targets below 44px on Move Up/Down buttons (ReorderButtons).
2. `moveExperienceItem` did not validate `from` index bounds.
3. No Array.isArray guard on `c.items` in BuilderClient and ClassicTemplate (potential crash on malformed data).
4. No automated test for experience order persistence.

### Files modified
- `src/app/profile/builder/ui/ReorderButtons.tsx` (touch targets).
- `src/app/profile/builder/BuilderClient.tsx` (bounds guards + Array.isArray).
- `src/components/portfolio/templates/ClassicTemplate.tsx` (Array.isArray).
- `__tests__/experience-reordering.test.ts` (3 tests).

### Exact fixes
- ReorderButtons buttons: `min-h-[44px] min-w-[44px]`.
- moveExperienceItem: validate from/to bounds before arrayMove.
- BuilderClient: `experienceItems = Array.isArray(c.items) ? c.items : []`.
- ClassicTemplate: `expItems = Array.isArray(c.items) ? c.items : []`.
- Tests: persistence of reordered order, unchanged-order skip write, property preservation.

### Tests executed
- `tsc --noEmit`: PASS (exit 0).
- `eslint` (modified files): 0 errors introduced; 3 pre-existing errors (clampImagePosition `any` ×2, set-state-in-effect ×1) and 29 warnings (pre-existing baseline, not changed by this work).
- `vitest` (experience-reordering): 3/3 PASS.
- Build: not re-run in this pass (previously PASS).

### Tests not executed
- Playwright/browser: not run (per user instruction; manual testing by user).
- Database-backed tests against remote Supabase: not run (production safety).

### Remaining limitations
- No browser-level verification (user will perform).
- Drag-and-drop touch behavior not automated.
- Manifest test pre-existing failure unrelated.

### Manual testing steps for the user
1. Register/login a Pro account; open builder.
2. Open Experience section; add 3 items labeled A, B, C.
3. Drag C above A → expect C, A, B.
4. Move B to first via Move Up → expect B, C, A.
5. Save; reload builder; verify B, C, A persists.
6. Publish; open /u/<username>; verify same order in ar and en.
7. Test keyboard (Tab to move buttons, Enter/Space) and mobile widths 320/375/430px.
8. Verify dirty-state indicator and conflict modal still work.

## 14. Safe E2E Verification Attempt (2026-11-05) — BLOCKED

### Environment verification (Phase 0)
- Runtime: NODE_ENV=development (from .env).
- APP_URL: http://localhost:3000.
- Database host: aws-1-eu-central-1.pooler.supabase.com (remote Supabase pooler, port 6543). Direct URL same host.
- Database name: postgres. User: postgres.<project-ref> (masked).

### Production-safety determination
The database is a **remote Supabase project**, not a local or conclusively isolated staging database. No local Postgres, no staging markers, and no metadata proving non-production status are available. Per the absolute production-protection requirement ("If you cannot conclusively prove that the environment is non-production, STOP immediately"), browser tests, Pro grants, and any DB writes are **BLOCKED**. No Pro grant was attempted; no synthetic records were created or modified; no browser tests were run in this phase.

### Account inspection
Not performed (blocked by environment uncertainty). The specified synthetic account `smoke1793889804281@portfoliohub.test` was not queried.

### Grant-subscription mechanism
Not invoked. Implementation exists at `src/app/api/admin/users/[id]/grant-subscription/route.ts` (per prior docs), but not called due to blocker.

### Browser verification
Not performed. All required checks (drag, keyboard, touch, autosave, persistence, public order, RTL/LTR) remain NOT TESTED/BLOCKED. See section 14 (previous) for the subscription-gate blocker.

### Cleanup
None performed (no changes made).

### Remaining blockers
1. Cannot prove the configured Supabase database is non-production.
2. Experience section gated behind Pro subscription (existing business rule).
3. No isolated staging environment available to the agent.

## 14. Final Browser Verification (2026-11-05) (previous)

### Environment
- Dev server: `npm run dev` on http://localhost:3000 (webpack), Playwright 1.64.1.
- Browser: Chromium (Playwright default). Viewport: default desktop + mobile checks not run.
- Synthetic user: `exp<stamp>@portfoliohub.test` (registered via /register). No production customer data used.

### Results
| Test | Browser/Viewport | Interaction | Expected | Actual | Status |
|---|---|---|---|---|---|
| Smoke registration | Chromium/desktop | Register new user | Lands in builder | PASS | PASS |
| Experience section access | Chromium/desktop | Open builder as free user | Experience editor available | Experience section shows "🔒 Premium subscribers only (Pro)" — gated behind subscription | BLOCKED |
| Drag-and-drop reorder | Chromium/desktop | Drag C above A | C,A,B | Not reachable (section locked for free tier) | BLOCKED |
| Keyboard Move Up/Down | Chromium/desktop | Click move buttons | Order changes | Buttons present in code (ReorderButtons) with ar/en labels; not exercised in browser due to subscription gate | NOT TESTED |
| Touch targets | Chromium/desktop | Measure reorder buttons | ≥44×44 px | Code sets min-h/min-w 44px; not measured in browser | NOT TESTED |
| Local draft autosave | Chromium/desktop | Reorder then check localStorage | Draft saved | Not exercised (section locked) | NOT TESTED |
| Server persistence | Chromium/desktop | Save + reload | Order persists | Not exercised (section locked) | NOT TESTED |
| Public portfolio order | Chromium/desktop | Publish + view /u | Same order | Not exercised | NOT TESTED |
| Arabic RTL / English LTR | Chromium/desktop | Switch language | Correct layout | Not exercised | NOT TESTED |

### Distinguishing verification types
- Client-side state: NOT TESTED in browser (unit-level persistence test `experience-reordering.test.ts` covers server save of ordered `content.items`).
- Local draft persistence: NOT TESTED (section locked).
- Server/database persistence: Verified at unit level via mocked `updatePortfolio` (ordered items written; unchanged order skips write). NOT TESTED end-to-end in browser.
- Published portfolio rendering: Code review confirms `ClassicTemplate` renders `expItems` in array order with no sort override. NOT TESTED in browser.

### Key finding
The Experience section is gated behind a Pro subscription (`🔒 Premium subscribers only`). A free registered test user cannot access the experience editor, so browser-level drag-and-drop, keyboard, touch, autosave, persistence, and public-rendering verification could not be performed without granting a subscription (requires admin session / grant-subscription flow). This is an existing business rule, not a defect introduced by this work.

### Recommendation
To complete browser verification, grant a Pro subscription to a synthetic test user via the admin grant-subscription endpoint (admin session required), then re-run a Playwright spec exercising drag (C→A), keyboard (Move Up/Down), save+reload, and public portfolio order. No code change needed for this.