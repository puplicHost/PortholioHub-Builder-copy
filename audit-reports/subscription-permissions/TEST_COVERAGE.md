# Test Coverage — Subscription Permissions

## New tests added
| File | Tests | Covers |
|---|---|---|
| `__tests__/subscription-actions.test.ts` | 11 | `createProjectPage` Free reject / Paid allow / unauthenticated reject; `updateProjectPage` Free standalone reject, Free card allow, Paid standalone allow, foreign-page reject; `deleteProjectPage` same matrix |
| `__tests__/subscription-permissions.test.ts` | 5 (4 existing + 1 new) | Free save drops locked sections; Free can create cards; Free new standalone blocked; downgraded standalone preserved; Paid retains normal delete-on-omission |
| `__tests__/entitlements.test.ts` | 3 | ACTIVE/GRACE paid, NONE/EXPIRED/SUSPENDED Free, DB errors propagate |

## Previously missing coverage now addressed
- Direct `createProjectPage` server-action authorization (including client-bypass scenario).
- Standalone page update/delete authorization for Free/Paid/foreign owners.
- Bulk-save downgrade preservation (explicit assertion that preserved page ID is not in delete list).
- Paid bulk-save continues normal delete-on-omission behavior.
- Entitlement resolution is server-trusted and DB errors are not converted to Free.

## Results
- New/related files: 3 files, 19/19 PASS.
- Full suite: 103 passed, 2 failed (pre-existing stale `features-v2.test.ts`, unrelated).
- `tsc --noEmit`: PASS. `npm run build`: PASS.

## Untested
- Real browser flows, real subscription lifecycle/cron changes, actual publishing after downgrade (manual).
- `publishProfile` limit messaging UI.