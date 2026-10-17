'use client'

import { useEffect } from 'react'

// Registers the admin browser for FCM push: requests permission, obtains an
// FCM token bound to the shared 'admin-notifications' topic (via the server
// route), and stores it. All failures are swallowed — push is best-effort.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function AdminFcmRegistrar() {
  useEffect(() => {
    let cancelled = false

    // Resolves once notification permission is 'granted'. When permission is
    // still 'default', browsers require a user gesture, so we wait for the
    // first interaction instead of giving up silently.
    function waitForPermission(): Promise<boolean> {
      if (typeof Notification === 'undefined') return Promise.resolve(false)
      if (Notification.permission === 'granted') return Promise.resolve(true)
      if (Notification.permission === 'denied') return Promise.resolve(false)

      return new Promise<boolean>((resolve) => {
        let settled = false
        const settle = (value: boolean) => {
          if (settled) return
          settled = true
          window.removeEventListener('pointerdown', onGesture)
          window.removeEventListener('keydown', onGesture)
          resolve(value)
        }
        async function onGesture() {
          try {
            const permission = await Notification.requestPermission()
            settle(permission === 'granted')
          } catch {
            settle(false)
          }
        }
        window.addEventListener('pointerdown', onGesture, { once: true })
        window.addEventListener('keydown', onGesture, { once: true })
      })
    }

    async function register() {
      try {
        if (typeof window === 'undefined') return
        if (!('serviceWorker' in navigator) || !('Notification' in window)) return
        if (!VAPID_KEY || !FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
          console.info(
            '[admin/fcm] skipped: missing NEXT_PUBLIC_FIREBASE_* configuration (VAPID/apiKey/projectId).',
          )
          return
        }

        const granted = await waitForPermission()
        if (!granted || cancelled) return

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

        const [{ initializeApp, getApps, getApp }, { getMessaging, getToken, isSupported }] =
          await Promise.all([import('firebase/app'), import('firebase/messaging')])

        const supported = await isSupported().catch(() => false)
        if (!supported || cancelled) return

        const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)

        const messaging = getMessaging(app)
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        })
        if (!token || cancelled) return

        await fetch('/api/admin/fcm-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      } catch (err) {
        console.warn('[admin/fcm] registration skipped:', err)
      }
    }

    void register()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
