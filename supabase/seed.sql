-- PortfolioHub seed: one verified test user + portfolio with a home page.
-- Test login: tester@portfoliohub.test / Test1234!
-- Run: Supabase Dashboard → SQL Editor → New query → paste this file → Run.
-- All ids are explicit so the script is idempotent (re-running replaces the rows).

BEGIN;

-- users (authUser). updated_at has no DB default, so set it explicitly.
INSERT INTO "users" ("id", "email", "password_hash", "display_name", "avatar_url", "is_admin", "email_verified", "last_login_at", "created_at", "updated_at", "metadata")
VALUES ('seed-user-0001', 'tester@portfoliohub.test', '$2a$12$Bm.WwG14QTwiuheJAsPIvu7J1QRUV67P3dRg6fDb9hzjppBbN.lxm', 'Test User', NULL, false, true, NULL, now(), now(), '{}')
ON CONFLICT ("id") DO UPDATE SET
  "email" = EXCLUDED."email",
  "password_hash" = EXCLUDED."password_hash",
  "display_name" = EXCLUDED."display_name",
  "email_verified" = true,
  "updated_at" = now();

-- profiles (1:1 companion row, created by createUser in app code)
INSERT INTO "profiles" ("user_id", "display_name", "avatar_url", "is_admin", "bio", "phone", "created_at", "updated_at")
VALUES ('seed-user-0001', 'Test User', NULL, false, 'Seeded test profile', NULL, now(), now())
ON CONFLICT ("user_id") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "updated_at" = now();

-- user_profiles (public portfolio). username must be unique.
INSERT INTO "user_profiles" ("id", "user_id", "username", "display_name", "bio", "avatar_url", "professional_title", "location", "skills", "experience", "education", "projects", "contact_links", "appearance", "localized", "created_at", "updated_at")
VALUES (
  'seed-profile-0001',
  'seed-user-0001',
  'testuser',
  'Test User',
  'Seeded portfolio for connection testing.',
  NULL,
  'Full-Stack Developer',
  'Cairo, Egypt',
  ARRAY['TypeScript', 'Next.js', 'Supabase'],
  '[]',
  '[]',
  '[]',
  '[{"label": "GitHub", "url": "https://github.com/testuser"}]',
  '{"colorMode": "light", "theme": "classic-dark", "font": "inter", "primaryColor": "#0066cc", "defaultLanguage": "en"}',
  '{"displayName": {"en": "Test User", "ar": "مستخدم تجريبي"}, "bio": {"en": "Seeded portfolio for connection testing.", "ar": ""}, "professionalTitle": {"en": "Full-Stack Developer", "ar": ""}}',
  now(),
  now()
)
ON CONFLICT ("id") DO UPDATE SET
  "username" = EXCLUDED."username",
  "display_name" = EXCLUDED."display_name",
  "updated_at" = now();

-- profile_pages (home). The public page requires slug 'home' + is_published = true.
INSERT INTO "profile_pages" ("id", "profile_id", "title", "slug", "page_order", "is_published", "created_at", "updated_at")
VALUES ('seed-page-home-0001', 'seed-profile-0001', 'Home', 'home', 0, true, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "is_published" = true,
  "updated_at" = now();

-- page_sections (hero / about / skills). settings.isVisible controls visibility.
INSERT INTO "page_sections" ("id", "page_id", "section_type", "section_order", "content", "settings", "created_at", "updated_at")
VALUES
  ('seed-section-hero-0001', 'seed-page-home-0001', 'hero', 1,
   '{"title": {"en": "Test User", "ar": "مستخدم تجريبي"}, "subtitle": {"en": "Full-Stack Developer in Cairo", "ar": "مطور في القاهرة"}}',
   '{"isVisible": true}', now(), now()),
  ('seed-section-about-0001', 'seed-page-home-0001', 'about', 2,
   '{"title": {"en": "About Me", "ar": "نبذة عني"}, "text": {"en": "Seeded about text for connection testing.", "ar": "نص تجريبي لاختبار الاتصال."}}',
   '{"isVisible": true}', now(), now()),
  ('seed-section-skills-0001', 'seed-page-home-0001', 'skills', 3,
   '{"title": {"en": "Skills", "ar": "المهارات"}, "skills": ["TypeScript", "Next.js", "Supabase"]}',
   '{"isVisible": true}', now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "settings" = EXCLUDED."settings",
  "section_order" = EXCLUDED."section_order",
  "updated_at" = now();

-- workspaces (the builder gate requirePortfolioAdmin needs an owned workspace)
INSERT INTO "workspaces" ("id", "name", "owner_id", "logo_url", "description", "theme_color", "settings", "created_at", "updated_at", "deleted_at", "suspended_at", "archived_at")
VALUES ('seed-workspace-0001', 'Test Workspace', 'seed-user-0001', NULL, 'Seeded workspace for builder access', NULL, '{}', now(), now(), NULL, NULL, NULL)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
