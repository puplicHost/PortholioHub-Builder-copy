import { runLifecycle } from '@/lib/tasks/subscription-lifecycle'

// Vercel Cron entry (see vercel.json, daily). Same Bearer protection
// pattern as session-cleanup.
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
    const result = await runLifecycle()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/subscription-lifecycle]', err)
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Lifecycle failed' }, { status: 500 })
  }
}
