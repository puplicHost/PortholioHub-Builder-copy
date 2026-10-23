'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/guards'
import {
  DEFAULT_BUILDER_LOCALE,
  isBuilderLocale,
  type BuilderLocale,
} from '@/app/profile/builder/i18n/dictionaries'

/**
 * Best-effort cross-device sync of the builder UI language. Cookie/localStorage
 * remain the primary store; the caller never awaits this, so a failure (or a
 * database that has not received the migration yet) degrades silently.
 */
export async function setBuilderLocale(locale: BuilderLocale): Promise<void> {
  if (!isBuilderLocale(locale)) return
  const user = await requireUser()
  try {
    await prisma.$executeRaw`
      UPDATE "user_profiles"
      SET "preferred_builder_locale" = ${locale}
      WHERE "user_id" = ${user.id}
    `
  } catch {
    // Column not migrated yet, or transient DB error — cookie still wins.
  }
}

/**
 * Resolve the builder locale server-side: cookie first (instant), then the
 * persisted per-user preference, then the default (English).
 */
export async function resolveBuilderLocale(
  cookieValue?: string,
): Promise<{ locale: BuilderLocale; stored: boolean }> {
  if (isBuilderLocale(cookieValue)) return { locale: cookieValue, stored: true }

  try {
    const user = await requireUser()
    const rows = await prisma.$queryRaw<Array<{ preferred_builder_locale: string | null }>>`
      SELECT "preferred_builder_locale"
      FROM "user_profiles"
      WHERE "user_id" = ${user.id}
      LIMIT 1
    `
    const value = rows[0]?.preferred_builder_locale
    if (isBuilderLocale(value)) return { locale: value, stored: true }
  } catch {
    // No migration yet / DB hiccup — fall through to the default.
  }

  return { locale: DEFAULT_BUILDER_LOCALE, stored: false }
}
