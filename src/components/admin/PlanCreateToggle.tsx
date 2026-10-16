'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlanForm } from './PlanForm'

export function PlanCreateToggle() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Subscription plans</h2>
          <p className="text-xs text-[var(--color-text-muted)]">Configure available plans, pricing, and active status.</p>
        </div>
        <Button
          variant={open ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <>
              <X className="h-4 w-4" />
              Close form
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New plan
            </>
          )}
        </Button>
      </div>

      {open && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150">
          <PlanForm />
        </div>
      )}
    </div>
  )
}
