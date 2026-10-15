import { prisma } from '@/lib/prisma'

// GET /api/public/plans — active plans, public fields only (plan Phase 8).
export async function GET() {
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
    },
  })
  return Response.json({ ok: true, items: plans })
}
