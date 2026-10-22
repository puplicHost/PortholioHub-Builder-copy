-- Separate "content page" from "home-page card" on the same row.
-- Existing rows default to true so current portfolios render unchanged.
ALTER TABLE "project_pages" ADD COLUMN "show_in_projects" BOOLEAN NOT NULL DEFAULT true;
