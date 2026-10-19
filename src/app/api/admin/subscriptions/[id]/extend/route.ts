import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/subscriptions/:id/extend { days } — pushes expiresAt
// (and grace snapshot) forward by N days.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const days = Number(body?.days)
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'days must be 1-365' }, { status: 400 })
  }

  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: { id: true, userId: true, expiresAt: true, gracePeriodEndsAt: true },
  })
  if (!sub) {
    return Response.json({ code: 'NOT_FOUND', message: 'Subscription not found' }, { status: 404 })
  }

  const day = 24 * 60 * 60 * 1000
  const base = sub.expiresAt ? new Date(sub.expiresAt).getTime() : Date.now()
  const expiresAt = new Date(base + Math.floor(days) * day)
  const graceBase = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).getTime() : expiresAt.getTime()
  const gracePeriodEndsAt = new Date(Math.max(graceBase, expiresAt.getTime()) + Math.floor(days) * day)

  await prisma.subscription.update({ where: { id }, data: { expiresAt, gracePeriodEndsAt } })
  await audit({
    actorId: gate.adminId,
    action: 'subscription.extend',
    targetType: 'subscription',
    targetId: id,
    targetUserId: sub.userId,
    meta: { days: Math.floor(days) },
  })

  return Response.json({ ok: true })
}
