import { prisma } from '@/lib/prisma'

// Liveness probe (plan Phase 0 §50): 200 with DB status, 503 when the
// database is unreachable. No connection details leak into the response.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'ok', db: 'up' })
  } catch (err) {
    console.error('[api/health]', err)
    return Response.json({ status: 'degraded', db: 'down' }, { status: 503 })
  }
}
