import { deleteSession } from '@/lib/auth'
import { clearSessionCookie, readSessionCookie } from '@/lib/session-cookie'

export async function POST() {
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
