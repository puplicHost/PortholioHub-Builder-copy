# Storage Quota Test Report

## Executed
| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (retry after a transient DB-connectivity failure during static export) |
| `__tests__/storage-quota.test.ts` | 8/8 PASS |
| Full suite | 111 passed, 2 failed (pre-existing stale `features-v2.test.ts`) |

## Covered by `storage-quota.test.ts`
- Usage accounting: complete + reserved sums, remaining, uploadsAllowed.
- Reservation within quota; rejection when used+reserved+requested exceeds quota.
- Ineligible (zero-limit) account rejected with `SUBSCRIPTION_REQUIRED`.
- Completion overflow releases the reservation.
- Duplicate/expired completion returns `NOT_FOUND`.
- Expired reservation purge.
- Reconciliation mismatch reporting.

## Not executed (blocked/limitations)
- Two truly concurrent HTTP uploads against a live isolated DB (concurrency logic is enforced by `FOR UPDATE`; unit test asserts the lock is taken).
- Real R2 multipart end-to-end.
- Browser UI progress/usage refresh.
- 50 MB boundary + quota boundary against live R2.
- No production DB, no isolated staging account available.

## Manual verification steps
1. Open Files area → storage bar shows used/remaining.
2. Upload files until near 500 MiB; next upload rejected with quota error.
3. Two simultaneous uploads near the limit: only the request that fits succeeds.
4. Delete a file → usage drops; duplicate delete is a no-op.
5. Abandon an upload → reservation released after cleanup TTL.
6. Paid vs Free limits; Arabic/English and mobile layout.
