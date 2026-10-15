-- Sprint C — subscription billing tables + plan/subscription columns.
-- Run: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe: only CREATE TABLE / ADD COLUMN (nullable or defaulted) + one
-- partial unique index. No DROP/DELETE/ALTER of existing data.
--
-- CHECK QUERIES (run before AND after):
--   SELECT count(*) FROM subscription_requests;      -- fails before, 0 after
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name IN ('plans','subscriptions','payments')
--       AND column_name IN ('duration_days','limits','name_i18n',
--         'plan_snapshot','request_id','created_by','confirmed_by','confirmed_at');

-- 1) Client subscription requests (PENDING → APPROVED/REJECTED/CANCELED).
CREATE TABLE IF NOT EXISTS "subscription_requests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "handled_by" TEXT,
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_requests_code_key" ON "subscription_requests"("code");
CREATE INDEX IF NOT EXISTS "subscription_requests_status_created_at_idx" ON "subscription_requests"("status", "created_at");
-- One PENDING request per user at a time (plan Phase 3 §19).
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_requests_pending_user_idx"
  ON "subscription_requests"("user_id") WHERE "status" = 'PENDING';

-- 2) Plan billing fields (legacy columns kept; NULL = free-plan defaults
--    from code via getEffectiveLimits).
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "duration_days" INTEGER;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "limits" JSONB;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "name_i18n" JSONB;

-- 3) Subscription snapshots + request linkage.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "plan_snapshot" JSONB;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "request_id" TEXT UNIQUE;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "created_by" TEXT;

-- 4) Manual-payment confirmation.
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "confirmed_by" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3);

-- 5) Notifications for the lifecycle (Sprint E only adds device fields).
--    Table is empty (no notification is ever written before this sprint),
--    so the TEXT → JSONB conversion is trivially safe.
ALTER TABLE "notifications" ALTER COLUMN "title" TYPE JSONB USING to_jsonb("title");
ALTER TABLE "notifications" ALTER COLUMN "body" TYPE JSONB USING to_jsonb("body");
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "dedupe_key" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_dedupe_idx"
  ON "notifications"("user_id", "dedupe_key") WHERE "dedupe_key" IS NOT NULL;
