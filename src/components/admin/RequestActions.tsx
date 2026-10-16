'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AdminModal } from './AdminModal'

interface RequestActionsProps {
  requestId: string
  defaultAmount?: number
}

// Approve (amount + optional reference/note) / reject (reason required) with styled modals & toasts.
export function RequestActions({ requestId, defaultAmount }: RequestActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '')
  const [reference, setReference] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      toast('error', 'Please enter a valid amount')
      return
    }

    setBusy('approve')
    try {
      const res = await fetch(`/api/admin/subscription-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountEgp: numericAmount,
          reference: reference.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to approve request')
        return
      }
      toast('success', 'Subscription request approved successfully')
      setApproveOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error while approving request')
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectReason.trim()) {
      toast('error', 'A rejection reason is required')
      return
    }

    setBusy('reject')
    try {
      const res = await fetch(`/api/admin/subscription-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to reject request')
        return
      }
      toast('success', 'Subscription request rejected')
      setRejectOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error while rejecting request')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy !== null}
          onClick={() => {
            if (defaultAmount && !amount) setAmount(String(defaultAmount))
            setApproveOpen(true)
          }}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={busy !== null}
          onClick={() => setRejectOpen(true)}
        >
          Reject
        </Button>
      </div>

      {/* Approve Modal */}
      <AdminModal
        isOpen={approveOpen}
        onClose={() => !busy && setApproveOpen(false)}
        title="Approve subscription request"
        description="Verify the offline payment and confirm subscription activation."
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <Input
            label="Confirmed amount (EGP)"
            type="number"
            min={0}
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
          />
          <Input
            label="Payment reference (optional)"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Vodafone Cash / InstaPay txn ID..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={busy === 'approve'}
            >
              Confirm approval
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Reject Modal */}
      <AdminModal
        isOpen={rejectOpen}
        onClose={() => !busy && setRejectOpen(false)}
        title="Reject subscription request"
        description="Provide a reason for rejection. This will be recorded in the audit log."
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`reject-reason-${requestId}`}
              className="text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Rejection reason <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              id={`reject-reason-${requestId}`}
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Payment not received, wrong amount transfer..."
              className="w-full rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={busy === 'reject'}
            >
              Reject request
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
