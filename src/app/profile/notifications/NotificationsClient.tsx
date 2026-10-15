'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/components/I18nProvider'

interface NotificationItem {
  id: string
  type: string
  title: unknown
  body: unknown
  link?: string | null
  isRead: boolean
  createdAt: string
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

export function NotificationsClient() {
  const { lang } = useI18n()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/me/notifications${unreadOnly ? '?unread=true' : ''}`)
      const data = await res.json().catch(() => null)
      if (!data?.ok) {
        setError('Failed to load notifications')
        return
      }
      setItems(data.items || [])
    } catch {
      setError('Failed to load notifications')
    }
  }, [unreadOnly])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/me/notifications${unreadOnly ? '?unread=true' : ''}`)
        const data = await res.json().catch(() => null)
        if (cancelled) return
        if (!data?.ok) {
          setError('Failed to load notifications')
          return
        }
        setItems(data.items || [])
      } catch {
        if (!cancelled) setError('Failed to load notifications')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [unreadOnly])

  const markAll = async () => {
    setBusy(true)
    try {
      await fetch('/api/me/notifications/read-all', { method: 'POST' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const markOne = async (id: string) => {
    await fetch(`/api/me/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
    await load()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setUnreadOnly((v) => !v)}>
            {unreadOnly ? 'Show all' : 'Unread only'}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={markAll}>
            {busy ? '…' : 'Mark all read'}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {items.length === 0 ? (
        <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={`p-3 ${item.isRead ? 'opacity-70' : ''}`}>
              <button onClick={() => markOne(item.id)} className="w-full text-left space-y-1">
                <p className="text-sm font-medium">{pickText(item.title, lang)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{pickText(item.body, lang)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {item.type} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
