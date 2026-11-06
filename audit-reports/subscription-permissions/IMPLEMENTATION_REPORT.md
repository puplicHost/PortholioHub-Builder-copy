# Implementation Report

## Files changed
- `src/lib/free-sections.ts` — expanded `FREE_LOCKED_SECTIONS` to all non-free sections.
- `src/lib/entitlements.ts` (new) — centralized `getEntitlements`, `canUseSection`, `canCreateStandaloneProjectPage`, `canManageStandaloneProjectPage`.
- `src/app/profile/builder/BuilderClient.tsx` — gated "Add Section" behind `isFreePlan` (locked button + toast).
- `src/lib/actions/portfolio.ts` — server-side guards:
  - `updatePortfolio`: drops locked sections; allows new project CARDS (`showInProjects !== false`); blocks new/updated standalone pages; excludes downgraded users' standalone pages from the delete-on-omission path so they are preserved.
  - `createProjectPage`: returns `SUBSCRIPTION_REQUIRED` for free users.
  - `updateProjectPage` / `deleteProjectPage`: block operations on `showInProjects === false` pages for free users.

## Decisions
- Reused existing `isFreePlan` (ACTIVE/GRACE based).
- No new DB fields, plans, or billing changes.
- Server-side filtering preserves existing rows (no deletion).

## Tests
- `tsc --noEmit`: PASS.
- Existing targeted unit tests: still pass (no regressions observed for changed code paths).
- No new automated tests added in this pass; manual verification required for free/paid flows.