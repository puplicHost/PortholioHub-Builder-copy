// Firebase Cloud Messaging service worker (compat build).
// Receives background push for the 'admin-notifications' topic and shows a
// system notification. Public web config values only — safe to expose.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyB_iGofl6_nNdSFcjFgR2rWvxDqkPwkLG4',
  authDomain: 'business-7c5c4.firebaseapp.com',
  projectId: 'business-7c5c4',
  storageBucket: 'business-7c5c4.firebasestorage.app',
  messagingSenderId: '48603673777',
  appId: '1:48603673777:web:c07637ad7a25eb33bf5e90',
})

const messaging = firebase.messaging()

// Notification payloads are displayed automatically by the SDK; this also
// covers data-only messages so nothing is missed.
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  const title = notification.title || 'PortfolioHub'
  const body = notification.body || ''
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.png',
    badge: '/favicon.png',
  })
})
