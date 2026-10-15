'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Approve (amount + optional reference/note) / reject (reason required).
export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const call = async (action: 'approve' | 'reject', payload: Record<string, unknown>) => {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch(`/api/admin/subscription-requests/${requestId}/${action}`, {
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

  const approve = async () => {
    const amount = window.prompt('Confirmed amount in EGP (e.g. 500):')
    if (amount === null) return
    const reference = window.prompt('Payment reference (optional):') || ''
    await call('approve', { amountEgp: Number(amount), reference })
  }

  const reject = async () => {
    const reason = window.prompt('Rejection reason (required):')
    if (!reason) return
    await call('reject', { reason })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled={busy !== null} onClick={approve}>
        {busy === 'approve' ? '…' : 'Approve'}
      </Button>
      <Button variant="secondary" disabled={busy !== null} onClick={reject}>
        {busy === 'reject' ? '…' : 'Reject'}
      </Button>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  )
}
