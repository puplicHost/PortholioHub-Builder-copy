import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/me/notifications/unread-count — the bell's source of truth.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const unread = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  })
  return Response.json({ ok: true, unread })
}
