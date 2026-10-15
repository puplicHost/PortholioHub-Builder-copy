'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Activate/deactivate + delete (delete refused when subscriptions exist).
export function PlanActions({ planId, isActive }: { planId: string; isActive: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const patch = async (body: Record<string, unknown>, label: string) => {
    setBusy(label)
    setError(null)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const remove = async () => {
    if (!window.confirm('Delete this plan? Only plans without subscriptions can be deleted.')) return
    setBusy('delete')
    setError(null)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' })
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

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" disabled={busy !== null} onClick={() => patch({ isActive: !isActive }, 'toggle')}>
        {busy === 'toggle' ? '…' : isActive ? 'Deactivate' : 'Activate'}
      </Button>
      <Button variant="secondary" disabled={busy !== null} onClick={remove}>
        {busy === 'delete' ? '…' : 'Delete'}
      </Button>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  )
}
