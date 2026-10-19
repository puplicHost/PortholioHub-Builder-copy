import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'
import { getSetting } from '@/lib/settings'
import { notify } from '@/lib/notify'
import { sendPushToAdmin } from '@/lib/send-push'

// POST /api/admin/users/:id/grant-subscription — manually grant/renew an
// active subscription. Records a CONFIRMED Payment linked to the subscription
// (price derived from the plan) so manual renewals count toward revenue.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'INVALID_BODY', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { planId, durationDays = 30, note } = body as {
    planId?: string
    durationDays?: number
    note?: string
  }

  if (!planId) {
    return Response.json({ code: 'MISSING_PLAN', message: 'Plan ID is required' }, { status: 400 })
  }

  const numDays = Number(durationDays)
  if (!Number.isFinite(numDays) || numDays < 1) {
    return Response.json({ code: 'INVALID_DURATION', message: 'Duration must be at least 1 day' }, { status: 400 })
  }

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { id: true, email: true, displayName: true } }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ])

  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }
  if (!plan) {
    return Response.json({ code: 'PLAN_NOT_FOUND', message: 'Selected plan not found' }, { status: 404 })
  }

  // Derive the amount from the plan: annual plans (≈1 year) use the annual
  // price when present, otherwise the base price. Monthly uses base price.
  const amountEgp = numDays >= 300 ? (plan.priceEgpAnnual ?? plan.priceEgp) : plan.priceEgp

  const now = new Date()
  const starter = await prisma.subscription.findFirst({
    where: { userId: id, canceledAt: null },
    orderBy: { expiresAt: 'desc' },
    select: { expiresAt: true },
  })
  const currentEnds = starter?.expiresAt ? new Date(starter.expiresAt).getTime() : 0
  const startedAt = currentEnds > now.getTime() ? new Date(currentEnds) : now
  const expiresAt = new Date(startedAt.getTime() + numDays * 86400000)

  const graceDaysRaw = await getSetting('subscription.graceDays').catch(() => 7)
  const graceDays =
    typeof graceDaysRaw === 'number' && graceDaysRaw >= 1 && graceDaysRaw <= 60 ? graceDaysRaw : 7
  const gracePeriodEndsAt = new Date(expiresAt.getTime() + graceDays * 86400000)

  const { subscription, payment } = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId: id,
        planId,
        status: 'ACTIVE',
        amountEgp,
        startedAt,
        expiresAt,
        gracePeriodEndsAt,
        createdBy: gate.adminId,
        planSnapshot: {
          grantedByAdmin: true,
          grantedByAdminId: gate.adminId,
          note: note?.trim() || 'Manual administrative grant',
          grantedAt: now.toISOString(),
        },
      },
      include: {
        plan: { select: { id: true, name: true } },
      },
    })

    const payment = await tx.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: id,
        provider: 'manual_admin',
        amountEgp,
        currency: 'EGP',
        status: 'CONFIRMED',
        confirmedBy: gate.adminId,
        confirmedAt: now,
        completedAt: now,
        metadata: {
          grantedByAdmin: true,
          planId: plan.id,
          planName: plan.name,
          durationDays: numDays,
          note: note?.trim() || null,
        } as Prisma.InputJsonValue,
      },
      select: { id: true, amountEgp: true },
    })

    return { subscription, payment }
  })

  await audit({
    actorId: gate.adminId,
    action: 'user.subscription.grant',
    targetType: 'Subscription',
    targetId: subscription.id,
    targetUserId: id,
    reason: note?.trim() || 'Manual administrative grant',
    meta: {
      planId: plan.id,
      planName: plan.name,
      durationDays: numDays,
      amountEgp,
      paymentId: payment.id,
      expiresAt: expiresAt.toISOString(),
      userEmail: user.email,
    },
  })

  // Notify admins (shared visibility) and the user whose access was extended.
  try {
    const who = user.displayName || user.email
    await notify({
      toAdmins: true,
      type: 'subscription.renewed',
      title: { en: 'Subscription renewed', ar: 'تم تجديد اشتراك' },
      body: {
        en: `${who} — subscription renewed (${amountEgp} EGP).`,
        ar: `${who} — تم تجديد الاشتراك (${amountEgp} جنيه).`,
      },
      link: `/admin/users/${id}`,
      dedupeKey: `subscription.renewed:${subscription.id}`,
    })
    await notify({
      toUserIds: [id],
      type: 'subscription.renewed',
      title: { en: 'Your subscription was renewed', ar: 'تم تجديد اشتراكك' },
      body: {
        en: `Your subscription is now active until ${expiresAt.toLocaleDateString('en-GB')}.`,
        ar: `اشتراكك الآن نشط حتى ${expiresAt.toLocaleDateString('en-GB')}.`,
      },
      link: '/profile/subscription',
      dedupeKey: `subscription.renewed.user:${subscription.id}`,
    })
  } catch (err) {
    console.error('[admin/grant-subscription] notify failed:', err)
  }

  void sendPushToAdmin('تم تجديد اشتراك', `${user.displayName || user.email} — ${amountEgp} جنيه`)

  return Response.json({ ok: true, subscription, payment })
}
