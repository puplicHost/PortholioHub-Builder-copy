import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'

// GET /api/admin/dashboard — real counters only, no charts (plan Phase 7).
export async function GET() {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [usersTotal, usersNew7d, portfoliosPublished, portfoliosDraft, portfoliosHidden, workspacesTotal] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.userProfile.count({ where: { status: 'PUBLISHED', adminHidden: false } }),
      prisma.userProfile.count({ where: { status: 'DRAFT' } }),
      prisma.userProfile.count({ where: { adminHidden: true } }),
      prisma.workspace.count(),
    ])

  return Response.json({
    ok: true,
    dashboard: {
      usersTotal,
      usersNew7d,
      portfoliosPublished,
      portfoliosDraft,
      portfoliosHidden,
      workspacesTotal,
    },
  })
}
