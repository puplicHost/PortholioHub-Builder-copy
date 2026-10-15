-- Sprint B — portfolio status / visibility / optimistic concurrency.
-- Run: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe: only ADD COLUMN (with defaults) + backfill UPDATE. No DROP/DELETE.
--
-- CHECK QUERY (run before AND after; send both outputs):
--   SELECT status, count(*) FROM user_profiles GROUP BY status ORDER BY 1;
-- Before: single row (no status column → query fails; that itself confirms
--   the migration is not applied yet).
-- After: every row that has a published home page must be PUBLISHED
--   (currently visible portfolios stay visible); the rest stay DRAFT.

ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "admin_hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "admin_hidden_reason" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- Backfill: preserve current visibility — any profile with a published
-- home page becomes PUBLISHED, everything else stays DRAFT.
UPDATE "user_profiles" p SET "status" = 'PUBLISHED'
WHERE EXISTS (
  SELECT 1 FROM "profile_pages" pg
  WHERE pg."profile_id" = p."id"
    AND pg."slug" = 'home'
    AND pg."is_published" = true
);
