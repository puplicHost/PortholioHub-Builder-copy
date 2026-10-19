import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/subscriptions/:id/suspend { reason? } — canceledAt set
// (state → SUSPENDED, portfolio hidden).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!sub) {
    return Response.json({ code: 'NOT_FOUND', message: 'Subscription not found' }, { status: 404 })
  }

  await prisma.subscription.update({ where: { id }, data: { canceledAt: new Date() } })
  await audit({
    actorId: gate.adminId,
    action: 'subscription.suspend',
    targetType: 'subscription',
    targetId: id,
    targetUserId: sub.userId,
    reason: reason || undefined,
  })

  return Response.json({ ok: true })
}
