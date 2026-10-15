import { prisma } from '@/lib/prisma'

// Daily session cleanup: deletes expired sessions only.
// Called by POST /api/cron/session-cleanup (Vercel Cron, daily).
// Returns the number of deleted rows for the cron log.
export async function runSessionCleanup(): Promise<{ deleted: number }> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return { deleted: result.count }
}
