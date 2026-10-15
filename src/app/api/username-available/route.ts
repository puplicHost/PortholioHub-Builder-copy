import { prisma } from '@/lib/prisma'
import { validateUsername } from '@/lib/portfolio'

// GET /api/username-available?username=… → { available: true } or
// { available: false, reason }. Rate-limited by middleware? No —
// unauthenticated by design (used pre-signup); abuse contained by the
// absence of writes (single indexed lookup).
export async function GET(req: Request) {
  const username = (new URL(req.url).searchParams.get('username') || '').toLowerCase().trim()

  const problem = validateUsername(username)
  if (problem) {
    return Response.json({ available: false, reason: problem })
  }

  try {
    const existing = await prisma.userProfile.findUnique({
      where: { username },
      select: { id: true },
    })
    if (existing) {
      return Response.json({ available: false, reason: 'Username is already taken' })
    }
    return Response.json({ available: true })
  } catch (err) {
    console.error('[username-available]', err)
    return Response.json({ available: false, reason: 'Lookup failed, please try again' })
  }
}
