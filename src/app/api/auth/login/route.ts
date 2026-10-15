import { prisma } from '@/lib/prisma'
import {
  createSession,
  getUserByEmail,
  verifyPassword,
  SESSION_EXPIRES_IN,
} from '@/lib/auth'
import { setSessionCookie } from '@/lib/session-cookie'

const INVALID = 'Invalid email or password'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return Response.json({ ok: false, error: INVALID }, { status: 401 })
    }

    const user = await getUserByEmail(email)
    if (!user || !user.passwordHash) {
      return Response.json({ ok: false, error: INVALID }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return Response.json({ ok: false, error: INVALID }, { status: 401 })
    }

    await prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {})

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken, Math.floor(SESSION_EXPIRES_IN / 1000))

    return Response.json({ ok: true, emailVerified: user.emailVerified })
  } catch (err) {
    console.error('[auth/login]', err)
    return Response.json({ ok: false, error: 'Login failed, please try again' }, { status: 500 })
  }
}
