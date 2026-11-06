# Final Subscription Permissions Audit

## Architecture (verified)
- `src/lib/entitlements.ts` — centralized `getEntitlements(userId)` resolving `getSubscriptionState`; ACTIVE/GRACE = paid, all else Free. DB errors propagate (no silent Free fallback).
- `src/lib/free-sections.ts` — allowlist `FREE_ALLOWED_SECTIONS = hero, about, projects, footer`; every other/unknown section is locked by default.
- `src/lib/actions/portfolio.ts`:
  - `updatePortfolio` — server-side Free guard: drops locked sections, blocks new/updated standalone pages, excludes preserved standalone pages from delete-on-omission, forces `showInProjects: true` for free.
  - `createProjectPage` — rejects Free with `SUBSCRIPTION_REQUIRED`.
  - `updateProjectPage` / `deleteProjectPage` — reject Free for `showInProjects === false`; allow cards.
  - `publishProfile` — excludes preserved standalone pages from Free plan counts so a downgrade doesn't block publishing allowed content.
- `BuilderClient.tsx` — locked sections + locked "Add Section" with upgrade toast.
- Public rendering — `stripLockedSectionsForFree` removes paid sections; standalone project pages 404 if not ACTIVE/GRACE.

## Actual behavior
- Free: exactly 4 sections editable; project cards fully usable; standalone pages blocked server-side.
- Paid: all sections/pages retained.
- Unknown section types: locked (allowlist).
- UI restrictions are backed by server checks; direct action calls cannot bypass.

## Remaining gaps
- No automated browser/e2e (per project rules).
- `publishProfile` frontend messaging for plan-limit failures is generic; manual verification needed.
- Existing stale `features-v2.test.ts` failures unrelated.