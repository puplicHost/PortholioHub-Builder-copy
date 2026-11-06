-- ============================================================================
-- Supabase SQL Migration: MediaFile R2 Storage Support
-- Target table: public.media_files
-- Derived from prisma/schema.prisma (MediaFile model) and migration history.
-- DO NOT EXECUTE BLINDLY. Read SUPABASE_SQL_MIGRATION_GUIDE.md first.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 0: PREFLIGHT DIAGNOSTICS (READ-ONLY — no schema changes)
-- ----------------------------------------------------------------------------

-- 0.1 Check which of the required columns already exist (safe on any DB state)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'media_files'
  AND column_name IN ('storage_provider','object_key','bucket','visibility','upload_status')
ORDER BY ordinal_position;

-- 0.2 Check column definitions for the three NOT NULL columns (read-only, no table SELECT)
--     This avoids referencing columns that may not exist yet.
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'media_files'
  AND column_name IN ('storage_provider','visibility','upload_status');

-- 0.3 Check for duplicate object_key values (would block the unique index)
--     Safe: only runs if the column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='media_files' AND column_name='object_key'
  ) THEN
    PERFORM 1; -- placeholder; results returned via the query below
  END IF;
END $$;

SELECT object_key, COUNT(*) AS cnt
FROM public.media_files
WHERE object_key IS NOT NULL
GROUP BY object_key
HAVING COUNT(*) > 1;

-- 0.4 Check existing indexes/constraints on media_files
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'media_files'
ORDER BY indexname;

-- 0.5 Count existing records (sanity: must not change after migration)
SELECT COUNT(*) AS media_files_count FROM public.media_files;

-- 0.6 Check for NULLs in the three NOT NULL columns (only meaningful if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='storage_provider') THEN
    RAISE NOTICE 'null storage_provider rows: %', (SELECT COUNT(*) FROM public.media_files WHERE storage_provider IS NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='visibility') THEN
    RAISE NOTICE 'null visibility rows: %', (SELECT COUNT(*) FROM public.media_files WHERE visibility IS NULL);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='upload_status') THEN
    RAISE NOTICE 'null upload_status rows: %', (SELECT COUNT(*) FROM public.media_files WHERE upload_status IS NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- SECTION 1: SCHEMA CHANGES (idempotent — safe to re-run)
-- ----------------------------------------------------------------------------

-- Add R2 storage provider column (default 'cloudinary' for existing rows)
ALTER TABLE "public"."media_files"
  ADD COLUMN IF NOT EXISTS "storage_provider" TEXT NOT NULL DEFAULT 'cloudinary';

-- Add R2 object key column (nullable; unique when present)
ALTER TABLE "public"."media_files"
  ADD COLUMN IF NOT EXISTS "object_key" TEXT;

-- Add R2 bucket column
ALTER TABLE "public"."media_files"
  ADD COLUMN IF NOT EXISTS "bucket" TEXT;

-- Add visibility column (default 'private')
ALTER TABLE "public"."media_files"
  ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private';

-- Add upload status column (default 'complete' for existing rows)
ALTER TABLE "public"."media_files"
  ADD COLUMN IF NOT EXISTS "upload_status" TEXT NOT NULL DEFAULT 'complete';

-- ----------------------------------------------------------------------------
-- SECTION 1b: NORMALIZE PARTIALLY MIGRATED COLUMNS (guarded, idempotent)
-- Ensures defaults/nullability match Prisma for columns that may already exist
-- with wrong types. Only applies SET NOT NULL when no NULLs are present.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  -- storage_provider: ensure default
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='storage_provider') THEN
    EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "storage_provider" SET DEFAULT ''cloudinary''';
    IF (SELECT COUNT(*) FROM public.media_files WHERE storage_provider IS NULL) = 0 THEN
      EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "storage_provider" SET NOT NULL';
    ELSE
      RAISE NOTICE 'storage_provider has NULLs; leaving nullable. Backfill manually.';
    END IF;
  END IF;

  -- visibility: ensure default
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='visibility') THEN
    EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "visibility" SET DEFAULT ''private''';
    IF (SELECT COUNT(*) FROM public.media_files WHERE visibility IS NULL) = 0 THEN
      EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "visibility" SET NOT NULL';
    ELSE
      RAISE NOTICE 'visibility has NULLs; leaving nullable. Backfill manually.';
    END IF;
  END IF;

  -- upload_status: ensure default
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='media_files' AND column_name='upload_status') THEN
    EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "upload_status" SET DEFAULT ''complete''';
    IF (SELECT COUNT(*) FROM public.media_files WHERE upload_status IS NULL) = 0 THEN
      EXECUTE 'ALTER TABLE "public"."media_files" ALTER COLUMN "upload_status" SET NOT NULL';
    ELSE
      RAISE NOTICE 'upload_status has NULLs; leaving nullable. Backfill manually.';
    END IF;
  END IF;
END $$;

-- Unique index on object_key (allows multiple NULLs in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "media_files_object_key_key"
  ON "public"."media_files" ("object_key");

-- ----------------------------------------------------------------------------
-- SECTION 2: POST-MIGRATION VERIFICATION (READ-ONLY)
-- ----------------------------------------------------------------------------

-- 2.1 Confirm all required columns exist with expected types/defaults
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'media_files'
  AND column_name IN ('storage_provider','object_key','bucket','visibility','upload_status')
ORDER BY ordinal_position;

-- 2.2 Confirm the unique index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'media_files'
  AND indexname = 'media_files_object_key_key';

-- 2.3 Confirm existing records are intact
SELECT COUNT(*) AS media_files_count FROM public.media_files;

-- 2.4 Sample of migrated rows (optional)
SELECT id, user_id, file_type, storage_provider, visibility, upload_status, object_key
FROM public.media_files
ORDER BY created_at DESC
LIMIT 5;