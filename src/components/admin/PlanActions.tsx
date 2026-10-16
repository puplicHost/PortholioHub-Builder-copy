'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AdminModal, AdminConfirmModal } from './AdminModal'

interface PlanActionsProps {
  planId: string
  isActive: boolean
  initialName?: string
  initialPriceEgp?: number
  initialDurationDays?: number
}

// Activate/deactivate + edit + delete with modals & toast.
export function PlanActions({
  planId,
  isActive,
  initialName = '',
  initialPriceEgp = 0,
  initialDurationDays = 30,
}: PlanActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // Edit form state
  const [name, setName] = useState(initialName)
  const [priceEgp, setPriceEgp] = useState(String(initialPriceEgp))
  const [durationDays, setDurationDays] = useState(String(initialDurationDays))

  const patch = async (body: Record<string, unknown>, label: string, successMsg?: string) => {
    setBusy(label)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Action failed')
        return false
      }
      toast('success', successMsg || (isActive ? 'Plan deactivated' : 'Plan activated'))
      router.refresh()
      return true
    } catch {
      toast('error', 'Network error while updating plan')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numPrice = Number(priceEgp)
    const numDays = Number(durationDays)
    if (!name.trim()) {
      toast('error', 'Plan name is required')
      return
    }
    if (!Number.isFinite(numPrice) || numPrice < 0) {
      toast('error', 'Price must be >= 0')
      return
    }
    if (!Number.isFinite(numDays) || numDays < 1) {
      toast('error', 'Duration must be at least 1 day')
      return
    }

    const ok = await patch(
      {
        name: name.trim(),
        priceEgp: numPrice,
        durationDays: numDays,
      },
      'edit',
      `Plan "${name}" updated successfully`
    )
    if (ok) setEditOpen(false)
  }

  const remove = async () => {
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to delete plan')
        return
      }
      toast('success', 'Plan deleted successfully')
      setDeleteOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error while deleting plan')
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
          title="Edit plan name, pricing, and duration"
          disabled={busy !== null}
          onClick={() => {
            setName(initialName)
            setPriceEgp(String(initialPriceEgp))
            setDurationDays(String(initialDurationDays))
            setEditOpen(true)
          }}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          title={isActive ? 'Deactivate this plan from new signups' : 'Activate this plan for subscriptions'}
          disabled={busy !== null}
          loading={busy === 'toggle'}
          onClick={() => patch({ isActive: !isActive }, 'toggle')}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          title="Permanently remove plan"
          disabled={busy !== null}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      {/* Edit Plan Modal */}
      <AdminModal
        isOpen={editOpen}
        onClose={() => !busy && setEditOpen(false)}
        title="Edit subscription plan"
        description="Update plan name, pricing, and active duration."
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Plan name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pro, Premium"
          />
          <Input
            label="Price (EGP)"
            type="number"
            min={0}
            required
            value={priceEgp}
            onChange={(e) => setPriceEgp(e.target.value)}
            placeholder="e.g. 500"
          />
          <Input
            label="Duration (days)"
            type="number"
            min={1}
            max={3650}
            required
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="e.g. 30"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={busy === 'edit'}
            >
              Save changes
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteOpen}
        onClose={() => !busy && setDeleteOpen(false)}
        onConfirm={remove}
        title="Delete plan"
        description="Are you sure you want to delete this plan? Only plans without any active or past subscriptions can be deleted."
        confirmText="Delete plan"
        variant="danger"
        loading={busy === 'delete'}
      />
    </>
  )
}
