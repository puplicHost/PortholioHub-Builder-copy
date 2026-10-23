-- Persist the builder UI language per user so it survives devices/browsers.
-- NULL means "no explicit choice"; the app then falls back to English.
ALTER TABLE "user_profiles" ADD COLUMN "preferred_builder_locale" TEXT;
