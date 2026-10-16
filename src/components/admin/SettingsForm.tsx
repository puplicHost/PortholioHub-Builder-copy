'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, CreditCard, MessageSquare, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

interface SettingItem {
  key: string
  value: unknown
  description: string
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  return ''
}

function fromText(key: string, raw: string): unknown {
  if (key === 'subscription.reminderDays') {
    return raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
  }
  if (key === 'subscription.graceDays') return Number(raw)
  return raw
}

interface GroupDef {
  id: string
  title: string
  description: string
  icon: typeof Globe
  matcher: (key: string) => boolean
}

const GROUPS: GroupDef[] = [
  {
    id: 'platform',
    title: 'Platform and branding',
    description: 'General system settings, brand name, and public display preferences.',
    icon: Globe,
    matcher: (k) => k.startsWith('platform.'),
  },
  {
    id: 'billing',
    title: 'Billing and subscriptions',
    description: 'Subscription policy rules, grace periods, and expiration reminder schedules.',
    icon: CreditCard,
    matcher: (k) => k.startsWith('subscription.'),
  },
  {
    id: 'contact',
    title: 'Contact and support channels',
    description: 'Public contact channels and WhatsApp integration numbers for customer support.',
    icon: MessageSquare,
    matcher: (k) => k.startsWith('contact.'),
  },
]

export function SettingsForm({ items }: { items: SettingItem[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const initialValues = Object.fromEntries(items.map((i) => [i.key, toText(i.value)]))
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState(false)

  // Compute dirty keys
  const dirtyKeys = items
    .filter((item) => (values[item.key] ?? '') !== (initialValues[item.key] ?? ''))
    .map((item) => item.key)

  const hasDirty = dirtyKeys.length > 0

  const handleDiscard = () => {
    setValues(initialValues)
    toast('info', 'Changes reverted')
  }

  const handleSaveAll = async () => {
    if (!hasDirty) return
    setSaving(true)

    try {
      let failedCount = 0
      for (const key of dirtyKeys) {
        const raw = values[key] ?? ''
        const value = fromText(key, raw)
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) {
          failedCount++
        }
      }

      if (failedCount === 0) {
        toast('success', `Saved ${dirtyKeys.length} ${dirtyKeys.length === 1 ? 'setting' : 'settings'} successfully`)
        router.refresh()
      } else {
        toast('error', `Some settings failed to save (${failedCount} error${failedCount > 1 ? 's' : ''})`)
      }
    } catch {
      toast('error', 'Network error while saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {GROUPS.map((group) => {
        const groupItems = items.filter((i) => group.matcher(i.key))
        if (groupItems.length === 0) return null
        const Icon = group.icon

        return (
          <Card key={group.id} className="p-5 space-y-4">
            <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3.5">
              <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{group.title}</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{group.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {groupItems.map((item) => {
                const isModified = (values[item.key] ?? '') !== (initialValues[item.key] ?? '')
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`setting-${item.key}`}
                        className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-2"
                      >
                        <code>{item.key}</code>
                        {isModified && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" title="Modified" />
                        )}
                      </label>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{item.description}</span>
                    </div>
                    <Input
                      id={`setting-${item.key}`}
                      value={values[item.key] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      className={isModified ? 'border-[var(--color-warning)] focus:ring-[var(--color-warning)]' : ''}
                    />
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      {/* Sticky Save Bar */}
      <div
        className={`fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-30 transition-all duration-200 ${
          hasDirty
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-warning)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-text-primary)]">
              {dirtyKeys.length} unsaved {dirtyKeys.length === 1 ? 'change' : 'changes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={handleDiscard}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSaveAll}
            >
              <Save className="h-3.5 w-3.5" />
              Save all changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
