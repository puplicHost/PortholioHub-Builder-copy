import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/admin/users?search=&status=&page=&pageSize=
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const search = (params.get('search') || '').trim()
  const status = params.get('status') || ''
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status === 'ACTIVE' || status === 'SUSPENDED' ? { status } : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        isAdmin: true,
        emailVerified: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
  ])

  return Response.json({ ok: true, items: users, meta: buildMeta(page, pageSize, total) })
}
