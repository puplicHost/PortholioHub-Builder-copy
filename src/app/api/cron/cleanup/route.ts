import { runSessionCleanup } from '@/lib/tasks/session-cleanup'
import { cleanupVisitDedups } from '@/lib/visits'

// Vercel Cron entry (see vercel.json, daily). Same Bearer protection
// pattern as the other cron routes. Runs session cleanup first, then
// visit-dedupe cleanup (dedup rows older than 2 days only).
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json(
      { code: 'CRON_DISABLED', message: 'Cron endpoint disabled (no CRON_SECRET set)' },
      { status: 503 },
    )
  }
  const auth = req.headers.get('authorization') || ''
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  try {
    const sessions = await runSessionCleanup()
    let dedups = { deleted: 0 }
    try {
      dedups = await cleanupVisitDedups()
    } catch (err) {
      // visit_dedups table missing pre-0006: sessions still cleaned.
      console.error('[cron/cleanup] visit-dedup cleanup skipped:', err)
    }
    return Response.json({ ok: true, sessions: sessions.deleted, dedups: dedups.deleted })
  } catch (err) {
    console.error('[cron/cleanup]', err)
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Cleanup failed' }, { status: 500 })
  }
}
