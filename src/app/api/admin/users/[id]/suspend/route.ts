import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { deleteAllSessions } from '@/lib/auth'
import { audit } from '@/lib/audit'

// POST /api/admin/users/:id/suspend — blocks login + kills sessions.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  const { id } = await params
  if (id === gate.adminId) {
    return Response.json({ code: 'INVALID', message: 'You cannot suspend your own account' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } })
  await deleteAllSessions(id)
  await audit({ actorId: gate.adminId, action: 'user.suspend', targetType: 'user', targetId: id, targetUserId: id })

  return Response.json({ ok: true })
}
