import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/me/subscription/history — paginated past periods + requests.
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const params = new URL(req.url).searchParams
  const { page, pageSize, skip, take } = parsePagination(params)

  const [total, items] = await Promise.all([
    prisma.subscription.count({ where: { userId: user.id } }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        canceledAt: true,
        amountEgp: true,
        plan: { select: { id: true, name: true } },
      },
    }),
  ])

  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}
