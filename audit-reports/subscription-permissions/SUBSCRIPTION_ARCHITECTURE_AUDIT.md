# Subscription Architecture Audit

## Existing plans/states
- `User` has `isAdmin` flag; subscriptions in `Subscription` with `status` string.
- `getSubscriptionState(userId)` returns `{ state: 'NONE'|'ACTIVE'|'GRACE'|'EXPIRED'|'SUSPENDED', ... }`.
- Effective = ACTIVE or GRACE. All other (incl. NONE/expired/canceled/suspended) are treated as Free for gating.
- `getEffectiveLimits` provides plan limits (projects/sections/storage) with free defaults.
- Plan records in `Plan` table; requests via `SubscriptionRequest` with WhatsApp code flow; admin approval transactional.

## Section registry (discovered)
Section types: hero, about, experience, education, skills, services, projects, testimonials, footer, custom, gallery, files, clients, contact, contact-info, stats.

## Free allowed sections
`FREE_LOCKED_SECTIONS` in `src/lib/free-sections.ts` now lists everything except hero, about, projects, footer. `isSectionLockedForFree(type)` checks lowercase membership; `stripLockedSectionsForFree` removes locked from preview/public.

## Existing gating before this task
- Builder sidebar marks locked sections and blocks selection; `isFreePlan` gates some add flows.
- `addCustomSection` was always visible (now gated for free).
- Public portfolio strips locked sections via `stripLockedSectionsForFree`.

## Affected entry points
- `src/app/profile/builder/BuilderClient.tsx` — sections UI, addCustomSection, isFreePlan.
- `src/lib/actions/portfolio.ts` updatePortfolio — server-side section/project guard added.
- `src/lib/free-sections.ts` — centralized lock list.