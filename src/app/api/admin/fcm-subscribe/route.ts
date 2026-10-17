import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { getAdminMessaging } from '@/lib/firebase-admin'
import { ADMIN_FCM_TOPIC } from '@/lib/send-push'

// POST /api/admin/fcm-subscribe { token } — register an admin browser's FCM
// token and subscribe it to the shared admin topic.
export async function POST(req: Request) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!token || token.length > 4096) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'A valid FCM token is required' }, { status: 400 })
  }

  // Persist the token (idempotent) so it survives and can be re-targeted later.
  await prisma.fcmToken.upsert({
    where: { token },
    update: { userId: gate.adminId },
    create: { userId: gate.adminId, token },
  })

  const messaging = getAdminMessaging()
  if (messaging) {
    try {
      await messaging.subscribeToTopic(token, ADMIN_FCM_TOPIC)
    } catch (err) {
      console.error('[admin/fcm-subscribe] subscribeToTopic failed:', err)
    }
  }

  return Response.json({ ok: true })
}
