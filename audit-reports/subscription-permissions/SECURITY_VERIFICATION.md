# Security Verification

## Backend authorization
- Central `getEntitlements(userId)` resolves subscription server-side.
- `updatePortfolio` drops locked sections for free users and ignores new/standalone project-page updates.
- `createProjectPage` returns `SUBSCRIPTION_REQUIRED` for free users.
- `updateProjectPage`/`deleteProjectPage` block `showInProjects === false` pages for free users while still allowing project cards.
- Ownership checks unchanged.

## Confirmed bypasses found during review and fixed
1. `createProjectPage` (a directly callable Server Action) had no subscription check, so a free user could create standalone project pages directly. Fixed.
2. `updateProjectPage`/`deleteProjectPage` lacked the standalone-page check. Fixed.
3. **Data-loss risk:** the bulk save delete-on-omission logic would have deleted a downgraded user's existing standalone page because it was filtered out of the update plan. Fixed by excluding `standaloneIds` from removals for free users; regression test added.
4. **False restriction:** the first guard blocked ALL new `new-` project rows, including normal project cards. Fixed to block only `showInProjects === false`; regression test added for allowed card creation.

## Bypass resistance
- A crafted save with locked `sectionType` values is filtered server-side.
- A crafted `projects` array with `new-*` ids is filtered server-side.
- Client-side plan flags cannot grant access (server is authoritative).

## Remaining risks
- Free users can still VIEW existing locked sections in the builder (read-only, locked) for recovery; they cannot edit (UI lock + server filter prevents overwrites). Acceptable per data-preservation requirement.
- No rate limiting on save (pre-existing).