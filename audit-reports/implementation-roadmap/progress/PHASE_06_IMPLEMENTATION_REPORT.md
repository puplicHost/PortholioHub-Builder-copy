# Phase 6 — Implementation Report

## Findings
F-07, F-35.

## Implementation
- **F-07:** `updatePortfolio` now permits a Free owner to save non-template edits while the **already stored** Editorial template remains selected. It still rejects activation/switching to a Pro template. The guard compares requested and stored template ids and keeps subscription failures fail-closed. This prevents the downgrade save lock without granting Pro access.
- **F-35:** Added `isPortfolioHomeVisible` (publish/admin-hidden only) and reused `isPortfolioVisible` (publish + ACTIVE/GRACE) for project detail pages. The public home route now uses the explicit home helper; project detail pages remain Pro-gated. This codifies the policy instead of leaving divergent inline checks.

## Files changed
`src/lib/actions/portfolio.ts`, `src/lib/visibility.ts`, `src/app/u/[username]/page.tsx`, `__tests__/phase6-visibility.test.ts`, `__tests__/template-entitlements.test.ts`.

## Status
F-07: **fixed**. F-35: **fixed** with the current policy (home public on any plan; project pages Pro-only). No customer data was modified.

## Risks
- Policy remains: a downgraded owner’s Editorial public page continues rendering; only Pro activation is gated. This is presentation-only and documented.
- Subscription state still resolves per request; UI staleness until refresh is unchanged.
