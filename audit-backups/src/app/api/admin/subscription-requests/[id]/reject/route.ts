import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/subscription-requests/:id/reject { reason }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''
  if (!reason) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'A reason is required' }, { status: 400 })
  }

  const updated = await prisma.subscriptionRequest.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', handledBy: gate.adminId, handledAt: new Date() },
  })
  if (updated.count === 0) {
    return Response.json({ code: 'CONFLICT', message: 'Request is no longer pending' }, { status: 409 })
  }

  const request = await prisma.subscriptionRequest.findUnique({
    where: { id },
    select: { userId: true },
  })
  await audit({
    actorId: gate.adminId,
    action: 'subscription.reject',
    targetType: 'subscription_request',
    targetId: id,
    targetUserId: request?.userId,
    reason,
  })

  return Response.json({ ok: true })
}
