import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'

// GET /api/admin/users/:id — profile, portfolio status, counts. No secrets.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      isAdmin: true,
      emailVerified: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      portfolioProfile: {
        select: { id: true, username: true, status: true, adminHidden: true, updatedAt: true },
      },
      ownedWorkspaces: { select: { id: true, name: true, createdAt: true } },
      _count: { select: { sessions: true } },
    },
  })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }
  return Response.json({ ok: true, user })
}
