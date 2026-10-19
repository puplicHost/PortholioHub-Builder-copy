import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/users/:id/revoke-sessions
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  const result = await prisma.session.deleteMany({ where: { userId: id } })
  await audit({
    actorId: gate.adminId,
    action: 'user.revoke-sessions',
    targetType: 'user',
    targetId: id,
    targetUserId: id,
    meta: { revoked: result.count },
  })

  return Response.json({ ok: true, revoked: result.count })
}
