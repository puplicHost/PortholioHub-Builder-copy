'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

interface BellItem {
  id: string
  type: string
  title: unknown
  createdAt: string
  link?: string | null
}

function pickText(value: unknown, lang: string): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    const preferred = v[lang]
    if (typeof preferred === 'string' && preferred) return preferred
    if (typeof v.en === 'string') return v.en
    if (typeof v.ar === 'string') return v.ar
  }
  return ''
}

// Notification bell: badge from unread-count (DB truth), dropdown of the
// latest 10, refresh on focus + every 60 s. Clicking an item marks it read.
export function NotificationBell() {
  const { lang } = useI18n()
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<BellItem[]>([])
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/me/notifications/unread-count')
      const data = await res.json().catch(() => null)
      if (data?.ok) setUnread(data.unread)
    } catch {
      // bell must never break the page
    }
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/me/notifications/unread-count')
        const data = await res.json().catch(() => null)
        if (!cancelled && data?.ok) setUnread(data.unread)
      } catch {
        // bell must never break the page
      }
    })()
    const timer = setInterval(refresh, 60 * 1000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh, open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/me/notifications?pageSize=10')
        const data = await res.json().catch(() => null)
        if (!cancelled && data?.ok) setItems(data.items || [])
      } catch {
        // ignore
      }
    })()
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => {
      cancelled = true
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const openItem = async (item: BellItem) => {
    try {
      await fetch(`/api/me/notifications/${item.id}/read`, { method: 'POST' })
    } catch {
      // ignore
    }
    setOpen(false)
    refresh()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {items.length === 0 && (
              <p className="text-xs text-center py-6 text-[var(--color-text-muted)]">No notifications</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className="w-full text-left rounded-lg p-2 hover:bg-[var(--color-surface-secondary)]"
              >
                <p className="text-xs font-medium truncate">{pickText(item.title, lang)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
          <Link
            href="/profile/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--color-border)] p-2 text-center text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
