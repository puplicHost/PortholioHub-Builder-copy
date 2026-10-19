/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface ContactEditorProps {
  sectionId: string
  content: any
  updateSectionContent: (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => void
  updateSectionContentRaw: (sectionId: string, field: string, value: any) => void
  FormCard: any
  ItemCard: any
  AddActionCard: any
  IconPicker: any
}

const LINK_TYPES = [
  'whatsapp',
  'phone',
  'email',
  'linkedin',
  'facebook',
  'instagram',
  'x',
  'behance',
  'github',
  'website',
]

function newItem() {
  return {
    id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: 'website',
    value: '',
    label: '',
  }
}

export function ContactEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  ItemCard,
  AddActionCard,
  IconPicker,
}: ContactEditorProps) {
  const c = content || {}
  const items: any[] = c.links || []

  const setItems = (next: any[]) => updateSectionContentRaw(sectionId, 'links', next)

  const updateItem = (idx: number, patch: any) => {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    setItems(next)
  }

  const moveItem = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    setItems(next)
  }

  return (
    <div className="space-y-6">
      <FormCard title="Section Content" subtitle="Heading for the contact block">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              Heading (EN)
            </label>
            <Input
              value={c.title?.en || ''}
              onChange={(e) => updateSectionContent(sectionId, 'title', 'en', e.target.value)}
              className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
            />
          </div>
          <div dir="rtl">
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              العنوان (AR)
            </label>
            <Input
              value={c.title?.ar || ''}
              onChange={(e) => updateSectionContent(sectionId, 'title', 'ar', e.target.value)}
              className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-right text-[15px]"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
            Section Icon
          </label>
          <IconPicker
            value={c.icon}
            onChange={(val: string | undefined) => updateSectionContentRaw(sectionId, 'icon', val)}
          />
        </div>
      </FormCard>

      <FormCard title="Contact Links" subtitle="Type + value per row">
        <div className="space-y-4">
          {items.map((item: any, idx: number) => (
            <ItemCard
              key={item.id || idx}
              title={item.label || item.value || `Link #${idx + 1}`}
              onRemove={() => setItems(items.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      Type
                    </label>
                    <select
                      value={item.type || 'website'}
                      onChange={(e) => updateItem(idx, { type: e.target.value })}
                      className="h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-transparent px-[12px] text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      {LINK_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      Label (optional)
                    </label>
                    <Input
                      value={item.label || ''}
                      onChange={(e) => updateItem(idx, { label: e.target.value })}
                      placeholder="My WhatsApp"
                      className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                    Value (URL, number, or email)
                  </label>
                  <Input
                    value={item.value || item.url || ''}
                    onChange={(e) => updateItem(idx, { value: e.target.value })}
                    placeholder="https://... / +20... / name@mail.com"
                    className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))}
                    className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer"
                    title="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ItemCard>
          ))}

          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
              No links yet.
            </p>
          )}
          <AddActionCard onClick={() => setItems([...items, newItem()])} label="Add Link" />
        </div>
      </FormCard>
    </div>
  )
}
