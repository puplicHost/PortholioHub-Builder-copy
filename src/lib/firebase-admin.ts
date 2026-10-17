import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'

// Firebase Admin is initialised lazily so the app boots even when the service
// account credentials are not configured (push simply becomes a no-op).
let cachedApp: App | null = null

function ensureApp(): App | null {
  if (getApps().length) return getApps()[0] ?? null

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) return null

  try {
    cachedApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
    return cachedApp
  } catch (err) {
    console.error('[firebase-admin] initialisation failed:', err)
    return null
  }
}

// Returns a Messaging instance, or null when credentials are absent/invalid.
export function getAdminMessaging(): Messaging | null {
  const app = ensureApp()
  if (!app) return null
  try {
    return getMessaging(app)
  } catch (err) {
    console.error('[firebase-admin] getMessaging failed:', err)
    return null
  }
}
