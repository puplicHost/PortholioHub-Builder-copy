import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/subscriptions/:id/unsuspend — clears canceledAt.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!sub) {
    return Response.json({ code: 'NOT_FOUND', message: 'Subscription not found' }, { status: 404 })
  }

  await prisma.subscription.update({ where: { id }, data: { canceledAt: null } })
  await audit({
    actorId: gate.adminId,
    action: 'subscription.unsuspend',
    targetType: 'subscription',
    targetId: id,
    targetUserId: sub.userId,
  })

  return Response.json({ ok: true })
}
