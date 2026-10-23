/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'

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
  const { t } = useBuilderI18n()
  const confirm = useConfirm()
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

  const removeParagraph = async (idx: number) => {
    const ok = await confirm({
      title: t('confirm.removeParagraphTitle'),
      message: t('confirm.removeParagraphMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    setParagraphs(paragraphs.filter((_: any, i: number) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleCustom')}>
        <div>
          <label htmlFor={`${sectionId}-title`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
            {t('field.title')}
          </label>
          <Input
            id={`${sectionId}-title`}
            dir="ltr"
            value={typeof c.title === 'string' ? c.title : c.title?.en || ''}
            onChange={(e) => updateSectionContent(sectionId, 'title', 'en', e.target.value)}
            className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
          />
        </div>
        <div className="mt-4" role="group" aria-labelledby={`${sectionId}-section-icon-label`}>
          <label id={`${sectionId}-section-icon-label`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
            {t('field.sectionIcon')}
          </label>
          <IconPicker
            value={c.icon}
            onChange={(val: string | undefined) => updateSectionContentRaw(sectionId, 'icon', val)}
          />
        </div>
      </FormCard>

      <FormCard title={t('form.paragraphs')} subtitle={t('form.subtitleParagraphs')}>
        <div className="space-y-4">
          {paragraphs.map((text: string, idx: number) => (
            <ItemCard
              key={idx}
              title={(text || '').slice(0, 40) || t('item.paragraphN', { n: idx + 1 })}
              onRemove={() => setParagraphs(paragraphs.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-3">
                <textarea
                  aria-label={t('item.paragraphN', { n: idx + 1 })}
                  dir="auto"
                  value={typeof text === 'string' ? text : ''}
                  onChange={(e) => {
                    const next = [...paragraphs]
                    next[idx] = e.target.value
                    setParagraphs(next)
                  }}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => void removeParagraph(idx)}
                    aria-label={t('common.removeParagraph')}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    title={t('common.removeParagraph')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: t('item.paragraphN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveUp', { item: t('item.paragraphN', { n: idx + 1 }) })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, 1)}
                      disabled={idx === paragraphs.length - 1}
                      aria-label={t('common.moveDown', { item: t('item.paragraphN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveDown', { item: t('item.paragraphN', { n: idx + 1 }) })}
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
              {t('empty.paragraphs')}
            </p>
          )}
          <AddActionCard onClick={() => setParagraphs([...paragraphs, ''])} label={t('actions.addParagraph')} />
        </div>
      </FormCard>
    </div>
  )
}
