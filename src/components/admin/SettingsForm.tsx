'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SettingItem {
  key: string
  value: unknown
  description: string
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  return ''
}

function fromText(key: string, raw: string): unknown {
  if (key === 'subscription.reminderDays') {
    return raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
  }
  if (key === 'subscription.graceDays') return Number(raw)
  return raw
}

// One row per registry key: text/number editing with server validation.
export function SettingsForm({ items }: { items: SettingItem[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.key, toText(i.value)])),
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (key: string) => {
    setSaving(key)
    setMessage(null)
    setError(null)
    const raw = values[key] ?? ''
    const def = items.find((i) => i.key === key)
    const value = fromText(key, raw)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || `Failed to save ${def?.key}`)
        return
      }
      setMessage(`Saved ${key}`)
    } catch {
      setError(`Failed to save ${key}`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-3">
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-mono font-medium">{item.key}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={values[item.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
              className="flex-1"
            />
            <Button variant="secondary" disabled={saving !== null} onClick={() => save(item.key)}>
              {saving === item.key ? '…' : 'Save'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
