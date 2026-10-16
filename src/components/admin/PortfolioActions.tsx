'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AdminModal, AdminConfirmModal } from './AdminModal'

interface PortfolioActionsProps {
  username: string
  hidden: boolean
}

// Hide (modal with reason) / unhide a portfolio with toasts.
export function PortfolioActions({ username, hidden }: PortfolioActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [hideOpen, setHideOpen] = useState(false)
  const [unhideOpen, setUnhideOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (action: 'hide' | 'unhide', actionReason?: string, successMsg?: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/portfolios/${username}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionReason !== undefined ? { reason: actionReason } : {}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Action failed')
        return
      }
      toast('success', successMsg || 'Portfolio status updated')
      router.refresh()
    } catch {
      toast('error', 'Network error while updating portfolio')
    } finally {
      setBusy(false)
    }
  }

  const handleHide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast('error', 'A reason is required to hide a portfolio')
      return
    }
    await run('hide', reason.trim(), `Portfolio /u/${username} is now hidden`)
    setHideOpen(false)
    setReason('')
  }

  const handleUnhide = async () => {
    await run('unhide', undefined, `Portfolio /u/${username} is now visible`)
    setUnhideOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {hidden ? (
          <Button
            variant="secondary"
            size="sm"
            title="Restore public visibility for this portfolio"
            disabled={busy}
            onClick={() => setUnhideOpen(true)}
          >
            Unhide
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            title="Hide this portfolio from public view"
            disabled={busy}
            onClick={() => setHideOpen(true)}
          >
            Hide
          </Button>
        )}
      </div>

      {/* Hide Modal */}
      <AdminModal
        isOpen={hideOpen}
        onClose={() => !busy && setHideOpen(false)}
        title="Hide portfolio"
        description="Hide this portfolio from public discovery and search indexing."
      >
        <form onSubmit={handleHide} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`hide-reason-${username}`}
              className="text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Reason for hiding <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              id={`hide-reason-${username}`}
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Terms violation, inappropriate content, spam..."
              className="w-full rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setHideOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={busy}
            >
              Hide portfolio
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Unhide Confirmation Modal */}
      <AdminConfirmModal
        isOpen={unhideOpen}
        onClose={() => !busy && setUnhideOpen(false)}
        onConfirm={handleUnhide}
        title="Unhide portfolio"
        description={`Restore public visibility for /u/${username}?`}
        confirmText="Restore visibility"
        variant="primary"
        loading={busy}
      />
    </>
  )
}
