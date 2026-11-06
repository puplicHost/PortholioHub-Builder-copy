# R2 Migration Readiness

## Current database state (read-only inspection)
The `media_files` table now contains the R2 columns:
- `storage_provider` (NOT NULL)
- `object_key` (nullable)
- `bucket` (nullable)
- `visibility` (NOT NULL)
- `upload_status` (NOT NULL)

Indexes: `media_files_object_key_key` (unique), `media_files_pkey`, `media_files_share_token_key`, `media_files_user_id_idx`.

## Migration status
The previously prepared `audit-reports/r2-storage/supabase-r2-mediafile-migration.sql` has been applied (columns and unique index are present). No further migration is required for the current Prisma MediaFile model.

## Compatibility
- Existing Cloudinary records default to `storage_provider='cloudinary'`, `visibility='private'`, `upload_status='complete'`.
- R2 records set `storage_provider='r2'` and store `object_key`/`bucket`.
- No data was deleted or rewritten.

## Remaining risks
- Verify defaults on existing rows if the migration was partially applied (preflight queries in the SQL file).
- Confirm `R2_PUBLIC_BASE_URL` is set if public direct URLs are desired; otherwise public downloads use fresh presigned GET.
- No production migration was executed by this agent.