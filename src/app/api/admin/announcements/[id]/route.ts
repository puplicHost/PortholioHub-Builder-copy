import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// PATCH /api/admin/announcements/:id
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)

  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ code: 'NOT_FOUND', message: 'Announcement not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (typeof body?.title === 'string') data.title = body.title.trim()
  if (typeof body?.body === 'string') data.body = body.body.trim()
  if (typeof body?.type === 'string') data.type = body.type.toUpperCase()
  if (typeof body?.targetAudience === 'string') data.targetAudience = body.targetAudience.toUpperCase()
  if (typeof body?.active === 'boolean') data.active = body.active
  if (typeof body?.dismissible === 'boolean') data.dismissible = body.dismissible
  if (body?.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data,
  })

  await audit({
    actorId: gate.adminId,
    action: 'announcement.update',
    targetType: 'announcement',
    targetId: id,
    meta: data,
  })

  return Response.json({ ok: true, announcement: updated })
}

// DELETE /api/admin/announcements/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  const { id } = await params

  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ code: 'NOT_FOUND', message: 'Announcement not found' }, { status: 404 })
  }

  await prisma.announcement.delete({ where: { id } })

  await audit({
    actorId: gate.adminId,
    action: 'announcement.delete',
    targetType: 'announcement',
    targetId: id,
    meta: { title: existing.title },
  })

  return Response.json({ ok: true })
}
