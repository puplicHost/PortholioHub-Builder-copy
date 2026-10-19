import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireAdminApi } from '@/lib/admin-guard'
import { getSetting } from '@/lib/settings'

// POST /api/admin/subscription-requests/:id/approve { amountEgp, reference?, note? }
// Single transaction: PENDING-lock → dates (A4) → Subscription + Payment +
// request update + audit. Double-approve lands on 409.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const amountEgp = Number(body?.amountEgp)
  const reference = typeof body?.reference === 'string' ? body.reference.trim().slice(0, 200) : ''
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''
  if (!Number.isFinite(amountEgp) || amountEgp < 0) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'Amount is required' }, { status: 400 })
  }

  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock: only a PENDING request advances (second concurrent approve → 0 rows → 409).
      const locked = await tx.subscriptionRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', handledBy: gate.adminId, handledAt: now },
      })
      if (locked.count === 0) {
        throw { code: 'CONFLICT' } as unknown as Error
      }

      const request = await tx.subscriptionRequest.findUniqueOrThrow({
        where: { id },
        select: { id: true, userId: true, planId: true },
      })
      const plan = await tx.plan.findUniqueOrThrow({ where: { id: request.planId } })
      const durationDays = plan.durationDays && plan.durationDays > 0 ? plan.durationDays : 30
      const graceDaysRaw = await getSetting('subscription.graceDays').catch(() => 7)
      const graceDays = typeof graceDaysRaw === 'number' && graceDaysRaw >= 1 && graceDaysRaw <= 60 ? graceDaysRaw : 7

      // A4: renewal during an ACTIVE period continues from endsAt, else now.
      const current = await tx.subscription.findFirst({
        where: { userId: request.userId, canceledAt: null },
        orderBy: { expiresAt: 'desc' },
      })
      const currentEnds = current?.expiresAt ? new Date(current.expiresAt).getTime() : 0
      const startsAt = currentEnds > now.getTime() ? new Date(currentEnds) : now
      const endsAt = new Date(startsAt.getTime() + durationDays * day)
      const graceEndsAt = new Date(endsAt.getTime() + graceDays * day)

      const subscription = await tx.subscription.create({
        data: {
          userId: request.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startedAt: startsAt,
          expiresAt: endsAt,
          gracePeriodEndsAt: graceEndsAt,
          amountEgp: Math.floor(amountEgp),
          planSnapshot: (plan.limits ?? {}) as Prisma.InputJsonValue,
          requestId: request.id,
          createdBy: gate.adminId,
        },
        select: { id: true },
      })

      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          userId: request.userId,
          provider: 'whatsapp_manual',
          amountEgp: Math.floor(amountEgp),
          currency: 'EGP',
          status: 'confirmed',
          metadata: { reference: reference || null, note: note || null } as Prisma.InputJsonValue,
          completedAt: now,
          confirmedBy: gate.adminId,
          confirmedAt: now,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: gate.adminId,
          action: 'subscription.approve',
          targetType: 'subscription',
          targetId: subscription.id,
          targetUserId: request.userId,
          reason: note || null,
          metadata: { requestId: request.id, amountEgp: Math.floor(amountEgp) } as Prisma.InputJsonValue,
        },
      })

      return { subscriptionId: subscription.id }
    })

    return Response.json({ ok: true, ...result })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'CONFLICT') {
      return Response.json({ code: 'CONFLICT', message: 'Request is no longer pending' }, { status: 409 })
    }
    console.error('[admin/approve]', err)
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Approve failed' }, { status: 500 })
  }
}
