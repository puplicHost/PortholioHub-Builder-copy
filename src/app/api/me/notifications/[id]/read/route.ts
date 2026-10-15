import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/me/notifications/:id/read — owners only (IDOR-safe by userId).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const { id } = await params
  const result = await prisma.notification.updateMany({
    where: { id, userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  if (result.count === 0) {
    return Response.json({ code: 'NOT_FOUND', message: 'Notification not found' }, { status: 404 })
  }
  return Response.json({ ok: true })
}
