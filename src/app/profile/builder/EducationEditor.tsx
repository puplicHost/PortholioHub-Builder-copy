/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { FileButton } from './ui/FileButton'
import { ImageDeleteButton } from './ui/ImageDeleteButton'
import { pickLang } from '@/lib/portfolio-language'

interface EducationEditorProps {
  sectionId: string
  content: any
  updateSectionContent: (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => void
  updateSectionContentRaw: (sectionId: string, field: string, value: any) => void
  FormCard: any
  ItemCard: any
  AddActionCard: any
  IconPicker: any
  ImagePositionControl: any
  uploadImage: (key: string, file: File | undefined, apply: (url: string) => void) => void
  isUploading: (key: string) => boolean
  uploadPercent: (key: string) => number
  showEn: boolean
  showAr: boolean
}

function emptyEducationCard() {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `edu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: { en: 'New Education', ar: 'تعليم جديد' },
    institution: { en: '', ar: '' },
    date: '',
    description: { en: '', ar: '' },
  }
}

export function EducationEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  ItemCard,
  AddActionCard,
  IconPicker,
  ImagePositionControl,
  uploadImage,
  isUploading,
  uploadPercent,
  showEn,
  showAr,
}: EducationEditorProps) {
  const { t, locale } = useBuilderI18n()
  const confirm = useConfirm()
  const c = content || {}
  const items: any[] = Array.isArray(c.items) ? c.items : []

  const setItems = (next: any[]) => updateSectionContentRaw(sectionId, 'items', next)

  const itemText = (item: any, field: string, lang: 'en' | 'ar') => {
    const value = item?.[field]
    if (value && typeof value === 'object') return value[lang] || ''
    return typeof value === 'string' && lang === 'en' ? value : ''
  }

  const setItemField = (idx: number, field: string, lang: 'en' | 'ar', value: string) => {
    const next = [...items]
    const current = next[idx]?.[field]
    const obj = current && typeof current === 'object' ? current : { en: typeof current === 'string' ? current : '' }
    next[idx] = { ...next[idx], [field]: { ...obj, [lang]: value } }
    setItems(next)
  }

  const setItemRaw = (idx: number, field: string, value: any) => {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: value }
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
      title: t('confirm.removeItemTitle'),
      message: t('confirm.removeItemMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    setItems(items.filter((_: any, i: number) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleEducation')}>
        <div className="space-y-4">
          {showEn && (
            <div>
              <label htmlFor={`${sectionId}-title-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.sectionTitleEn')}
              </label>
              <Input
                id={`${sectionId}-title-en`}
                value={c.title?.en || ''}
                onChange={(e) => updateSectionContent(sectionId, 'title', 'en', e.target.value)}
                className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
              />
            </div>
          )}
          {showAr && (
            <div dir="rtl">
              <label htmlFor={`${sectionId}-title-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.sectionTitleAr')}
              </label>
              <Input
                id={`${sectionId}-title-ar`}
                value={c.title?.ar || ''}
                onChange={(e) => updateSectionContent(sectionId, 'title', 'ar', e.target.value)}
                className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px] text-right"
              />
            </div>
          )}
          {showEn && (
            <div>
              <label htmlFor={`${sectionId}-description-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.descriptionOptional')}
              </label>
              <textarea
                id={`${sectionId}-description-en`}
                value={c.description?.en || ''}
                onChange={(e) => updateSectionContent(sectionId, 'description', 'en', e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
            </div>
          )}
          {showAr && (
            <div dir="rtl">
              <label htmlFor={`${sectionId}-description-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.descriptionOptional')} (AR)
              </label>
              <textarea
                id={`${sectionId}-description-ar`}
                value={c.description?.ar || ''}
                onChange={(e) => updateSectionContent(sectionId, 'description', 'ar', e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-right text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
            </div>
          )}
          <div role="group" aria-labelledby={`${sectionId}-section-icon-label`}>
            <label id={`${sectionId}-section-icon-label`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('field.sectionIcon')}
            </label>
            <IconPicker
              value={c.icon}
              onChange={(val: string | undefined) => updateSectionContentRaw(sectionId, 'icon', val)}
            />
          </div>
        </div>
      </FormCard>

      <FormCard title={t('form.educationItems')} subtitle={t('form.subtitleEducationItems')}>
        <div className="space-y-4">
          {items.map((item: any, idx: number) => {
            const uploadKey = `education-${sectionId}-${item.id || idx}`
            const uploading = isUploading(uploadKey)
            const position = item.imagePosition || { x: 50, y: 50 }
            return (
              <ItemCard
                key={item.id || idx}
                title={pickLang(item.title, locale) || t('item.educationN', { n: idx + 1 })}
                subtitle={pickLang(item.institution, locale) || pickLang(item.subtitle, locale)}
                onRemove={() => void removeItem(idx)}
              >
                <div className="flex flex-col gap-4 mt-3">
                  {showEn && (
                    <div>
                      <label htmlFor={`${sectionId}-item-${idx}-title-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.title')} (EN) <span className="text-[var(--color-danger)]">*</span>
                      </label>
                      <Input
                        id={`${sectionId}-item-${idx}-title-en`}
                        value={itemText(item, 'title', 'en')}
                        onChange={(e) => setItemField(idx, 'title', 'en', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                    </div>
                  )}
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`${sectionId}-item-${idx}-title-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.title')} (AR) <span className="text-[var(--color-danger)]">*</span>
                      </label>
                      <Input
                        id={`${sectionId}-item-${idx}-title-ar`}
                        value={itemText(item, 'title', 'ar')}
                        onChange={(e) => setItemField(idx, 'title', 'ar', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px] text-right"
                      />
                    </div>
                  )}

                  {showEn && (
                    <div>
                      <label htmlFor={`${sectionId}-item-${idx}-institution-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.institution')} (EN)
                      </label>
                      <Input
                        id={`${sectionId}-item-${idx}-institution-en`}
                        value={itemText(item, 'institution', 'en')}
                        onChange={(e) => setItemField(idx, 'institution', 'en', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                    </div>
                  )}
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`${sectionId}-item-${idx}-institution-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.institution')} (AR)
                      </label>
                      <Input
                        id={`${sectionId}-item-${idx}-institution-ar`}
                        value={itemText(item, 'institution', 'ar')}
                        onChange={(e) => setItemField(idx, 'institution', 'ar', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px] text-right"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor={`${sectionId}-item-${idx}-date`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.dateOptional')}
                    </label>
                    <Input
                      id={`${sectionId}-item-${idx}-date`}
                      value={typeof item.date === 'string' ? item.date : item.date?.en || ''}
                      onChange={(e) => setItemRaw(idx, 'date', e.target.value)}
                      placeholder={t('placeholder.educationDate')}
                      className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                    />
                  </div>

                  <div>
                    <label htmlFor={`${sectionId}-item-${idx}-desc`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.descriptionOptional')}
                    </label>
                    <textarea
                      id={`${sectionId}-item-${idx}-desc`}
                      value={itemText(item, 'description', 'en')}
                      onChange={(e) => setItemField(idx, 'description', 'en', e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    />
                  </div>
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`${sectionId}-item-${idx}-desc-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.descriptionOptional')} (AR)
                      </label>
                      <textarea
                        id={`${sectionId}-item-${idx}-desc-ar`}
                        value={itemText(item, 'description', 'ar')}
                        onChange={(e) => setItemField(idx, 'description', 'ar', e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-right text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      />
                    </div>
                  )}

                  <div role="group" aria-labelledby={`${sectionId}-item-${idx}-icon`}>
                    <label id={`${sectionId}-item-${idx}-icon`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.icon')}
                    </label>
                    <IconPicker value={item.icon} onChange={(val: string | undefined) => setItemRaw(idx, 'icon', val)} />
                  </div>

                  <div>
                    <label htmlFor={`${sectionId}-item-${idx}-image`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.certificateImage')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id={`${sectionId}-item-${idx}-image`}
                        value={item.image || ''}
                        onChange={(e) => setItemRaw(idx, 'image', e.target.value)}
                        placeholder={t('placeholder.imageUrl')}
                        className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                      />
                      <FileButton
                        accept="image/*"
                        disabled={uploading}
                        onFiles={(files) => void uploadImage(uploadKey, files?.[0], (url) => setItemRaw(idx, 'image', url))}
                        className="h-[44px] min-h-[44px] px-3"
                      >
                        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploading ? `${t('common.uploading')} ${uploadPercent(uploadKey)}%` : t('common.upload')}
                      </FileButton>
                      {item.image && (
                        <ImageDeleteButton
                          onDelete={() => {
                            setItemRaw(idx, 'image', '')
                            setItemRaw(idx, 'imagePosition', { x: 50, y: 50 })
                          }}
                          className="h-[44px] min-h-[44px]"
                        />
                      )}
                    </div>
                    {item.image && (
                      <div className="mt-3">
                        <ImagePositionControl
                          src={item.image}
                          value={position}
                          onChange={(next: any) => setItemRaw(idx, 'imagePosition', next)}
                          variant="wide"
                          uploading={uploading}
                          progress={uploadPercent(uploadKey)}
                          label={t('field.imagePosition')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: pickLang(item.title, locale) || t('item.educationN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={t('common.moveDown', { item: pickLang(item.title, locale) || t('item.educationN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ItemCard>
            )
          })}

          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
              {t('empty.education')}
            </p>
          )}
          <AddActionCard onClick={() => setItems([...items, emptyEducationCard()])} label={t('actions.addEducation')} icon={Plus} />
        </div>
      </FormCard>
    </div>
  )
}
