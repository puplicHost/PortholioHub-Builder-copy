import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { sanitizeAuditMeta } from '@/lib/audit'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/admin/audit-log?actor=&action=&from=&to=&page=&pageSize=
// Secrets are scrubbed from meta before responding (see sanitizeAuditMeta).
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const actor = (params.get('actor') || '').trim()
  const action = (params.get('action') || '').trim()
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const { page, pageSize, skip, take } = parsePagination(params)

  const createdAt: { gte?: Date; lte?: Date } = {}
  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.lte = toDate

  const where = {
    ...(actor ? { adminId: actor } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        targetUserId: true,
        reason: true,
        metadata: true,
        createdAt: true,
        admin: { select: { id: true, email: true, displayName: true } },
        targetUser: { select: { id: true, email: true, displayName: true } },
      },
    }),
  ])

  const items = rows.map((r) => ({ ...r, metadata: sanitizeAuditMeta(r.metadata) }))
  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}
