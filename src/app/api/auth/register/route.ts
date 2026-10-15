import {
  createSession,
  createUser,
  getUserByEmail,
  SESSION_EXPIRES_IN,
} from '@/lib/auth'
import { setSessionCookie } from '@/lib/session-cookie'
import { ensurePersonalWorkspace } from '@/lib/workspaces'

const MIN_PASSWORD_LENGTH = 6

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim().slice(0, 120) : ''

    if (!email || !email.includes('@')) {
      return Response.json({ ok: false, error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return Response.json(
        { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 },
      )
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return Response.json({ ok: false, error: 'An account with this email already exists' }, { status: 409 })
    }

    // No email verification: new users are active immediately.
    const user = await createUser(email, password, {
      ...(displayName ? { displayName } : {}),
      emailVerified: true,
    })

    // Every builder user needs a workspace — create it here so the first
    // builder visit never redirects anywhere (see also ensurePersonalWorkspace
    // on first builder visit for pre-existing users).
    await ensurePersonalWorkspace(user.id, user.displayName || email.split('@')[0] || 'My')

    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken, Math.floor(SESSION_EXPIRES_IN / 1000))

    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[auth/register]', err)
    return Response.json({ ok: false, error: 'Registration failed, please try again' }, { status: 500 })
  }
}
