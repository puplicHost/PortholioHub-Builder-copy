import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/subscriptions/:id/override { status, expiresAt?, reason? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const status = typeof body?.status === 'string' ? body.status.toUpperCase().trim() : null
  const expiresAtStr = typeof body?.expiresAt === 'string' ? body.expiresAt.trim() : null
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  const allowedStatuses = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'TRIAL', 'CANCELED']
  if (!status || !allowedStatuses.includes(status)) {
    return Response.json(
      { code: 'VALIDATION_ERROR', message: `Status must be one of: ${allowedStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, expiresAt: true, canceledAt: true },
  })
  if (!sub) {
    return Response.json({ code: 'NOT_FOUND', message: 'Subscription not found' }, { status: 404 })
  }

  let expiresAtDate: Date | null = sub.expiresAt
  if (expiresAtStr) {
    const parsed = new Date(expiresAtStr)
    if (!Number.isNaN(parsed.getTime())) {
      expiresAtDate = parsed
    }
  }

  const isCanceling = status === 'SUSPENDED' || status === 'CANCELED'

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status,
      canceledAt: isCanceling ? (sub.canceledAt ?? new Date()) : null,
      expiresAt: expiresAtDate,
    },
  })

  // Create immutable subscription event entry
  try {
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: id,
        eventType: 'ADMIN_OVERRIDE',
        fromStatus: sub.status,
        toStatus: status,
        metadata: {
          reason: reason || undefined,
          expiresAt: expiresAtDate?.toISOString(),
        },
        createdBy: gate.adminId,
      },
    })
  } catch (err) {
    console.error('Failed to write subscription event:', err)
  }

  await audit({
    actorId: gate.adminId,
    action: 'subscription.override',
    targetType: 'subscription',
    targetId: id,
    targetUserId: sub.userId,
    reason: reason || undefined,
    meta: {
      fromStatus: sub.status,
      toStatus: status,
      expiresAt: expiresAtDate?.toISOString(),
    },
  })

  return Response.json({ ok: true, subscription: updated })
}
