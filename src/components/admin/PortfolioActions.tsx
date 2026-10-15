'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Hide (reason required) / unhide a portfolio by username.
export function PortfolioActions({ username, hidden }: { username: string; hidden: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: 'hide' | 'unhide', reason?: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/portfolios/${username}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reason !== undefined ? { reason } : {}),
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
      setBusy(false)
    }
  }

  const hide = async () => {
    const reason = window.prompt('Reason for hiding (required, shown in audit log):')
    if (!reason) return
    await run('hide', reason)
  }

  return (
    <div className="flex items-center gap-2">
      {hidden ? (
        <Button variant="secondary" disabled={busy} onClick={() => run('unhide')}>
          {busy ? '…' : 'Unhide'}
        </Button>
      ) : (
        <Button variant="secondary" disabled={busy} onClick={hide}>
          {busy ? '…' : 'Hide'}
        </Button>
      )}
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  )
}
