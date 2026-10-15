import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// POST /api/admin/users/:id/unsuspend
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } })
  await audit({ actorId: gate.adminId, action: 'user.unsuspend', targetType: 'user', targetId: id, targetUserId: id })

  return Response.json({ ok: true })
}
