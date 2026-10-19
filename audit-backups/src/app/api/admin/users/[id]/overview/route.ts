import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'

// GET /api/admin/users/:id/overview — compact dossier for the admin
// user-details drawer: account, effective subscription + 7-day grace math,
// portfolio, the two renewal plans, and the 5 most recent activity events.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      isAdmin: true,
      status: true,
      createdAt: true,
    },
  })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  const [sub, portfolio, plans, recentSubs, recentPayments, recentAudit] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: id, canceledAt: null },
      orderBy: { expiresAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        gracePeriodEndsAt: true,
        plan: { select: { id: true, name: true, priceEgp: true, durationDays: true } },
      },
    }),
    prisma.userProfile.findFirst({
      where: { userId: id },
      select: { username: true, status: true, adminHidden: true },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, priceEgp: true, durationDays: true },
    }),
    prisma.subscription.findMany({
      where: { userId: id },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
        canceledAt: true,
        plan: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, amountEgp: true, provider: true, status: true, createdAt: true },
    }),
    prisma.adminAuditLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, action: true, reason: true, createdAt: true, admin: { select: { email: true } } },
    }),
  ])

  // Effective subscription state (mirrors lib/subscriptions rules).
  let state: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'NONE' = 'NONE'
  let graceDaysLeft = 0
  if (sub?.expiresAt) {
    const endsAt = new Date(sub.expiresAt).getTime()
    const graceEnds = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).getTime() : endsAt
    const t = now.getTime()
    if (t < endsAt) state = 'ACTIVE'
    else if (t < graceEnds) {
      state = 'GRACE'
      graceDaysLeft = Math.ceil((graceEnds - t) / day)
    } else state = 'EXPIRED'
  }

  const monthlyPlan = plans.find((p) => (p.durationDays ?? 0) === 30) ?? plans[0] ?? null
  const annualPlan = plans.find((p) => (p.durationDays ?? 0) === 365) ?? plans[1] ?? null

  const events: Array<{ id: string; timestamp: string; title: string; description?: string }> = [
    ...recentSubs.map((s) => ({
      id: `sub-${s.id}`,
      timestamp: new Date(s.startedAt).toISOString(),
      title: `اشتراك جديد — ${typeof s.plan.name === 'string' ? s.plan.name : 'خطة'}`,
      description: s.canceledAt
        ? 'ملغي'
        : `ينتهي ${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('en-GB') : '—'}`,
    })),
    ...recentPayments.map((p) => ({
      id: `pay-${p.id}`,
      timestamp: new Date(p.createdAt).toISOString(),
      title: `دفعة ${p.amountEgp} جنيه — ${p.status}`,
      description: `${p.provider} · ${new Date(p.createdAt).toLocaleDateString('en-GB')}`,
    })),
    ...recentAudit.map((a) => ({
      id: `audit-${a.id}`,
      timestamp: new Date(a.createdAt).toISOString(),
      title: `إجراء إداري: ${a.action}`,
      description: a.reason || a.admin?.email || undefined,
    })),
    {
      id: `user-created-${user.id}`,
      timestamp: new Date(user.createdAt).toISOString(),
      title: 'تسجيل الحساب',
      description: user.email,
    },
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return Response.json({
    ok: true,
    user: {
      ...user,
      createdAt: new Date(user.createdAt).toISOString(),
    },
    subscription: sub
      ? {
          id: sub.id,
          state,
          graceDaysLeft,
          planId: sub.plan.id,
          planName: typeof sub.plan.name === 'string' ? sub.plan.name : sub.plan.id,
          startedAt: new Date(sub.startedAt).toISOString(),
          expiresAt: sub.expiresAt ? new Date(sub.expiresAt).toISOString() : null,
          graceEndsAt: sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).toISOString() : null,
        }
      : null,
    plans: { monthly: monthlyPlan, annual: annualPlan },
    portfolio,
    events,
  })
}
