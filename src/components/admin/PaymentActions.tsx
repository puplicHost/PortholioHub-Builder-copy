'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AdminModal } from './AdminModal'

interface PaymentActionsProps {
  paymentId: string
  status: string
  userId: string
  amountEgp: number
  provider: string
}

export function PaymentActions({
  paymentId,
  status,
  userId,
  amountEgp,
  provider,
}: PaymentActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to confirm payment')
        return
      }
      toast('success', `Payment of ${amountEgp} EGP confirmed and verified`)
      setConfirmOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error confirming payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {status === 'PENDING' && (
          <Button
            variant="primary"
            size="sm"
            title="Verify and confirm receipt of payment"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1 !bg-emerald-600 hover:!bg-emerald-700 text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Confirm</span>
          </Button>
        )}

        <Link
          href={`/admin/users/${userId}`}
          title="View user details and account history"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] transition-colors"
        >
          <User className="h-3 w-3 text-[var(--color-text-muted)]" />
          <span>User</span>
        </Link>
      </div>

      <AdminModal
        isOpen={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        title="Confirm Payment"
        description={`Manually confirm receipt of ${amountEgp} EGP via ${provider}. Any connected subscription will be activated automatically.`}
      >
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <strong>Verification Checklist:</strong> Verify that the transfer appears in your bank/InstaPay/Vodafone Cash statement before confirming.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Internal Reference / Note (Optional)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. InstaPay transaction ref #98327"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              className="!bg-emerald-600 hover:!bg-emerald-700 text-white"
            >
              Verify & Confirm Payment
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
