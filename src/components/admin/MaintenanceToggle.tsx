'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { AdminConfirmModal } from './AdminModal'

interface MaintenanceToggleProps {
  initialEnabled: boolean
}

export function MaintenanceToggle({ initialEnabled }: MaintenanceToggleProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [enabled, setEnabled] = useState(initialEnabled)
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleToggle = async (targetState: boolean) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to update maintenance mode')
        return
      }
      setEnabled(targetState)
      toast(
        targetState ? 'warning' : 'success',
        targetState
          ? 'Platform Maintenance Mode is now ENABLED'
          : 'Platform Maintenance Mode has been DISABLED'
      )
      setModalOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error updating maintenance mode')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card
        className={`p-5 transition-colors ${
          enabled
            ? 'border-[var(--color-danger)]/50 bg-[var(--color-danger)]/10'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span
              className={`p-2.5 rounded-xl shrink-0 ${
                enabled
                  ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {enabled ? (
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              ) : (
                <Wrench className="h-5 w-5" />
              )}
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Platform Maintenance Mode
                </h3>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    enabled
                      ? 'bg-[var(--color-danger)] text-white'
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {enabled ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Live / Normal
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xl">
                When enabled, public visitors and users will see a maintenance notice. Administrators remain authenticated and can continue accessing operations.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {enabled ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => handleToggle(false)}
                className="!bg-emerald-600 hover:!bg-emerald-700 text-white"
              >
                Disable Maintenance Mode
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => setModalOpen(true)}
              >
                Enable Maintenance Mode
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AdminConfirmModal
        isOpen={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        onConfirm={() => handleToggle(true)}
        title="Enable Platform Maintenance Mode"
        description="Are you sure you want to put PortfolioHub into maintenance mode? Freelancers may experience interrupted builder sessions while maintenance is active."
        confirmText="Enable maintenance"
        variant="danger"
        loading={busy}
      />
    </>
  )
}
