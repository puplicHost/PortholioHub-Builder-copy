import { getAdminMessaging } from './firebase-admin'

export const ADMIN_FCM_TOPIC = 'admin-notifications'

// Best-effort admin broadcast. Never throws — push is a non-critical path and
// must not break the mutating request that triggered it.
export async function sendPushToAdmin(title: string, body: string): Promise<void> {
  const messaging = getAdminMessaging()
  if (!messaging) return
  try {
    await messaging.send({
      topic: ADMIN_FCM_TOPIC,
      notification: { title, body },
    })
  } catch (e) {
    console.error('FCM push failed:', e)
  }
}
