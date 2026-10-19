import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// PATCH /api/admin/plans/:id — partial update (same validation rules as
// create; reuse by forwarding normalized fields).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const existing = await prisma.plan.findUnique({
    where: { id },
    select: { id: true, _count: { select: { subscriptions: true } } },
  })
  if (!existing) {
    return Response.json({ code: 'NOT_FOUND', message: 'Plan not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const data: Record<string, unknown> = {}
  if (body?.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
    if (!name) return Response.json({ code: 'VALIDATION_ERROR', message: 'Name is required' }, { status: 400 })
    data.name = name
  }
  if (body?.priceEgp !== undefined) {
    const priceEgp = Number(body.priceEgp)
    if (!Number.isFinite(priceEgp) || priceEgp < 0) {
      return Response.json({ code: 'VALIDATION_ERROR', message: 'priceEgp must be >= 0' }, { status: 400 })
    }
    data.priceEgp = Math.floor(priceEgp)
  }
  if (body?.durationDays !== undefined) {
    const durationDays = Number(body.durationDays)
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650) {
      return Response.json({ code: 'VALIDATION_ERROR', message: 'durationDays must be 1-3650' }, { status: 400 })
    }
    data.durationDays = Math.floor(durationDays)
  }
  if (body?.limits !== undefined) {
    if (!body.limits || typeof body.limits !== 'object') {
      return Response.json({ code: 'VALIDATION_ERROR', message: 'limits must be an object' }, { status: 400 })
    }
    data.limits = body.limits
  }
  if (body?.nameI18n !== undefined) {
    if (!body.nameI18n || typeof body.nameI18n !== 'object') {
      return Response.json({ code: 'VALIDATION_ERROR', message: 'nameI18n must be an object' }, { status: 400 })
    }
    data.nameI18n = body.nameI18n
  }
  if (body?.isActive !== undefined) data.isActive = Boolean(body.isActive)
  if (body?.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder)
    if (!Number.isFinite(sortOrder)) {
      return Response.json({ code: 'VALIDATION_ERROR', message: 'sortOrder must be a number' }, { status: 400 })
    }
    data.sortOrder = Math.floor(sortOrder)
  }

  await prisma.plan.update({ where: { id }, data })
  await audit({ actorId: gate.adminId, action: 'plan.update', targetType: 'plan', targetId: id })

  return Response.json({ ok: true })
}

// DELETE /api/admin/plans/:id — refused when subscriptions exist
// (deactivate instead); deletes only unused plans.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const existing = await prisma.plan.findUnique({
    where: { id },
    select: { id: true, _count: { select: { subscriptions: true } } },
  })
  if (!existing) {
    return Response.json({ code: 'NOT_FOUND', message: 'Plan not found' }, { status: 404 })
  }
  if (existing._count.subscriptions > 0) {
    return Response.json(
      { code: 'CONFLICT', message: 'Plan has subscriptions — deactivate instead of deleting' },
      { status: 409 },
    )
  }

  await prisma.plan.delete({ where: { id } })
  await audit({ actorId: gate.adminId, action: 'plan.delete', targetType: 'plan', targetId: id })

  return Response.json({ ok: true })
}
