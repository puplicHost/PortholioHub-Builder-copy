import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getSetting } from '@/lib/settings'

// Daily subscription lifecycle (plan Phase 3 §30): idempotent via
// Notification dedupeKey, recovers skipped days by range check.
// Emits: expiring reminders (7/3d, from reminderDays), grace_started and
// expired to user + every admin.
export async function runLifecycle(now = new Date()): Promise<{ notified: number }> {
  const day = 24 * 60 * 60 * 1000
  let notified = 0

  const reminderDaysRaw = await getSetting('subscription.reminderDays').catch(() => [7, 3])
  const reminderDays: number[] = Array.isArray(reminderDaysRaw)
    ? reminderDaysRaw.filter((d) => typeof d === 'number')
    : [7, 3]

  const admins = await prisma.user.findMany({
    where: { isAdmin: true, status: 'ACTIVE' },
    select: { id: true },
  })
  const adminIds = admins.map((a) => a.id)

  const subs = await prisma.subscription.findMany({
    where: { canceledAt: null },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      gracePeriodEndsAt: true,
      user: { select: { displayName: true, email: true } },
    },
  })

  const dayKey = (d: Date) => d.toISOString().slice(0, 10)

  for (const sub of subs) {
    if (!sub.expiresAt) continue
    const endsAt = new Date(sub.expiresAt).getTime()
    const graceEnds = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).getTime() : endsAt
    const t = now.getTime()

    const jobs: Array<{ type: string; userId: string; title: Record<string, string>; body: Record<string, string>; dedupe: string }> = []

    for (const d of reminderDays) {
      const windowStart = endsAt - d * day
      const windowEnd = windowStart + day
      if (t >= windowStart && t < windowEnd) {
        jobs.push({
          type: 'subscription.expiring',
          userId: sub.userId,
          title: { en: 'Subscription expiring soon', ar: 'الاشتراك على وشك الانتهاء' },
          body: {
            en: `Your subscription ends in ${d} days.`,
            ar: `اشتراكك ينتهي خلال ${d} أيام.`,
          },
          dedupe: `expiring:${sub.id}:${dayKey(new Date(endsAt))}:${d}`,
        })
      }
    }

    if (t >= endsAt && t < graceEnds) {
      const who = sub.user.displayName || sub.user.email
      jobs.push({
        type: 'subscription.grace_started',
        userId: sub.userId,
        title: { en: 'Grace period started', ar: 'بدأت فترة السماح' },
        body: { en: 'Your subscription expired; your portfolio stays visible during grace.', ar: 'انتهى اشتراكك؛ بروتفوليو يظل ظاهرًا خلال السماح.' },
        dedupe: `grace:${sub.id}:${dayKey(new Date(endsAt))}`,
      })
      for (const adminId of adminIds) {
        jobs.push({
          type: 'subscription.grace_started',
          userId: adminId,
          title: { en: 'Subscriber entered grace', ar: 'مشترك دخل السماح' },
          body: { en: `${who} entered grace period.`, ar: `${who} دخل فترة السماح.` },
          dedupe: `grace-admin:${sub.id}:${dayKey(new Date(endsAt))}:${adminId}`,
        })
      }
    }

    if (t >= graceEnds) {
      jobs.push({
        type: 'subscription.expired',
        userId: sub.userId,
        title: { en: 'Subscription expired', ar: 'انتهى الاشتراك' },
        body: { en: 'Your portfolio is now hidden. Renew to restore it.', ar: 'بروتفوليو مخفي الآن. جدد لاستعادته.' },
        dedupe: `expired:${sub.id}:${dayKey(new Date(graceEnds))}`,
      })
    }

    for (const job of jobs) {
      try {
        await prisma.notification.create({
          data: {
            userId: job.userId,
            type: job.type,
            title: job.title as Prisma.InputJsonValue,
            body: job.body as Prisma.InputJsonValue,
            dedupeKey: job.dedupe,
          },
        })
        notified++
      } catch (err: unknown) {
        // Duplicate dedupeKey (or missing table pre-migration) → skip.
        if ((err as { code?: string })?.code !== 'P2002') throw err
      }
    }
  }

  return { notified }
}
