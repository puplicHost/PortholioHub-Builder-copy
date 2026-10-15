'use client'

import { useEffect, useRef } from 'react'

interface TrackBeaconProps {
  username: string
  eventType: 'page_view' | 'project_view' | 'whatsapp_click'
  projectSlug?: string
}

// Fire-and-forget view ping. Runs after page load, response ignored,
// never blocks render. Safe under StrictMode (guarded single send).
// Session-deduped: one counted view per visitor per profile per tab
// session — F5 refreshes do not insert new rows. WhatsApp clicks sent
// via trackPortfolioEvent are intentionally NOT deduplicated.
export function TrackBeacon({ username, eventType, projectSlug }: TrackBeaconProps) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current || !username) return
    sent.current = true

    const storageKey =
      eventType === 'project_view'
        ? `pvp_${username}_${projectSlug ?? ''}`
        : `pv_${username}`

    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey)) {
        return
      }
    } catch {
      // storage unavailable — fall through and fire once (ref-guarded)
    }

    try {
      void fetch('/api/portfolio/track', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, eventType, projectSlug: projectSlug ?? null }),
      })
        .then(async (res) => {
          if (!res.ok) return
          const data = await res.json().catch(() => null)
          if (data && data.ok === true) {
            try {
              window.sessionStorage.setItem(storageKey, '1')
            } catch {
              // storage unavailable — single send already guarded by ref
            }
          }
        })
        .catch(() => {})
    } catch {
      // tracking must never break the page
    }
  }, [username, eventType, projectSlug])

  return null
}

// Imperative ping for click events (e.g. WhatsApp button) where no
// component mount happens. Uses keepalive so navigation doesn't cancel it.
export function trackPortfolioEvent(
  username: string,
  eventType: 'page_view' | 'project_view' | 'whatsapp_click',
  projectSlug?: string,
) {
  if (!username) return
  try {
    const payload = JSON.stringify({ username, eventType, projectSlug: projectSlug ?? null })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon('/api/portfolio/track', blob)) return
    }
    void fetch('/api/portfolio/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {})
  } catch {
    // tracking must never break the page
  }
}
