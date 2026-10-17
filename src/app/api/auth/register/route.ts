import {
  createSession,
  createUser,
  getUserByEmail,
  SESSION_EXPIRES_IN,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/session-cookie'
import { ensurePersonalWorkspace } from '@/lib/workspaces'
import { validatePasswordPolicy } from '@/lib/password'
import { normalizePhone } from '@/lib/phone'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'
import { AppError, Errors, toErrorResponse, rateLimitHeaders } from '@/lib/errors'

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return toErrorResponse(Errors.csrf())
    }

    const ip = getClientIp(req)
    const ipLimit = await checkRateLimit(`register:ip:${ip}`, 20, 60 * 1000)
    if (!ipLimit.allowed) {
      return Response.json(
        { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
        { status: 429, headers: rateLimitHeaders(ipLimit.resetAfterMs) },
      )
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 120) : ''
    const phone = normalizePhone(typeof body?.phone === 'string' ? body.phone : '')

    if (!email || !email.includes('@')) {
      throw Errors.validation({ email: 'Please enter a valid email address' })
    }
    const passwordProblem = validatePasswordPolicy(password)
    if (passwordProblem) {
      throw Errors.validation({ password: passwordProblem })
    }
    if (!phone) {
      throw Errors.validation({ phone: 'Please enter a valid mobile number' })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      throw Errors.conflict('An account with this email already exists')
    }
    const phoneTaken = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
    if (phoneTaken) {
      throw Errors.conflict('An account with this mobile number already exists')
    }

    // No email verification: new users are active immediately.
    let user
    try {
      user = await createUser(email, password, {
        ...(displayName ? { displayName } : {}),
        phone,
        emailVerified: true,
      })
    } catch (err: unknown) {
      // Unique race on email/phone between precheck and insert.
      if ((err as { code?: string })?.code === 'P2002') {
        throw Errors.conflict('An account with these details already exists')
      }
      throw err
    }

    // Every builder user needs a workspace — create it here so the first
    // builder visit never redirects anywhere (see also ensurePersonalWorkspace
    // on first builder visit for pre-existing users).
    await ensurePersonalWorkspace(user.id, user.displayName || email.split('@')[0] || 'My')

    // Notify active admins of the signup (plan Phase 2 hook; push deferred).
    try {
      const { notify } = await import('@/lib/notify')
      await notify({
        toAdmins: true,
        type: 'user.registered',
        title: { en: 'New user registered', ar: 'مستخدم جديد سجّل' },
        body: {
          en: `${user.displayName || user.email} just registered.`,
          ar: `${user.displayName || user.email} سجّل للتو.`,
        },
        link: `/admin/users/${user.id}`,
        dedupeKey: `user.registered:${user.id}`,
      })
      const { sendPushToAdmin } = await import('@/lib/send-push')
      void sendPushToAdmin('مستخدم جديد', `${user.displayName || user.email} سجل للتو`)
    } catch (err) {
      console.error('[auth/register] notify failed:', err)
    }

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken, Math.floor(SESSION_EXPIRES_IN / 1000))

    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    if (err instanceof AppError) return toErrorResponse(err)
    return toErrorResponse(err, 'Registration failed, please try again')
  }
}
