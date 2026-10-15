import { getCurrentUser } from '@/lib/auth'
import { AppError, toErrorResponse } from '@/lib/errors'

// Session-backed profile for the signed-in user (no subscription fields
// until Sprint C wires the subscription state).
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
    }
    return Response.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        mustChangePassword: user.mustChangePassword,
      },
    })
  } catch (err) {
    if (err instanceof AppError) return toErrorResponse(err)
    return toErrorResponse(err)
  }
}
