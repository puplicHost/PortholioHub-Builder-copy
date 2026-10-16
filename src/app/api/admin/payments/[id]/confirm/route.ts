import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/payments/:id/confirm { note? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  })

  if (!payment) {
    return Response.json({ code: 'NOT_FOUND', message: 'Payment record not found' }, { status: 404 })
  }

  const now = new Date()

  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedBy: gate.adminId,
      confirmedAt: now,
      completedAt: now,
    },
  })

  // If tied to a subscription, ensure it is activated and period is valid
  if (payment.subscription) {
    const sub = payment.subscription
    const durationDays = sub.plan?.durationDays ?? 30
    const dayMs = 24 * 60 * 60 * 1000

    const currentExpiry = sub.expiresAt ? new Date(sub.expiresAt).getTime() : 0
    const baseTime = currentExpiry > now.getTime() ? currentExpiry : now.getTime()
    const newExpiresAt = new Date(baseTime + durationDays * dayMs)

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        canceledAt: null,
        expiresAt: newExpiresAt,
      },
    })

    try {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          eventType: 'PAYMENT_CONFIRMED',
          fromStatus: sub.status,
          toStatus: 'ACTIVE',
          metadata: {
            paymentId: payment.id,
            amountEgp: payment.amountEgp,
            confirmedBy: gate.adminId,
            note: note || undefined,
          },
          createdBy: gate.adminId,
        },
      })
    } catch (err) {
      console.error('Failed to record subscription event for confirmed payment:', err)
    }
  }

  // Audit log
  await audit({
    actorId: gate.adminId,
    action: 'payment.confirm',
    targetType: 'payment',
    targetId: id,
    targetUserId: payment.userId,
    reason: note || 'Manual administrative payment confirmation',
    meta: {
      amountEgp: payment.amountEgp,
      provider: payment.provider,
      subscriptionId: payment.subscriptionId,
    },
  })

  return Response.json({ ok: true, payment: updatedPayment })
}
