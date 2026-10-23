/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { FileButton } from './ui/FileButton'

interface FilesEditorProps {
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
    id: `f-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    label: '',
    url: '',
  }
}

export function FilesEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  ItemCard,
  AddActionCard,
  IconPicker,
}: FilesEditorProps) {
  const { t } = useBuilderI18n()
  const confirm = useConfirm()
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

  const removeItem = async (idx: number) => {
    const ok = await confirm({
      title: t('confirm.removeFileTitle'),
      message: t('confirm.removeFileMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    setItems(items.filter((_: any, i: number) => i !== idx))
  }

  const handleUpload = async (idx: number, file: File | undefined) => {
    if (!file) return
    setUploadingIdx(idx)
    try {
      const result = await uploadToCloudinary(file)
      updateItem(idx, {
        url: result.url,
        label: items[idx]?.label || file.name,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleFilesHeading')}>
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

      <FormCard title={t('form.filesList')} subtitle={t('form.subtitleFilesList')}>
        <div className="space-y-4">
          {items.map((item: any, idx: number) => (
            <ItemCard
              key={item.id || idx}
              title={item.label || t('item.fileN', { n: idx + 1 })}
              onRemove={() => setItems(items.filter((_: any, i: number) => i !== idx))}
            >
              <div className="mt-2 flex flex-col gap-4">
                <div>
                  <label htmlFor={`${sectionId}-label-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {t('field.label')}
                  </label>
                  <Input
                    id={`${sectionId}-label-${idx}`}
                    value={item.label || ''}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                    placeholder={t('placeholder.fileLabel')}
                    className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                  />
                </div>
                <div>
                  <label htmlFor={`${sectionId}-file-${idx}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {t('field.file')}
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      id={`${sectionId}-file-${idx}`}
                      value={item.url || item.externalUrl || ''}
                      onChange={(e) => updateItem(idx, { url: e.target.value })}
                      placeholder={t('placeholder.fileUrl')}
                      className="h-[44px] min-h-[44px] flex-1 px-[12px] py-[10px] text-[15px]"
                    />
                    <FileButton
                      accept=".pdf,.doc,.docx,.txt,.csv"
                      disabled={uploadingIdx === idx}
                      onFiles={(files) => void handleUpload(idx, files?.[0])}
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
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => void removeItem(idx)}
                    aria-label={t('common.removeFile')}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    title={t('common.removeFile')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: t('item.fileN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveUp', { item: t('item.fileN', { n: idx + 1 }) })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={t('common.moveDown', { item: t('item.fileN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={t('common.moveDown', { item: t('item.fileN', { n: idx + 1 }) })}
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
              {t('empty.files')}
            </p>
          )}
          <AddActionCard onClick={() => setItems([...items, newItem()])} label={t('actions.addFile')} />
        </div>
      </FormCard>
    </div>
  )
}
