'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Extend (days prompt) / suspend / unsuspend a subscription.
export function SubscriptionActions({ subscriptionId, canceled }: { subscriptionId: string; canceled: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || 'Action failed')
        return
      }
      router.refresh()
    } catch {
      setError('Action failed')
    } finally {
      setBusy(null)
    }
  }

  const extend = async () => {
    const days = window.prompt('Extend by how many days?', '30')
    if (days === null) return
    await call('extend', { days: Number(days) })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled={busy !== null} onClick={extend}>
        {busy === 'extend' ? '…' : 'Extend'}
      </Button>
      {canceled ? (
        <Button variant="secondary" disabled={busy !== null} onClick={() => call('unsuspend')}>
          {busy === 'unsuspend' ? '…' : 'Unsuspend'}
        </Button>
      ) : (
        <Button variant="secondary" disabled={busy !== null} onClick={() => call('suspend')}>
          {busy === 'suspend' ? '…' : 'Suspend'}
        </Button>
      )}
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  )
}
