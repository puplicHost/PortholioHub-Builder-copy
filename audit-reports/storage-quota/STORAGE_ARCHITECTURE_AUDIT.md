# Storage Architecture Audit

## Existing flow (before phase 3)
- `POST /api/files/r2/presign` validates MIME/size and generates a presigned PUT; no quota check.
- `POST /api/files/r2/complete` verifies `HeadObject` ContentLength and creates a `MediaFile` row.
- Multipart: initiate → presigned parts → complete (HeadObject → create) / abort.
- `GET/DELETE /api/files/r2/[id]` handle authorized download/delete; `/[id]/content` streams Range.
- `MediaFile` already stores `userId`, `storageProvider`, `objectKey` (unique), `size`, `visibility`, `uploadStatus`, `purpose`.
- No aggregate quota existed; no reservation concept.

## Design chosen
Reuse `MediaFile` as both the file record and the quota reservation:
- At presign/initiate, create a row with `uploadStatus='pending'` and `size=requestedBytes`. This is the reservation.
- At completion, verify actual R2 size, then atomically convert the pending row to `complete` with the real size (or release it).
- Expired pending rows are purged by the existing daily cron.
- Used = sum(size) of `complete` R2 rows; reserved = sum(size) of non-expired `pending` rows.
- No schema migration required (all columns already exist; `object_key` unique index already present).

## Key files
- `src/lib/storage-quota.ts` (new)
- `src/app/api/files/r2/presign/route.ts`, `complete/route.ts`, `multipart/*`
- `src/app/api/me/storage/route.ts` (new)
- `src/app/profile/builder/ui/StorageUsage.tsx` (new), `FilesEditor.tsx`, `ProjectManager.tsx`
- `src/app/api/cron/cleanup/route.ts`, `src/routes.manifest.ts`