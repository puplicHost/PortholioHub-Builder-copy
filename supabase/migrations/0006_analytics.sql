-- Sprint G — cumulative visit analytics (plan Phase 11 + 04 Round 2).
-- Run: Supabase Dashboard → SQL Editor → paste → Run.
-- Safe: only CREATE TABLE + indexes. No DROP/DELETE/ALTER of existing data.
-- Existing portfolio_view_events rows are untouched (dashboard keeps
-- reading them; DailyVisit accumulates from deploy forward).
--
-- CHECK QUERIES (run before AND after):
--   SELECT to_regclass('public.daily_visits'), to_regclass('public.visit_dedups');
-- Before: both NULL. After: both table names.

CREATE TABLE IF NOT EXISTS "daily_visits" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "project_slug" TEXT,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_visits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_visits_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "daily_visits_portfolio_project_day_key"
  ON "daily_visits"("portfolio_id", "project_slug", "day");
CREATE INDEX IF NOT EXISTS "daily_visits_portfolio_day_idx"
  ON "daily_visits"("portfolio_id", "day");

CREATE TABLE IF NOT EXISTS "visit_dedups" (
    "key" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "visit_dedups_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "visit_dedups_day_idx" ON "visit_dedups"("day");
