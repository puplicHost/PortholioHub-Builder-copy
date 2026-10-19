import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// GET /api/admin/settings/maintenance
export async function GET() {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const row = await prisma.systemSetting.findUnique({
    where: { key: 'platform.maintenanceMode' },
  })

  const maintenanceMode = Boolean(row?.value === true || row?.value === 'true')
  return Response.json({ ok: true, maintenanceMode })
}

// POST /api/admin/settings/maintenance { enabled: boolean, reason?: string }
export async function POST(req: Request) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const enabled = Boolean(body?.enabled)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''

  await prisma.systemSetting.upsert({
    where: { key: 'platform.maintenanceMode' },
    update: { value: enabled },
    create: {
      key: 'platform.maintenanceMode',
      value: enabled,
      type: 'boolean',
      description: 'Platform wide maintenance mode toggle',
    },
  })

  await audit({
    actorId: gate.adminId,
    action: enabled ? 'system.maintenance.enable' : 'system.maintenance.disable',
    targetType: 'system_setting',
    targetId: 'platform.maintenanceMode',
    reason: reason || undefined,
    meta: { enabled },
  })

  return Response.json({ ok: true, maintenanceMode: enabled })
}
