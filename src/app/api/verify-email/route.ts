import { NextResponse } from 'next/server'
import { validateEmailVerificationToken, verifyUserEmail } from '@/lib/auth'
import { getAppUrl } from '@/lib/urls'

// GET /api/verify-email?token=… — completes email verification, then
// sends the user to the builder (session cookie is already set at register).
export async function GET(req: Request) {
  const base = getAppUrl()
  const token = new URL(req.url).searchParams.get('token') || ''

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', base))
  }

  try {
    const userId = await validateEmailVerificationToken(token)
    if (!userId) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', base))
    }
    await verifyUserEmail(userId)
    return NextResponse.redirect(new URL('/profile/builder?verified=1', base))
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.redirect(new URL('/login?error=invalid_token', base))
  }
}
