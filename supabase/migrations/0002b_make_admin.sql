-- Promote one account to admin (for the upcoming admin panel, Sprint D).
-- HOW TO USE: replace ADMIN_EMAIL_HERE with your login email, then run in
--   Supabase Dashboard → SQL Editor. Run once. This file is never executed
--   by any automated process.
-- Pre-requirement: supabase/migrations/0002_auth_security.sql must be applied
--   (it does not touch these flags, but keeps ordering sane).

UPDATE "users" SET "is_admin" = true WHERE "email" = 'ADMIN_EMAIL_HERE';

UPDATE "profiles" SET "is_admin" = true
WHERE "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'ADMIN_EMAIL_HERE');

-- Verify (expect 1 row, both true):
-- SELECT u."email", u."is_admin" AS user_admin, p."is_admin" AS profile_admin
-- FROM "users" u LEFT JOIN "profiles" p ON p."user_id" = u."id"
-- WHERE u."email" = 'ADMIN_EMAIL_HERE';
