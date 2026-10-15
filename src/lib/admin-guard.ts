import { getCurrentUser } from '@/lib/auth'

// Guard for /api/admin/** routes. Returns the admin user or a 403 JSON.
// Client errors use the unified shape; this helper keeps every admin
// route to a single call at the top.
export async function requireAdminApi(): Promise<
  | { ok: true; adminId: string }
  | { ok: false; response: Response }
> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      ok: false,
      response: Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 }),
    }
  }
  if (!user.isAdmin) {
    return {
      ok: false,
      response: Response.json({ code: 'FORBIDDEN', message: 'Admin only' }, { status: 403 }),
    }
  }
  return { ok: true, adminId: user.id }
}
