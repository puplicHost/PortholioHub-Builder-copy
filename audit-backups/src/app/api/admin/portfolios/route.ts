import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { parsePagination, buildMeta } from '@/lib/pagination'

// GET /api/admin/portfolios?search=&status=DRAFT|PUBLISHED&hidden=true|false&page=&pageSize=
export async function GET(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const params = new URL(req.url).searchParams
  const search = (params.get('search') || '').trim()
  const status = params.get('status') || ''
  const hidden = params.get('hidden') || ''
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status === 'DRAFT' || status === 'PUBLISHED' ? { status } : {}),
    ...(hidden === 'true' ? { adminHidden: true } : hidden === 'false' ? { adminHidden: false } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.userProfile.count({ where }),
    prisma.userProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        adminHidden: true,
        adminHiddenReason: true,
        updatedAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
  ])

  return Response.json({ ok: true, items, meta: buildMeta(page, pageSize, total) })
}
