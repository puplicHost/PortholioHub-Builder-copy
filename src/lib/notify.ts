import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// DB-first notification service (plan Phase 2 §12, A1).
// Writes one row per recipient; FCM push is intentionally deferred
// (no Firebase infra) — the DB is the source of truth for bell + pages.
export interface NotifyInput {
  toUserIds?: string[]
  toAdmins?: boolean
  type: string
  title: { en: string; ar: string }
  body: { en: string; ar: string }
  link?: string
  dedupeKey?: string
}

export async function notify(input: NotifyInput): Promise<{ created: number }> {
  let ids = [...(input.toUserIds || [])]
  if (input.toAdmins) {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true, status: 'ACTIVE' },
      select: { id: true },
    })
    ids = [...ids, ...admins.map((a) => a.id)]
  }
  const unique = [...new Set(ids)]
  if (unique.length === 0) return { created: 0 }

  let created = 0
  for (const userId of unique) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: input.type,
          title: input.title as Prisma.InputJsonValue,
          body: input.body as Prisma.InputJsonValue,
          link: input.link,
          dedupeKey: input.dedupeKey,
        },
      })
      created++
    } catch (err: unknown) {
      // Duplicate dedupeKey → already notified, skip silently.
      if ((err as { code?: string })?.code !== 'P2002') throw err
    }
  }
  return { created }
}
