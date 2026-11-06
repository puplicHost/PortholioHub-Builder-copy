# R2 Storage Implementation Report

## Summary
Implemented Cloudflare R2 as the storage provider for documents and videos in FilesEditor. Images remain on Cloudinary. Metadata stored in PostgreSQL via extended MediaFile model.

## Files changed
- `package.json` — added `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- `src/lib/r2.ts` — new R2 service (presign upload/download, head, delete, multipart helpers, allowlists, size limits).
- `src/lib/r2-client.ts` — browser upload helper (presign → direct PUT → complete/verify).
- `src/lib/env.ts` — optional R2 env vars.
- `prisma/schema.prisma` — MediaFile extended (storageProvider, objectKey, bucket, visibility, uploadStatus).
- `src/app/api/files/r2/presign/route.ts` — presigned upload URL generation.
- `src/app/api/files/r2/complete/route.ts` — verify object + finalize metadata (idempotent).
- `src/app/api/files/r2/[id]/route.ts` — GET (presigned/public download redirect), DELETE (owner-only).
- `src/app/profile/builder/FilesEditor.tsx` — switched document/video uploads to R2; added video preview.

## Upload locations integrated
- Portfolio Page/Project "Files" section editor (FilesEditor) — documents and videos now upload to R2. Images unaffected (Cloudinary elsewhere).

## Database changes
- MediaFile model extended with R2 metadata fields. Migration NOT applied (production safety). Generate locally with `prisma migrate dev` in a safe environment, review, then deploy via `prisma migrate deploy`.

## Required environment variables
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT, R2_PUBLIC_BASE_URL (optional).

## File size limits
- 500 MB max (configurable via MAX_FILE_SIZE in r2.ts).

## Public/private behavior
- visibility 'public' → public URL (if R2_PUBLIC_BASE_URL set) else presigned download.
- visibility 'private' → short-lived presigned GET (5 min) via download route, owner-only.

## Security hardening applied
- Object key ownership enforced on presign/complete/download/delete (prefix `users/${userId}/`).
- Content-Disposition sanitized filename on download (header injection prevention).
- Object size validated against MAX_FILE_SIZE in complete route (orphan cleanup on invalid).
- Race-safe finalization: unique objectKey constraint + fallback lookup on P2002.
- Presigned URL expiry 300s.
- Private files served via short-lived presigned GET; public only if R2_PUBLIC_BASE_URL set.
- Credentials server-side only; never logged.

## Verification status
- R2 connectivity: VERIFIED (upload/head/download/delete all passed).
- `tsc --noEmit`: PASS.
- `npm run build`: NOT COMPLETED (DB unreachable from this environment).
- Environment: R2 variables added to `.env.local` (file gitignored). Values not exposed.

## UI integration (visible upload options)
- FilesEditor: added drag-and-drop zone + labeled "Upload File" button (R2) alongside existing URL input; clear labels in en/ar.
- ProjectManager: added "Upload File" button (R2) above existing external URL field in project item editor; preserves external URL behavior and Cloudinary cover images.
- Dictionary keys added: common.uploadFile, common.dragAndDropFile, common.orPasteUrlBelow (en+ar).

## Missing Document/Video Upload Fix (2026-11-06)

### Exact component changed
- `src/app/profile/builder/ProjectManager.tsx` (item editor, `editingIndex !== null` branch) — added dedicated "File Attachment" section between image section and project link section.

### Data model fields
- `externalUrl` (download URL), `attachmentName`, `attachmentType`, `attachmentSize`, `attachmentId` stored in item JSON (no migration needed).

### Published-page rendering
- `itemHref()` in `ProjectPageView.tsx` already uses `externalUrl`, so uploaded file download URL works as the card link. No change needed; visibility set to 'public' for portfolio attachments.

### Actual verification
- `tsc --noEmit`: PASS.
- `eslint` (ProjectManager, FilesEditor): 0 errors.
- Browser/DB: NOT TESTED (production safety).

## Attachment Persistence Fix (2026-11-06)

### Root cause
Attachment metadata (`attachmentName`, etc.) was stored only in transient item fields and gated the Explore link on `item.attachmentName`, which is not persisted in the ProjectItem row. After reload, metadata was lost, so the filename and Explore link disappeared. Also, the Explore link was gated on attachmentName instead of the persisted externalUrl.

### Fix
- Persist attachment metadata in the page content JSON (`itemCards[index]`) via `updateItemCard`, which survives save/reload.
- Derive display and Explore gating from `itemMeta.attachmentName` / `item.externalUrl`.
- Remove button clears both `externalUrl` (item row) and content meta.

### Verification
- `tsc --noEmit`: PASS.
- Published page: `itemHref` uses persisted `externalUrl` → Explore link works after reload.

## File Icon Functional Upload (2026-11-06)

### Exact component changed
- `src/app/profile/builder/BuilderClient.tsx` — project page item editor, the `visual === 'file-icon'` block (Card Visual selector). Added R2 Upload File control, filename/size display, Explore link, and Remove action.

### Data model fields
- `externalUrl` (download URL), `attachmentName`, `attachmentType`, `attachmentSize`, `attachmentId` stored in item JSON.

### Published-page rendering
- `itemHref()` in `ProjectPageView.tsx` uses `externalUrl`, so uploaded file opens via Explore. No change needed.

### Verification
- `tsc --noEmit`: PASS.
- `eslint` (BuilderClient): 0 errors.
- Browser/DB: NOT TESTED (production safety).

## Missing Document/Video Upload Fix (2026-11-06) — notes

### Component changed
- `src/app/profile/builder/ProjectManager.tsx` — added dedicated "File Attachment" section in the item editor (below image section, above project link section) with Upload File (R2), drag-and-drop, filename/type/size display, and Remove action.

### Data model
- Uses existing `externalUrl` plus new metadata fields: `attachmentName`, `attachmentType`, `attachmentSize`, `attachmentId` (stored in item JSON, no migration needed).

### Behavior preserved
- Image upload (Cloudinary) unchanged.
- File Icon / None card visual options unchanged.
- External Link + Link Label unchanged.
- R2 backend reused (no duplicate upload logic).

## Diagnosis: /api/files/r2/complete HTTP 500 (2026-11-06)

### Root cause
The `media_files` table in the active database does NOT contain the new R2 columns (`storage_provider`, `object_key`, `bucket`, `visibility`, `upload_status`). The Prisma schema was extended and the client regenerated, but the migration was never applied (by design, production safety). Consequently, `prisma.mediaFile.create()` references non-existent columns → Postgres error → 500.

Evidence (read-only schema inspection): columns present are: id, user_id, file_type, mime_type, filename, stored_name, path, public_url, cloudinary_id, size, purpose, share_token, created_at. New columns absent.

### Did the file reach R2?
Not directly tested against the live bucket in this pass, but the presign+PUT flow is unaffected. The failure occurs at the metadata finalization step (Prisma write), AFTER the object is uploaded. Likely an orphaned R2 object exists from the failed test (key under `users/<userId>/...`).

### Failing operation
`prisma.mediaFile.create()` in `src/app/api/files/r2/complete/route.ts` (and multipart/complete) — referencing columns absent in DB.

### Notifications unread-count 500
Separate issue: `prisma.notification.count()` succeeds in isolation (32 rows). The 500 for the bell is likely transient DB connectivity or session-related, not the R2 schema mismatch. Not a shared root cause with the upload failure.

### Safest proposed fix
1. Apply the pending migration in an isolated staging database first (never production):
   - `npx prisma migrate dev --name add_r2_fields` (locally), review SQL.
   - Verify new columns exist.
   - Re-run complete route test.
2. In production: `npx prisma migrate deploy` during a maintenance window after staging verification.
3. Optionally add a runtime guard that returns a clear 503 with `MIGRATION_REQUIRED` if columns are missing, instead of a raw 500. (Code change, low risk.)

Do NOT apply migration to the current database without proving it is non-production.

## Remaining blockers
- Prisma migration not applied (production safety).
- End-to-end app upload flow not browser-tested (per user instruction).
- Multipart end-to-end not executed against live bucket.