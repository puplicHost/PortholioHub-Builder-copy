/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { Select } from './ui/Select'

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
  const { t } = useBuilderI18n()
  const confirm = useConfirm()
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

  const removeItem = async (idx: number) => {
    const ok = await confirm({
      title: t('confirm.removeLinkTitle'),
      message: t('confirm.removeLinkMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    setItems(items.filter((_: any, i: number) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleContactHeading')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${sectionId}-heading-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('field.headingEn')}
            </label>
            <Input
              id={`${sectionId}-heading-en`}
              dir="ltr"
              value={c.title?.en || ''}
              onChange={(e) => updateSectionContent(sectionId, 'title', 'en', e.target.value)}
              className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
            />
          </div>
          <div dir="rtl">
            <label htmlFor={`${sectionId}-heading-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('field.headingAr')}
            </label>
            <Input
              id={`${sectionId}-heading-ar`}
              value={c.title?.ar || ''}
              onChange={(e) => updateSectionContent(sectionId, 'title', 'ar', e.target.value)}
              className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-right text-[15px]"
            />
          </div>
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

      <FormCard title={t('form.contactLinks')} subtitle={t('form.subtitleContactLinks')}>
        <div className="space-y-4">
          {items.map((item: any, idx: number) => (
            <ItemCard
              key={item.id || idx}
              title={item.label || item.value || t('item.linkN', { n: idx + 1 })}
              onRemove={() => setItems(items.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${sectionId}-type-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.type')}
                    </label>
                    <Select
                      id={`${sectionId}-type-${idx}`}
                      value={item.type || 'website'}
                      onChange={(value) => updateItem(idx, { type: value })}
                      options={LINK_TYPES.map((type) => ({
                        value: type,
                        label: t(`linkType.${type}`),
                      }))}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${sectionId}-label-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.labelOptional')}
                    </label>
                    <Input
                      id={`${sectionId}-label-${idx}`}
                      value={item.label || ''}
                      onChange={(e) => updateItem(idx, { label: e.target.value })}
                      placeholder="My WhatsApp"
                      className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`${sectionId}-value-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {t('field.contactValue')}
                  </label>
                  <Input
                    id={`${sectionId}-value-${idx}`}
                    value={item.value || item.url || ''}
                    onChange={(e) => updateItem(idx, { value: e.target.value })}
                    placeholder="https://... / +20... / name@mail.com"
                    className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => void removeItem(idx)}
                    aria-label={t('common.removeLink')}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    title={t('common.removeLink')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: t('item.linkN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveUp', { item: t('item.linkN', { n: idx + 1 }) })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={t('common.moveDown', { item: t('item.linkN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveDown', { item: t('item.linkN', { n: idx + 1 }) })}
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
              {t('empty.links')}
            </p>
          )}
          <AddActionCard onClick={() => setItems([...items, newItem()])} label={t('actions.addLink')} />
        </div>
      </FormCard>
    </div>
  )
}
