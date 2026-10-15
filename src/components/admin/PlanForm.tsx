'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PlanFormValues {
  name: string
  priceEgp: string
  durationDays: string
}

// Create-plan form (edits go through the same API shape; keep this
// create-only to stay small — edits happen via activate/deactivate).
export function PlanForm() {
  const router = useRouter()
  const [values, setValues] = useState<PlanFormValues>({ name: '', priceEgp: '', durationDays: '30' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof PlanFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          priceEgp: Number(values.priceEgp),
          durationDays: Number(values.durationDays),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || 'Failed to create plan')
        return
      }
      setValues({ name: '', priceEgp: '', durationDays: '30' })
      router.refresh()
    } catch {
      setError('Failed to create plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 max-w-xl">
      <h2 className="text-sm font-semibold">New plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input placeholder="Name" value={values.name} onChange={set('name')} required />
        <Input placeholder="Price EGP" type="number" min={0} value={values.priceEgp} onChange={set('priceEgp')} required />
        <Input placeholder="Duration days" type="number" min={1} value={values.durationDays} onChange={set('durationDays')} required />
      </div>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? '…' : 'Create plan'}
      </Button>
    </form>
  )
}
