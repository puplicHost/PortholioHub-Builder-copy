# Test Report

## Commands executed
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- `__tests__/subscription-permissions.test.ts`: 4/4 PASS (locked-section drop, free card creation allowed, new standalone page blocked, downgraded standalone page preserved).
- Full suite: 86 passed, 2 pre-existing stale `features-v2.test.ts` failures.

## Not executed
- Free/paid browser flows (no Playwright per instruction).
- Downgrade/upgrade scenario tests (would require DB writes; production safety).
- Standalone project-page restriction end-to-end.

## Manual verification steps
1. Log in as a Free user → builder shows only Hero, About, Project Cards, Footer editable; all other sections locked; "Add Section" is a locked button.
2. Attempt to craft a save with a paid section → server drops it; portfolio unchanged.
3. Attempt to create a standalone project page on Free → blocked server-side.
4. Upgrade to paid → all sections editable; existing content restored.
5. Downgrade back to Free → paid sections become locked/read-only; content preserved in DB.
6. Publish and verify public portfolio reflects entitlement (locked sections stripped).