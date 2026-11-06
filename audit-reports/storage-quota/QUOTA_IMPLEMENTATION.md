# Quota Implementation

## Rules implemented
- Paid (ACTIVE/GRACE): **500 MiB = 524,288,000 bytes** aggregate R2 quota.
- Free: existing product limit (`getEffectiveLimits().maxStorageMB`, default 100 MB) to avoid breaking existing Free uploads; documented in code.
- 50 MB per-video limit unchanged (enforced before reservation).
- Cloudinary images, external URLs excluded (only `storageProvider='r2'` rows counted).
- Only `uploadStatus='complete'` counts as used; `pending` rows are reservations.

## Files changed
- `src/lib/storage-quota.ts` — `getStorageUsage`, `reserveStorage`, `completeReservation`, `releaseReservation`, `purgeExpiredReservations`, `reconcileUserStorage`.
- `presign/route.ts` — reserves before presigning; releases on presign failure; returns 413 with quota details.
- `complete/route.ts` — verifies actual R2 size, completes the reservation atomically, rejects/releases on overflow, idempotent.
- `multipart/initiate` — reserves the declared max size; releases on upload-init failure.
- `multipart/complete` — completes/rejects reservation after final size verification.
- `multipart/abort` — releases reservation.
- `cron/cleanup` — purges expired reservations (1h TTL).
- `api/me/storage` — authenticated usage endpoint (limit/used/reserved/remaining/percent/uploadsAllowed).
- `StorageUsage.tsx` — progress bar + used/remaining/limit message; added to FilesEditor and ProjectManager card editor; refreshes after upload/remove.
- `routes.manifest.ts` — declares `/api/me/storage`.

## No migration required
Reservations reuse `MediaFile.uploadStatus` (`pending` → `complete`). Existing columns/indexes are sufficient. No production schema change.