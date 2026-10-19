import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/portfolios/:username/unhide
export async function POST(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  const { username } = await params
  const profile = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, userId: true },
  })
  if (!profile) {
    return Response.json({ code: 'NOT_FOUND', message: 'Portfolio not found' }, { status: 404 })
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { adminHidden: false, adminHiddenReason: null },
  })
  await audit({
    actorId: gate.adminId,
    action: 'portfolio.unhide',
    targetType: 'portfolio',
    targetId: profile.id,
    targetUserId: profile.userId,
  })

  return Response.json({ ok: true })
}
