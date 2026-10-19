import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/portfolios/:username/hide { reason } — hides the public
// page immediately (gating) and notifies via audit trail.
export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { username } = await params
  const body = await req.json().catch(() => null)
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : ''
  if (!reason) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'A reason is required' }, { status: 400 })
  }

  const profile = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, userId: true },
  })
  if (!profile) {
    return Response.json({ code: 'NOT_FOUND', message: 'Portfolio not found' }, { status: 404 })
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { adminHidden: true, adminHiddenReason: reason },
  })
  await audit({
    actorId: gate.adminId,
    action: 'portfolio.hide',
    targetType: 'portfolio',
    targetId: profile.id,
    targetUserId: profile.userId,
    reason,
  })

  return Response.json({ ok: true })
}
