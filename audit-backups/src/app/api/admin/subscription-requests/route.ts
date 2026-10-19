import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/admin/subscription-requests?status=&page=&pageSize=
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const status = params.get('status') || ''
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELED'
    ? { status }
    : {}

  const [total, items] = await Promise.all([
    prisma.subscriptionRequest.count({ where }),
    prisma.subscriptionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        code: true,
        status: true,
        note: true,
        createdAt: true,
        handledAt: true,
        user: { select: { id: true, email: true, displayName: true, phone: true } },
        plan: { select: { id: true, name: true, priceEgp: true } },
      },
    }),
  ])

  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}
