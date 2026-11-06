# Concurrency & Accounting

## Atomic reservation
`reserveStorage` runs in `prisma.$transaction` and executes `SELECT id FROM users WHERE id = $1 FOR UPDATE`. This serializes quota checks per user across all Vercel instances (database row lock, not process memory). Inside the lock it sums complete + non-expired pending rows, rejects if `used + reserved + requested > limit`, otherwise creates a `pending` MediaFile row as the reservation.

## Completion
`completeReservation` takes the same user-row lock, excludes the current reservation from other-pending, and:
- rejects + deletes the reservation if `used + otherReserved + actualSize > limit`;
- otherwise updates the row to `complete` with the verified R2 size.

Duplicate completion: the API first checks for an existing `complete` row and returns it; otherwise a missing pending row returns `RESERVATION_NOT_FOUND` (409) and deletes the orphan object.

## Deletion / replacement
- Deleting a completed row reduces the aggregate immediately (no separate counter).
- Replacement currently uploads a new file; the old file remains charged until deleted. This is accurate (both occupy R2). The UI remove action deletes the reference; the R2 delete route removes the object and row, releasing quota exactly once.
- Duplicate deletes are no-ops (row already gone).

## Cleanup
Pending rows older than 1 hour are purged by `/api/cron/cleanup`; abandoned uploads release quota. Multipart abort also releases immediately.

## Reconciliation
`reconcileUserStorage(userId, r2Sizes)` compares DB sum vs supplied R2 metadata and lists missing objects on either side. Intended for admin scripts; not run automatically, no bucket scan on upload.

## Known limitations
- Reservations are released only by completion, abort, or the hourly cron; an abandoned single-part upload holds quota up to 1h.
- No separate counter table; aggregate queries use the existing `media_files` indexes (user_id).