import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'
import { SETTING_KEYS, getSettings, parseSettingValue } from '@/lib/settings'

// GET /api/admin/settings — all registry keys with values + descriptions.
export async function GET() {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const descriptions: Record<string, string> = {
    'platform.name': 'Platform display name',
    'contact.whatsapp': 'WhatsApp number in international format (empty = button hidden)',
    'contact.phone': 'Public contact phone',
    'subscription.graceDays': 'Grace days after subscription expiry (snapshot per subscription)',
  }
  const values = await getSettings(SETTING_KEYS)
  const items = SETTING_KEYS.map((key) => ({
    key,
    value: values[key],
    description: descriptions[key] || '',
  }))

  return Response.json({ ok: true, items })
}

// PATCH /api/admin/settings { key, value } — registry-validated, audited.
export async function PATCH(req: Request) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const key = typeof body?.key === 'string' ? body.key : ''
  const parsed = parseSettingValue(key, body?.value)
  if (!parsed.ok) {
    const status = key && (SETTING_KEYS as string[]).includes(key) ? 422 : 400
    return Response.json({ code: 'VALIDATION_ERROR', message: parsed.error }, { status })
  }

  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: parsed.value as Prisma.InputJsonValue, type: 'json' },
    update: { value: parsed.value as Prisma.InputJsonValue },
  })
  await audit({ actorId: gate.adminId, action: 'settings.update', targetType: 'setting', targetId: key })

  return Response.json({ ok: true })
}
