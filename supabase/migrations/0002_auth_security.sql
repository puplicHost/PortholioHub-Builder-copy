-- Sprint A — auth security columns + rate-limit buckets.
-- Run: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe: only ADD COLUMN / backfill / CREATE TABLE. No DROP/DELETE.
-- Pre-check (run first): SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
--   → must return 1 row (Supabase includes pgcrypto by default).

-- 1) Contact phone (nullable: pre-existing rows have none; required for new
--    registrations at the app layer). E.164, unique.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT UNIQUE;

-- 2) Account status + forced password change.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- 3) Session metadata (nullable; filled for new sessions).
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "remember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMP(3);
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_agent" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ip" TEXT;

-- 4) Migrate stored session tokens to SHA-256 hex IN PLACE.
--    Column name stays "token"; only the format changes (64-char hex either
--    way). All existing sessions stay valid because the app hashes the cookie
--    value with the same function before lookup.
--    pgcrypto digest() output matches Node crypto.createHash('sha256').digest('hex').
UPDATE "sessions" SET "token" = encode(digest("token", 'sha256'), 'hex')
WHERE length("token") != 64 OR "token" ~ '[^0-9a-f]';

-- 5) Rate-limit buckets (fixed-window, atomic increments from the app).
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
