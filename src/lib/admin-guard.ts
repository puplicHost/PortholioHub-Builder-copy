import { getCurrentUser } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/csrf'

// Guard for /api/admin/** routes. Returns the admin user or a 403 JSON.
// Client errors use the unified shape; this helper keeps every admin
// route to a single call at the top.
//
// When called with the request (state-changing routes), it ALSO enforces a
// same-origin check for non-GET/HEAD methods (CSRF defense-in-depth). Requests
// without an Origin header (curl/server-to-server) pass, matching csrf.ts.
export async function requireAdminApi(req?: Request): Promise<
  | { ok: true; adminId: string }
  | { ok: false; response: Response }
> {
  if (req && req.method !== 'GET' && req.method !== 'HEAD' && !isSameOriginRequest(req)) {
    return {
      ok: false,
      response: Response.json({ code: 'CSRF', message: 'Cross-origin request rejected' }, { status: 403 }),
    }
  }
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
