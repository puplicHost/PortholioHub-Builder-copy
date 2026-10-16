/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface CustomEditorProps {
  sectionId: string
  content: any
  updateSectionContent: (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => void
  updateSectionContentRaw: (sectionId: string, field: string, value: any) => void
  FormCard: any
  ItemCard: any
  AddActionCard: any
  IconPicker: any
}

export function CustomEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  ItemCard,
  AddActionCard,
  IconPicker,
}: CustomEditorProps) {
  const c = content || {}
  const paragraphs: string[] = Array.isArray(c.paragraphs) ? c.paragraphs : []

  const setParagraphs = (next: string[]) => updateSectionContentRaw(sectionId, 'paragraphs', next)

  const moveParagraph = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= paragraphs.length) return
    const next = [...paragraphs]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    setParagraphs(next)
  }

  return (
    <div className="space-y-6">
      <FormCard title="Section Content" subtitle="Title and free paragraphs">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
            Title
          </label>
          <Input
            value={typeof c.title === 'string' ? c.title : c.title?.en || ''}
            onChange={(e) => updateSectionContent(sectionId, 'title', 'en', e.target.value)}
            className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
          />
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

      <FormCard title="Paragraphs" subtitle="Plain text, one block each">
        <div className="space-y-4">
          {paragraphs.map((text: string, idx: number) => (
            <ItemCard
              key={idx}
              title={(text || '').slice(0, 40) || `Paragraph #${idx + 1}`}
              onRemove={() => setParagraphs(paragraphs.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-3">
                <textarea
                  value={typeof text === 'string' ? text : ''}
                  onChange={(e) => {
                    const next = [...paragraphs]
                    next[idx] = e.target.value
                    setParagraphs(next)
                  }}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setParagraphs(paragraphs.filter((_: any, i: number) => i !== idx))}
                    className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer"
                    title="Remove paragraph"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, 1)}
                      disabled={idx === paragraphs.length - 1}
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

          {paragraphs.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
              No paragraphs yet.
            </p>
          )}
          <AddActionCard onClick={() => setParagraphs([...paragraphs, ''])} label="Add Paragraph" />
        </div>
      </FormCard>
    </div>
  )
}
