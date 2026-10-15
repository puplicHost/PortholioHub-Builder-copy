# Sprint D verification — admin panel part 1 (Phase 7 slice)

- Scope: layout+guard, dashboard, users (+detail/suspend/unsuspend/reset/revoke), portfolios hide/unhide, audit-log UI, settings UI+registry, DataTable, audit writes. **Deferred to Sprint C:** requests queue, plans CRUD, payments pages/endpoints.
- Admin account on record: `dodahassan0045@gmail.com` (from 0002b; password unknown to automation — happy-path admin flows need that session).

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 (one genuine union-narrowing error found + fixed in `admin-guard.ts`) |
| `eslint` | 28 errors / 53 warnings — identical to Sprint B baseline; 3 self-found items fixed (impure `Date.now`, unused import, set-state-in-effect via lazy-init + `suppressHydrationWarning`) |
| `next build` | PENDING (runs in the same gate as live below — server was dev-only this round) |

## Live verification (guard half VERIFIED)

| # | Test | Result |
|---|---|---|
| 1 | Non-admin `GET /admin` | Redirect to `/profile/builder` (NEXT_REDIRECT markers; no admin chrome rendered) |
| 2 | Non-admin APIs (`dashboard/users/portfolios/audit-log/settings`) | **403** all five |
| 3 | Anonymous admin API | **401** |
| 4 | Seed flow regression | builder 200, `/u/testuser` 200 |
| 5 | Admin happy paths (dashboard numbers, suspend/reset/hide/settings PATCH, audit rows) | CODE-VERIFIED only (tsc + guard-tested endpoints + audit call sites in every mutating route) — needs the admin account session; recommended as user's 2-minute click-through |

## Visual-freeze check (Sprint D)

- `src/components/**`: **no existing file touched** (new `admin/` ×5 only). `src/app/**`: **no existing file touched** (new `admin/` pages + `api/admin/` routes only). `lib/*` touched: `guards.ts` (+`requireAdmin`, no UI). Layout/sidebar/cards reuse existing tokens (`--color-*`, `--radius-lg`) and `ui/*` primitives.

## Conformance

**~51% → ~59%** ((56 DONE + 27 PARTIAL×0.5)/118). Sprint C next (requests/plans/payments + approve flow + lifecycle + subscription page + limits).
