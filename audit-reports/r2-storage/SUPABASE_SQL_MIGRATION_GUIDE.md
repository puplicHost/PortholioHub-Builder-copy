# Supabase SQL Migration Guide — MediaFile R2 Storage

## 1. Why this migration is needed
The Prisma `MediaFile` model was extended with R2 storage fields (`storage_provider`, `object_key`, `bucket`, `visibility`, `upload_status`), but the Supabase `media_files` table was never synchronized. The R2 upload finalization endpoint fails with Prisma P2022 because it references columns that do not exist.

## 2. What each SQL statement changes
- Adds 5 columns to `public.media_files` with safe defaults:
  - `storage_provider TEXT NOT NULL DEFAULT 'cloudinary'` — existing rows become 'cloudinary'.
  - `object_key TEXT` (nullable) — R2 object key.
  - `bucket TEXT` (nullable) — R2 bucket name.
  - `visibility TEXT NOT NULL DEFAULT 'private'`.
  - `upload_status TEXT NOT NULL DEFAULT 'complete'` — existing rows marked complete.
- Creates a unique index `media_files_object_key_key` on `object_key` (multiple NULLs allowed in Postgres).

## 3. Idempotency
All `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `CREATE UNIQUE INDEX IF NOT EXISTS` are safe to run more than once.

## 4. Manual checks before execution
- Run the Section 0 diagnostic queries first.
- Confirm no duplicate `object_key` values (query 0.3).
- Confirm the table is `public.media_files`.
- Confirm you are in the correct Supabase project (staging first).

## 5. How to execute via Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor.
2. Paste the contents of `supabase-r2-mediafile-migration.sql`.
3. Run Section 0 diagnostics first (read-only).
4. If diagnostics look correct, run Section 1.
5. Run Section 2 verification queries.

## 6. How to verify success
- Section 2.1 shows all 5 columns with correct types/defaults.
- Section 2.2 shows the unique index.
- Section 2.3 shows the same record count as before.

## 7. What to do if a query fails
- Read the Postgres error message.
- Common causes: permission denied (use service role), duplicate index name, conflicting NULLs.
- Do not retry blindly; inspect and resolve the specific conflict.
- Never drop columns or truncate data.

## 8. Rollback considerations
- Columns can be dropped with `ALTER TABLE ... DROP COLUMN IF EXISTS` if needed, but this loses R2 metadata.
- The unique index can be dropped with `DROP INDEX IF EXISTS media_files_object_key_key`.
- Prefer fixing forward over rolling back.
- No data is deleted by this migration.

## Safety
- No SQL was executed by the agent. This file is for manual review and execution.
- Never claim the migration was applied without verification.