import { deleteSession } from '@/lib/auth'
import { clearSessionCookie, readSessionCookie } from '@/lib/session-cookie'
import { isSameOriginRequest } from '@/lib/csrf'
import { Errors, toErrorResponse } from '@/lib/errors'

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return toErrorResponse(Errors.csrf())
  }
  try {
    const token = await readSessionCookie()
    if (token) {
      await deleteSession(token)
    }
  } catch (err) {
    console.error('[auth/logout]', err)
  }
  await clearSessionCookie()
  return Response.json({ ok: true })
}
