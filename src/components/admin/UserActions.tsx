'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Per-user admin actions (suspend / unsuspend / reset password / revoke).
// The temporary password is shown ONCE and never stored.
export function UserActions({ userId, status }: { userId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const call = async (action: string, options?: { reason?: string }) => {
    setBusy(action)
    setError(null)
    setTempPassword(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || 'Action failed')
        return
      }
      if (data?.tempPassword) setTempPassword(data.tempPassword)
      router.refresh()
    } catch {
      setError('Action failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === 'SUSPENDED' ? (
          <Button variant="secondary" disabled={busy !== null} onClick={() => call('unsuspend')}>
            {busy === 'unsuspend' ? '…' : 'Unsuspend'}
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy !== null} onClick={() => call('suspend')}>
            {busy === 'suspend' ? '…' : 'Suspend'}
          </Button>
        )}
        <Button variant="secondary" disabled={busy !== null} onClick={() => call('reset-password')}>
          {busy === 'reset-password' ? '…' : 'Reset password'}
        </Button>
        <Button variant="secondary" disabled={busy !== null} onClick={() => call('revoke-sessions')}>
          {busy === 'revoke-sessions' ? '…' : 'Revoke sessions'}
        </Button>
      </div>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {tempPassword && (
        <p className="text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
          Temporary password (shown once — copy now):{' '}
          <code className="font-mono font-bold select-all">{tempPassword}</code>
        </p>
      )}
    </div>
  )
}
