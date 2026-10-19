import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { requireAdminApi } from '@/lib/admin-guard'
import { deleteAllSessions } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/admin/users/:id/reset-password — one-time 12-char temporary
// password (unambiguous alphabet), forces change on next login, kills all
// sessions. The password is returned ONCE and never stored/logged.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function temporaryPassword(): string {
  const bytes = crypto.randomBytes(12)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(_req)
  if (!gate.ok) return gate.response

  // Basic rate limit (DB-backed, shared across instances) on this sensitive
  // action: max 10 resets per minute per admin+IP.
  const rl = await checkRateLimit(
    `admin-reset-password:${gate.adminId}:${getClientIp(_req)}`,
    10,
    60_000,
  )
  if (!rl.allowed) {
    return Response.json(
      { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetAfterMs / 1000)) } },
    )
  }

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  const temp = temporaryPassword()
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(temp, 12), mustChangePassword: true },
  })
  await deleteAllSessions(id)
  await audit({ actorId: gate.adminId, action: 'user.reset-password', targetType: 'user', targetId: id, targetUserId: id })

  // The temp password is returned in the response ONLY and never logged.
  return Response.json({ ok: true, tempPassword: temp })
}
