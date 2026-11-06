# Downgrade Safety

## Lifecycle (logical, synthetic)
1. Paid account creates paid-only sections + standalone project pages.
2. Subscription expires → `getSubscriptionState` = EXPIRED (Free).
3. Builder: paid sections locked; standalone pages not selectable/editable; cards remain usable.
4. Free save: locked sections dropped from payload (DB rows untouched); preserved standalone pages excluded from delete-on-omission.
5. Public: locked sections stripped; standalone project pages 404.
6. Upgrade: paid sections/pages editable/rendered again.

## Content preservation (verified by tests)
- `subscription-permissions.test.ts` asserts an existing `showInProjects=false` page ID is **not** included in the bulk-save delete list for Free users.
- Paid users retain normal delete-on-omission.
- No content is deleted or overwritten by the Free guard.

## Publishing after downgrade
- `publishProfile` previously counted **all** project pages (including preserved standalone pages) against the Free `maxProjects` limit (default 10), so a downgraded user with many preserved pages could be unable to publish allowed Free content.
- **Fix:** for Free users, publish counts exclude `showInProjects === false` pages (and their galleries). Preserved paid pages no longer block publishing; they remain stored and hidden publicly.
- Paid counting behavior unchanged.
- Publishing never mutates/deletes sections or project pages.

## Intentional restrictions retained
- Free `maxProjects`/`maxSections`/`maxGalleryItems` limits still apply to the Free-visible portfolio.
- Standalone pages remain inaccessible/uneditable on Free.
- No pricing/billing/lifecycle changes.