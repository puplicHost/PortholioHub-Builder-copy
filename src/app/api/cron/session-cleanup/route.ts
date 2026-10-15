import { runSessionCleanup } from '@/lib/tasks/session-cleanup'

// Vercel Cron entry (see vercel.json). Protected by CRON_SECRET:
// Vercel sends no auth by default, so the secret check is mandatory.
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
    const result = await runSessionCleanup()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/session-cleanup]', err)
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Cleanup failed' }, { status: 500 })
  }
}
