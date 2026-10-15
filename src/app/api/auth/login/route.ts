import { prisma } from '@/lib/prisma'
import {
  createSession,
  getUserByEmail,
  verifyPassword,
  SESSION_EXPIRES_IN,
} from '@/lib/auth'
import { setSessionCookie } from '@/lib/session-cookie'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'
import { AppError, Errors, toErrorResponse, rateLimitHeaders } from '@/lib/errors'

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return toErrorResponse(Errors.csrf())
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    const ip = getClientIp(req)
    const [emailLimit, ipLimit] = await Promise.all([
      checkRateLimit(`login:email:${email || 'empty'}`, 5, 15 * 60 * 1000),
      checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000),
    ])
    const blocked = !emailLimit.allowed ? emailLimit : ipLimit
    if (!blocked.allowed) {
      return Response.json(
        { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
        { status: 429, headers: rateLimitHeaders(blocked.resetAfterMs) },
      )
    }

    // Uniform message whether or not the account exists (no enumeration).
    // Unknown accounts burn equal bcrypt time against a dummy hash.
    const user = email ? await getUserByEmail(email) : null
    const candidate = user?.passwordHash || '$2a$04$y73c0LXT/Qm7qBlpMqJm0upyCM3HwUR.uK18aSy0NoNBwLacujA0q'
    const valid = user ? await verifyPassword(password, user.passwordHash || '') : await verifyPassword(password || 'x', candidate)
    if (!user || !valid) {
      throw Errors.invalidCredentials()
    }
    // Suspended only surfaces after a correct password (no existence leak).
    if (user.status !== 'ACTIVE') {
      throw Errors.suspended()
    }

    await prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {})

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken, Math.floor(SESSION_EXPIRES_IN / 1000))

    return Response.json({ ok: true, mustChangePassword: user.mustChangePassword, isAdmin: user.isAdmin })
  } catch (err) {
    if (err instanceof AppError) return toErrorResponse(err)
    return toErrorResponse(err, 'Login failed, please try again')
  }
}
