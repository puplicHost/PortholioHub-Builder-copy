import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireAdminApi } from '@/lib/admin-guard'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { getSetting } from '@/lib/settings'

// GET /api/admin/subscriptions?status=&page=&pageSize= (status filters on
// the legacy status column; effective ACTIVE/GRACE/EXPIRED is computed
// client-side from dates in Sprint C UI via /api/me/subscription).
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const { page, pageSize, skip, take } = parsePagination(params)

  const [total, items] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.findMany({
      orderBy: { startedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        gracePeriodEndsAt: true,
        canceledAt: true,
        amountEgp: true,
        user: { select: { id: true, email: true, displayName: true } },
        plan: { select: { id: true, name: true } },
      },
    }),
  ])

  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}

// POST /api/admin/subscriptions/grant { userId/email, planId, amountEgp?, note? }
// Manual grant: same A4 date rules as approve (continues ACTIVE periods).
export async function POST(req: Request) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const userRef = typeof body?.userId === 'string' ? body.userId : typeof body?.email === 'string' ? body.email : ''
  const planId = typeof body?.planId === 'string' ? body.planId : ''
  const amountEgp = body?.amountEgp === undefined || body?.amountEgp === null ? 0 : Number(body.amountEgp)
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''
  if (!userRef || !planId || !Number.isFinite(amountEgp) || amountEgp < 0) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'userId/email, planId and amountEgp are required' }, { status: 400 })
  }

  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = userRef.includes('@')
        ? await tx.user.findUnique({ where: { email: userRef.trim().toLowerCase() }, select: { id: true } })
        : await tx.user.findUnique({ where: { id: userRef }, select: { id: true } })
      if (!target) throw { code: 'NOT_FOUND' }
      const plan = await tx.plan.findUniqueOrThrow({ where: { id: planId } })
      const durationDays = plan.durationDays && plan.durationDays > 0 ? plan.durationDays : 30
      const graceDaysRaw = await getSetting('subscription.graceDays').catch(() => 7)
      const graceDays = typeof graceDaysRaw === 'number' && graceDaysRaw >= 1 && graceDaysRaw <= 60 ? graceDaysRaw : 7

      const current = await tx.subscription.findFirst({
        where: { userId: target.id, canceledAt: null },
        orderBy: { expiresAt: 'desc' },
      })
      const currentEnds = current?.expiresAt ? new Date(current.expiresAt).getTime() : 0
      const startsAt = currentEnds > now.getTime() ? new Date(currentEnds) : now
      const endsAt = new Date(startsAt.getTime() + durationDays * day)
      const graceEndsAt = new Date(endsAt.getTime() + graceDays * day)

      const subscription = await tx.subscription.create({
        data: {
          userId: target.id,
          planId: plan.id,
          status: 'ACTIVE',
          startedAt: startsAt,
          expiresAt: endsAt,
          gracePeriodEndsAt: graceEndsAt,
          amountEgp: Math.floor(amountEgp),
          planSnapshot: (plan.limits ?? {}) as Prisma.InputJsonValue,
          createdBy: gate.adminId,
        },
        select: { id: true },
      })
      await tx.adminAuditLog.create({
        data: {
          adminId: gate.adminId,
          action: 'subscription.grant',
          targetType: 'subscription',
          targetId: subscription.id,
          targetUserId: target.id,
          reason: note || null,
          metadata: { amountEgp: Math.floor(amountEgp) } as Prisma.InputJsonValue,
        },
      })
      return { subscriptionId: subscription.id }
    })
    return Response.json({ ok: true, ...result })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'NOT_FOUND') {
      return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
    }
    console.error('[admin/grant]', err)
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Grant failed' }, { status: 500 })
  }
}
