import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/users/:id/grant-subscription — manually grant active subscription
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
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

  const startedAt = new Date()
  const expiresAt = new Date(startedAt.getTime() + numDays * 86400000)

  const subscription = await prisma.subscription.create({
    data: {
      userId: id,
      planId,
      status: 'ACTIVE',
      amountEgp: 0,
      startedAt,
      expiresAt,
      planSnapshot: {
        grantedByAdmin: true,
        grantedByAdminId: gate.adminId,
        note: note?.trim() || 'Manual administrative grant',
        grantedAt: startedAt.toISOString(),
      },
    },
    include: {
      plan: { select: { id: true, name: true } },
    },
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
      expiresAt: expiresAt.toISOString(),
      userEmail: user.email,
    },
  })

  return Response.json({ ok: true, subscription })
}
