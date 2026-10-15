import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionState } from '@/lib/subscriptions'

// GET /api/me/subscription — state, remaining days, current period,
// pending request (if any).
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const state = await getSubscriptionState(user.id)
  const [current, pending] = await Promise.all([
    state.subscriptionId
      ? prisma.subscription.findUnique({
          where: { id: state.subscriptionId },
          select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            gracePeriodEndsAt: true,
            canceledAt: true,
            plan: { select: { id: true, name: true, priceEgp: true } },
          },
        })
      : null,
    prisma.subscriptionRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
      select: { id: true, code: true, status: true, createdAt: true, plan: { select: { id: true, name: true } } },
    }),
  ])

  return Response.json({ ok: true, state: state.state, daysRemaining: state.daysRemaining, current, pending })
}
