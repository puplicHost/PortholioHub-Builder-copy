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
  isRead?: boolean
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

// Notification bell: badge from unread-count (DB truth) fetched on mount and
// refreshed on focus + every 60 s. Panel lists the latest 10, marks all read
// on open. Clicking an item marks it read individually.
export function NotificationBell() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
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

  // Badge truth from mount: poll + refetch on window focus regardless of open state.
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60 * 1000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  // Fetch latest items + mark all read when the panel opens.
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
      try {
        await fetch('/api/me/notifications/read-all', { method: 'POST' })
      } catch {
        // ignore
      }
      if (!cancelled) refresh()
    })()
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, refresh])

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
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] cursor-pointer"
        aria-label={ar ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={ar ? 'الإشعارات' : 'Notifications'}
          className="absolute right-0 rtl:right-auto rtl:left-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {items.length === 0 && (
              <p className="text-xs text-center py-6 text-[var(--color-text-muted)]">
                {ar ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className="w-full text-start rounded-lg p-2 min-h-[44px] hover:bg-[var(--color-surface-secondary)] cursor-pointer flex items-start gap-2"
              >
                {!item.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium truncate">{pickText(item.title, lang)}</span>
                  <span className="block text-[10px] text-[var(--color-text-muted)]" dir="ltr">
                    <span className="block text-end">{new Date(item.createdAt).toLocaleString()}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/profile/notifications"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center justify-center border-t border-[var(--color-border)] p-2 text-center text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            {ar ? 'عرض الكل' : 'View all'}
          </Link>
        </div>
      )}
    </div>
  )
}
