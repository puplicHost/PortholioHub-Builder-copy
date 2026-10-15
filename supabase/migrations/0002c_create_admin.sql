-- Create (or promote) an admin account with a temporary password.
--
-- HOW TO USE:
--   1. Replace ADMIN_EMAIL_HERE and TEMP_PASSWORD_HERE below (use a
--      throwaway password — you will change it on first login).
--   2. Run in Supabase Dashboard → SQL Editor.
--   3. Log in at /login with that email + temporary password.
--   4. You will be forced to /change-password immediately — set the real one.
--   5. Afterwards, REVERT this file (do NOT commit it with real values).
--
-- Notes:
--   - Requires the pgcrypto extension (same as 0002_auth_security.sql).
--   - crypt(..., gen_salt('bf', 12)) produces $2a$ bcrypt hashes that the
--     app's bcryptjs verifies like any other password hash.
--   - If the email already exists, its password is NOT touched; the account
--     is only promoted (is_admin) and forced to change password.
--   - This file is never executed by automation.

INSERT INTO "users"
  ("id", "email", "password_hash", "display_name", "phone",
   "is_admin", "email_verified", "status", "must_change_password",
   "created_at", "updated_at", "metadata")
VALUES (
  gen_random_uuid()::text,
  'dodahassan@gmail.com',
  crypt('123456789', gen_salt('bf', 12)),
  'Admin',
  NULL,
  true,
  true,
  'ACTIVE',
  true,
  now(), now(), '{}'
)
ON CONFLICT ("email") DO UPDATE SET
  "is_admin" = true,
  "must_change_password" = true,
  "updated_at" = now();

INSERT INTO "profiles" ("user_id", "display_name", "avatar_url", "is_admin", "bio", "phone", "created_at", "updated_at")
SELECT "id", 'Admin', NULL, true, NULL, NULL, now(), now()
FROM "users" WHERE "email" = 'dodahassan@gmail.com'
ON CONFLICT ("user_id") DO UPDATE SET
  "is_admin" = true,
  "updated_at" = now();

-- Verify (expect 1 row, is_admin true, must_change_password true):
-- SELECT "email", "is_admin", "must_change_password", "status"
-- FROM "users" WHERE "email" = 'dodahassan@gmail.com';
