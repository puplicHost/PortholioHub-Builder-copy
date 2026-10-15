import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// Plans admin (plan Phase 3 §23): list, create, update, activate/deactivate.
// No delete for plans with subscriptions (deactivate instead).
export async function GET() {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const items = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      nameI18n: true,
      priceEgp: true,
      durationDays: true,
      limits: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { subscriptions: true } },
    },
  })
  return Response.json({ ok: true, items })
}

function parsePlanBody(body: Record<string, unknown> | null) {
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const priceEgp = Number(body?.priceEgp)
  const durationDays = body?.durationDays === undefined || body?.durationDays === null
    ? 30
    : Number(body.durationDays)
  const sortOrder = body?.sortOrder === undefined || body?.sortOrder === null ? 0 : Number(body.sortOrder)
  const isActive = body?.isActive === undefined ? true : Boolean(body?.isActive)
  const limits = body?.limits && typeof body.limits === 'object' ? body.limits : null
  const nameI18n = body?.nameI18n && typeof body.nameI18n === 'object' ? body.nameI18n : null
  if (!name) return { error: 'Name is required' }
  if (!Number.isFinite(priceEgp) || priceEgp < 0) return { error: 'priceEgp must be >= 0' }
  if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 3650) {
    return { error: 'durationDays must be 1-3650' }
  }
  if (!Number.isFinite(sortOrder)) return { error: 'sortOrder must be a number' }
  return {
    data: {
      name,
      nameI18n: nameI18n as Prisma.InputJsonValue,
      priceEgp: Math.floor(priceEgp),
      durationDays: Math.floor(durationDays),
      limits: limits as Prisma.InputJsonValue,
      isActive,
      sortOrder: Math.floor(sortOrder),
    },
  }
}

export async function POST(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const parsed = parsePlanBody(body)
  if ('error' in parsed) {
    return Response.json({ code: 'VALIDATION_ERROR', message: parsed.error }, { status: 400 })
  }
  const plan = await prisma.plan.create({
    data: {
      ...parsed.data,
      workspaceLimit: 1,
      postsPerMonth: 0,
      storageMb: 0,
      trialDays: 0,
    },
    select: { id: true },
  })
  await audit({ actorId: gate.adminId, action: 'plan.create', targetType: 'plan', targetId: plan.id })
  return Response.json({ ok: true, id: plan.id }, { status: 201 })
}
