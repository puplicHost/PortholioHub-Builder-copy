import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// GET /api/admin/announcements
export async function GET() {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ ok: true, announcements })
}

// POST /api/admin/announcements
export async function POST(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const bodyText = typeof body?.body === 'string' ? body.body.trim() : ''
  const type = typeof body?.type === 'string' ? body.type.toUpperCase() : 'INFO'
  const targetAudience = typeof body?.targetAudience === 'string' ? body.targetAudience.toUpperCase() : 'ALL'
  const active = typeof body?.active === 'boolean' ? body.active : true
  const dismissible = typeof body?.dismissible === 'boolean' ? body.dismissible : true
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null

  if (!title || !bodyText) {
    return Response.json(
      { code: 'VALIDATION_ERROR', message: 'Title and body are required' },
      { status: 400 }
    )
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body: bodyText,
      type,
      targetAudience,
      active,
      dismissible,
      expiresAt,
      createdBy: gate.adminId,
    },
  })

  await audit({
    actorId: gate.adminId,
    action: 'announcement.create',
    targetType: 'announcement',
    targetId: announcement.id,
    meta: { title, type, targetAudience, active },
  })

  return Response.json({ ok: true, announcement }, { status: 201 })
}
