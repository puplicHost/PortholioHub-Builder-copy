/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { FileButton } from './ui/FileButton'

interface TestimonialsEditorProps {
  sectionId: string
  content: any
  updateSectionContent: (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => void
  updateSectionContentRaw: (sectionId: string, field: string, value: any) => void
  FormCard: any
  ItemCard: any
  AddActionCard: any
  IconPicker: any
}

function newItem() {
  return {
    id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: '',
    title: '',
    photoUrl: '',
    text: { en: '', ar: '' },
    rating: 5,
  }
}

export function TestimonialsEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  ItemCard,
  AddActionCard,
  IconPicker,
}: TestimonialsEditorProps) {
  const { t } = useBuilderI18n()
  const c = content || {}
  const items: any[] = c.items || []
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const setItems = (next: any[]) => updateSectionContentRaw(sectionId, 'items', next)

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

  const handlePhotoUpload = async (idx: number, file: File | undefined) => {
    if (!file) return
    setUploadingIdx(idx)
    try {
      const result = await uploadToCloudinary(file)
      updateItem(idx, { photoUrl: result.url })
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleTestimonials')}>
        <div className="space-y-4">
          <div role="group" aria-labelledby={`${sectionId}-section-icon-label`}>
            <label id={`${sectionId}-section-icon-label`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('field.sectionIcon')}
            </label>
            <IconPicker
              value={c.icon}
              onChange={(val: string | undefined) => updateSectionContentRaw(sectionId, 'icon', val)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${sectionId}-heading-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.headingEn')}
              </label>
              <Input
                id={`${sectionId}-heading-en`}
                dir="ltr"
                value={c.title?.en || 'Testimonials'}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${sectionId}-description-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.description')} (EN)
              </label>
              <textarea
                id={`${sectionId}-description-en`}
                dir="ltr"
                value={c.subtitle?.en || c.description?.en || ''}
                onChange={(e) => updateSectionContent(sectionId, 'subtitle', 'en', e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                placeholder={t('placeholder.testimonialDescription')}
              />
            </div>
            <div dir="rtl">
              <label htmlFor={`${sectionId}-description-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.description')} (AR)
              </label>
              <textarea
                id={`${sectionId}-description-ar`}
                value={c.subtitle?.ar || c.description?.ar || ''}
                onChange={(e) => updateSectionContent(sectionId, 'subtitle', 'ar', e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-right text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>
      </FormCard>

      <FormCard title={t('form.testimonialsList')} subtitle={t('form.subtitleTestimonialsList')}>
        <div className="space-y-4">
          {items.map((item: any, idx: number) => (
            <ItemCard
              key={item.id || idx}
              title={item.name || t('item.photoN', { n: idx + 1 })}
              onRemove={() => setItems(items.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-4">
                <div>
                  <label htmlFor={`${sectionId}-photo-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {t('field.clientPhoto')}
                  </label>
                  <div className="flex items-center gap-3">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name || t('common.client')}
                        className="h-12 w-12 shrink-0 rounded-full border border-[var(--color-border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-sm font-bold text-[var(--color-text-muted)]">
                        {(item.name || '#').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Input
                      id={`${sectionId}-photo-${idx}`}
                      value={item.photoUrl || ''}
                      onChange={(e) => updateItem(idx, { photoUrl: e.target.value })}
                      placeholder={t('placeholder.imageUrlOrUpload')}
                      className="h-[44px] min-h-[44px] flex-1 px-[12px] py-[10px] text-[15px]"
                    />
                    <FileButton
                      accept="image/*"
                      disabled={uploadingIdx === idx}
                      onFiles={(files) => void handlePhotoUpload(idx, files?.[0])}
                      aria-label={t('common.upload')}
                      className="h-[44px] shrink-0"
                    >
                      {uploadingIdx === idx ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {uploadingIdx === idx ? t('common.uploading') : t('common.upload')}
                    </FileButton>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: t('item.photoN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveUp', { item: t('item.photoN', { n: idx + 1 }) })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={t('common.moveDown', { item: t('item.photoN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveDown', { item: t('item.photoN', { n: idx + 1 }) })}
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
              {t('empty.testimonials')}
            </p>
          )}
          <AddActionCard onClick={() => setItems([...items, newItem()])} label={t('actions.addTestimonial')} />
        </div>
      </FormCard>
    </div>
  )
}
