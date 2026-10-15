import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/admin/payments?user=&from=&to=&page=&pageSize=
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const user = (params.get('user') || '').trim()
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const { page, pageSize, skip, take } = parsePagination(params)

  const createdAt: { gte?: Date; lte?: Date } = {}
  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.lte = toDate

  const where = {
    ...(user
      ? {
          user: {
            OR: [
              { email: { contains: user, mode: 'insensitive' as const } },
              { displayName: { contains: user, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        provider: true,
        amountEgp: true,
        currency: true,
        status: true,
        createdAt: true,
        completedAt: true,
        confirmedBy: true,
        user: { select: { id: true, email: true, displayName: true } },
        subscription: { select: { id: true } },
      },
    }),
  ])

  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}
