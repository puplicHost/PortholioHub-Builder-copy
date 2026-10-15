import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/me/plans — active plans with public fields only.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      nameI18n: true,
      priceEgp: true,
      durationDays: true,
      limits: true,
      sortOrder: true,
    },
  })

  return Response.json({ ok: true, items: plans })
}
