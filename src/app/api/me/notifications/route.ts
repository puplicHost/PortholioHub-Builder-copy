import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/me/notifications?unread=true&type=&page=&pageSize=
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const params = new URL(req.url).searchParams
  const unreadOnly = params.get('unread') === 'true'
  const type = (params.get('type') || '').trim().slice(0, 64)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    userId: user.id,
    ...(unreadOnly ? { isRead: false } : {}),
    ...(type ? { type } : {}),
  }

  const [total, unread, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ])

  return Response.json({ ok: true, items, unread, meta: buildMeta(page, pageSize, total) })
}
