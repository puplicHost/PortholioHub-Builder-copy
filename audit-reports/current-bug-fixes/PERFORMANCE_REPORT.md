# Current Bug Fixes — Performance Report (Issue E)

## Investigation path
`AnalyticsDashboard` receives all data from a server action; there are no client fetches or duplicate requests in the dashboard. The slow path is server-side:

1. `src/app/profile/builder/analytics/page.tsx` awaited `requireUser()`.
2. `getPortfolioAnalytics()` awaited `requireUserWithWorkspace()`, which resolves the user again and calls `ensurePersonalWorkspace` (extra DB reads/writes not needed for analytics).
3. The action loaded all events in the last 30 days (`findMany`) and computed totals, project counts, country counts and daily buckets in JS.

## Changes
- Use `getCurrentUser()` in the analytics action; no workspace bootstrap.
- Removed the duplicate `requireUser()` from the page.
- Replaced 30-day row loading for totals/projects/countries with:
  - `groupBy(eventType)` for 30-day totals,
  - `count()` for 7-day/previous-7/previous-30 totals,
  - `groupBy(projectPageId)` for project views,
  - `groupBy(country)` for countries.
- `findMany` now selects only `createdAt` and only page/project views for the 30-day daily series.
- Metrics definitions, date windows and access rules are unchanged.

## Confirmed vs hypothesis
- **Confirmed source-level:** unnecessary workspace bootstrap; duplicate auth; unbounded event-row loading for aggregates.
- **Unverified:** actual latency improvement and query plans. No DB or browser access was used, so no baseline/post-change timings are claimed.

## Remaining performance risk
If `/u` traffic is high, the daily query still reads one timestamp per page/project view in 30 days. Recommended safe follow-up (database change, not executed):
- index `(profileId, createdAt)` and `(profileId, eventType, createdAt)`,
- optionally replace daily bucketing with a database date-truncation aggregate after approval.
No SQL file was created because the index is not required for the code fix and would need production review.
