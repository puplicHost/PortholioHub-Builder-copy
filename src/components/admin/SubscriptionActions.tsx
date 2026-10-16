'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sliders } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AdminModal, AdminConfirmModal } from './AdminModal'

interface SubscriptionActionsProps {
  subscriptionId: string
  canceled: boolean
  currentStatus?: string
  expiresAt?: Date | string | null
}

// Extend (modal) / suspend (danger modal) / unsuspend / override status with toasts.
export function SubscriptionActions({
  subscriptionId,
  canceled,
  currentStatus = 'ACTIVE',
  expiresAt,
}: SubscriptionActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [extendOpen, setExtendOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)

  const [days, setDays] = useState('30')
  const [targetStatus, setTargetStatus] = useState(currentStatus || 'ACTIVE')
  const [customExpiresAt, setCustomExpiresAt] = useState(
    expiresAt ? new Date(expiresAt).toISOString().split('T')[0] : ''
  )
  const [overrideReason, setOverrideReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const call = async (endpoint: string, payload: Record<string, unknown> = {}, successMsg: string) => {
    setBusy(endpoint)
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || `Failed to update subscription`)
        return
      }
      toast('success', successMsg)
      router.refresh()
    } catch {
      toast('error', `Network error during update`)
    } finally {
      setBusy(null)
    }
  }

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault()
    const numDays = Number(days)
    if (!Number.isFinite(numDays) || numDays <= 0) {
      toast('error', 'Please enter a valid number of days')
      return
    }
    await call('extend', { days: numDays }, `Subscription extended by ${numDays} days`)
    setExtendOpen(false)
  }

  const handleSuspend = async () => {
    await call('suspend', {}, 'Subscription suspended')
    setSuspendOpen(false)
  }

  const handleUnsuspend = async () => {
    await call('unsuspend', {}, 'Subscription restored to active')
    setUnsuspendOpen(false)
  }

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    await call(
      'override',
      {
        status: targetStatus,
        expiresAt: customExpiresAt || undefined,
        reason: overrideReason,
      },
      `Subscription status updated to ${targetStatus}`
    )
    setOverrideOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          title="Extend subscription duration"
          disabled={busy !== null}
          onClick={() => setExtendOpen(true)}
        >
          Extend
        </Button>
        {canceled ? (
          <Button
            variant="secondary"
            size="sm"
            title="Restore subscription to active status"
            disabled={busy !== null}
            onClick={() => setUnsuspendOpen(true)}
          >
            Unsuspend
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            title="Suspend subscription access"
            disabled={busy !== null}
            onClick={() => setSuspendOpen(true)}
          >
            Suspend
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          title="Manual status override"
          disabled={busy !== null}
          onClick={() => {
            setTargetStatus(currentStatus || 'ACTIVE')
            setOverrideOpen(true)
          }}
          className="px-2"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ms-1">Override</span>
        </Button>
      </div>

      {/* Extend Modal */}
      <AdminModal
        isOpen={extendOpen}
        onClose={() => !busy && setExtendOpen(false)}
        title="Extend subscription"
        description="Add additional active days to this user's subscription period."
      >
        <form onSubmit={handleExtend} className="space-y-4">
          <Input
            label="Extension (days)"
            type="number"
            min={1}
            step="1"
            required
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="e.g. 30"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setExtendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={busy === 'extend'}
            >
              Extend subscription
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Override Modal */}
      <AdminModal
        isOpen={overrideOpen}
        onClose={() => !busy && setOverrideOpen(false)}
        title="Subscription Status Override"
        description="Directly modify lifecycle state and expiration date for administrative intervention."
      >
        <form onSubmit={handleOverride} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Subscription Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="ACTIVE">ACTIVE (Full access)</option>
              <option value="SUSPENDED">SUSPENDED (Paused)</option>
              <option value="EXPIRED">EXPIRED (Expired period)</option>
              <option value="TRIAL">TRIAL (Evaluation)</option>
              <option value="CANCELED">CANCELED (Permanently ended)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Expiration Date (optional override)
            </label>
            <Input
              type="date"
              value={customExpiresAt}
              onChange={(e) => setCustomExpiresAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Administrative Reason (logged in audit trail)
            </label>
            <Input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Granted courtesy extension or customer dispute resolution"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setOverrideOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={busy === 'override'}
            >
              Save Override
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Suspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={suspendOpen}
        onClose={() => !busy && setSuspendOpen(false)}
        onConfirm={handleSuspend}
        title="Suspend subscription"
        description="Are you sure you want to suspend this subscription? The user's paid benefits will be immediately paused."
        confirmText="Suspend subscription"
        variant="danger"
        loading={busy === 'suspend'}
      />

      {/* Unsuspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={unsuspendOpen}
        onClose={() => !busy && setUnsuspendOpen(false)}
        onConfirm={handleUnsuspend}
        title="Unsuspend subscription"
        description="Restore this subscription back to active status?"
        confirmText="Restore subscription"
        variant="primary"
        loading={busy === 'unsuspend'}
      />
    </>
  )
}
