# Phase 6 — Test Report

## Automated
- `npx vitest run __tests__/template-entitlements.test.ts __tests__/phase6-visibility.test.ts`
  - **23 passed / 23**.
- `npx tsc --noEmit` — **passed**.
- Full suite — **171 passed, 2 pre-existing `features-v2` failures**.

## Added tests
- Downgrade compatibility: Free owner can save while retaining the stored Editorial template.
- Visibility: home publish gate vs project Pro/grace/expired/suspended gate.

## Manual checklist
1. Pro→Free (Editorial saved): edit content, save; expect success without template activation.
2. Free crafted save switching to Editorial: expect `PRO_TEMPLATE_REQUIRED`.
3. Free→Pro then Editorial activation: expect allowed.
4. Published Free home visible; project detail pages hidden/404.
5. Grace: project pages visible; Expired/Suspended: hidden.
6. Subscription lookup failure: save denied, no partial write.
7. Re-upgrade preserves stored template.

## Not verified
No real subscription rows or browser; transition tests use mocked subscription state.
