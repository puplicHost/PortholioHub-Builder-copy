# Final Status — Subscription Permissions Phase 2

## Completed
- Audited entitlements, free-section allowlist, bulk save, project-page actions, publishing, public rendering.
- Added direct server-action authorization tests (create/update/delete).
- Added downgrade/bulk-save regression tests (Free preservation + Paid normal behavior).
- Added entitlement-resolution tests incl. DB-error propagation.
- Fixed publish-after-downgrade plan-count inconsistency (preserved standalone pages excluded from Free counts).
- Reports: FINAL_AUDIT, TEST_COVERAGE, DOWNGRADE_SAFETY, FINAL_STATUS.

## Test results (actual)
- `tsc --noEmit`: PASS.
- `npm run build`: PASS.
- Subscription-related tests: 19/19 PASS.
- Full suite: 103 passed, 2 failed (pre-existing stale `features-v2.test.ts`, unrelated).
- ESLint changed files: no new errors observed.

## Remaining manual verification
- Log in Free: confirm only Hero/About/Project Cards/Footer editable; locked Add Section; cards work.
- Crafted request: adding/updating paid sections or standalone pages is rejected/dropped.
- Downgrade a synthetic paid account: paid content remains stored, locked; public strips paid sections; standalone page 404.
- Re-upgrade: content available again.
- Publish after downgrade with preserved pages: succeeds; standalone pages not counted.
- Session expiry/login redirect.

## Known risks / blockers
- No browser/e2e automation (project rule).
- Publishing limit feedback in UI is generic.
- Pre-existing `features-v2` failures unrelated.

## Safety
No production data, subscriptions, migrations, dependency changes, or deployments were modified.