'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface PlanFormValues {
  name: string
  priceEgp: string
  durationDays: string
}

// Create-plan form with accessible labels & toast notifications.
export function PlanForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<PlanFormValues>({ name: '', priceEgp: '', durationDays: '30' })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof PlanFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          priceEgp: Number(values.priceEgp),
          durationDays: Number(values.durationDays),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to create plan')
        return
      }
      toast('success', `Plan "${values.name}" created successfully`)
      setValues({ name: '', priceEgp: '', durationDays: '30' })
      router.refresh()
    } catch {
      toast('error', 'Network error while creating plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">New subscription plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Plan name"
          placeholder="e.g. Pro, Premium"
          value={values.name}
          onChange={set('name')}
          required
        />
        <Input
          label="Price (EGP)"
          type="number"
          min={0}
          placeholder="e.g. 500"
          value={values.priceEgp}
          onChange={set('priceEgp')}
          required
        />
        <Input
          label="Duration (days)"
          type="number"
          min={1}
          placeholder="e.g. 30"
          value={values.durationDays}
          onChange={set('durationDays')}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          Create plan
        </Button>
      </div>
    </form>
  )
}
