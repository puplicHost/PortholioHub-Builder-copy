import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getCurrentUser, getCurrentSession } from '@/lib/auth'
import { validatePasswordPolicy } from '@/lib/password'
import { isSameOriginRequest } from '@/lib/csrf'
import { AppError, Errors, toErrorResponse } from '@/lib/errors'

// Change password for the signed-in user. Requires the current password,
// enforces the policy on the new one, and kills all OTHER sessions
// (the current session survives).
export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return toErrorResponse(Errors.csrf())
    }

    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } })
    if (!user || !user.passwordHash) {
      throw Errors.invalidCredentials()
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      throw Errors.validation({ currentPassword: 'Current password is incorrect' })
    }

    const problem = validatePasswordPolicy(newPassword)
    if (problem) {
      throw Errors.validation({ newPassword: problem })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    })

    const current = await getCurrentSession()
    if (current) {
      await prisma.session.deleteMany({
        where: { userId: user.id, NOT: { id: current.id } },
      })
    } else {
      await prisma.session.deleteMany({ where: { userId: user.id } })
    }

    return Response.json({ ok: true })
  } catch (err) {
    if (err instanceof AppError) return toErrorResponse(err)
    return toErrorResponse(err, 'Password change failed, please try again')
  }
}
