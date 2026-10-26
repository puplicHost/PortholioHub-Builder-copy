/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, ChevronUp, ChevronDown, ChevronRight, Loader2, Trash2, ExternalLink, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { FileButton } from './ui/FileButton'
import { ImageDeleteButton } from './ui/ImageDeleteButton'

interface ClientsEditorProps {
  sectionId: string
  content: any
  updateSectionContent: (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => void
  updateSectionContentRaw: (sectionId: string, field: string, value: any) => void
  FormCard: any
  ItemCard: any
  AddActionCard: any
  IconPicker: any
}

function newClientItem() {
  return {
    id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: '',
    logoUrl: '',
    url: '',
  }
}

export function ClientsEditor({
  sectionId,
  content,
  updateSectionContent,
  updateSectionContentRaw,
  FormCard,
  AddActionCard,
  IconPicker,
}: ClientsEditorProps) {
  const { t } = useBuilderI18n()
  const c = content || {}
  const items: any[] = c.items || []

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [uploadPercent, setUploadPercent] = useState<number>(0)
  const [logoMode, setLogoMode] = useState<Record<string, 'upload' | 'url'>>({})
  const [urlImageErrors, setUrlImageErrors] = useState<Record<string, boolean>>({})

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

  const removeItem = (idx: number) => {
    setItems(items.filter((_: any, i: number) => i !== idx))
  }

  const handleAddClient = () => {
    const item = newClientItem()
    setItems([...items, item])
    setExpandedId(item.id)
  }

  const handleUpload = async (idx: number, file: File | undefined) => {
    if (!file) return
    setUploadingIdx(idx)
    setUploadPercent(0)
    try {
      const result = await uploadToCloudinary(file, (pct) => setUploadPercent(pct))
      updateItem(idx, { logoUrl: result.url })
    } catch (err) {
      console.error('Logo upload failed:', err)
    } finally {
      setUploadingIdx(null)
      setUploadPercent(0)
    }
  }

  const logoShape = c.logoShape || 'circle'
  const logoSize = c.logoSize || 'md'
  const isGrayscale = Boolean(c.grayscale)
  const showTitleUnderline = c.showTitleUnderline !== false

  return (
    <div className="space-y-6">
      {/* ── Section Settings ────────────────────────────────────── */}
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleClients')}>
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
                value={c.title?.en || ''}
                placeholder="Clients"
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
                placeholder="العملاء"
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
                value={c.description?.en || ''}
                onChange={(e) => updateSectionContent(sectionId, 'description', 'en', e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                placeholder={t('placeholder.sectionDescriptionEn')}
              />
            </div>
            <div dir="rtl">
              <label htmlFor={`${sectionId}-description-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('field.description')} (AR)
              </label>
              <textarea
                id={`${sectionId}-description-ar`}
                value={c.description?.ar || ''}
                onChange={(e) => updateSectionContent(sectionId, 'description', 'ar', e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-right text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                placeholder={t('placeholder.sectionDescriptionAr')}
              />
            </div>
          </div>

          {/* Logo Shape */}
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('clients.logoShape')}
            </label>
            <div role="group" className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
              {(['circle', 'rounded', 'square'] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={logoShape === shape}
                  onClick={() => updateSectionContentRaw(sectionId, 'logoShape', shape)}
                  className={`flex-1 cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    logoShape === shape
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {t(`clients.logoShape.${shape}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Size */}
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              {t('clients.logoSize')}
            </label>
            <div role="group" className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  aria-pressed={logoSize === sz}
                  onClick={() => updateSectionContentRaw(sectionId, 'logoSize', sz)}
                  className={`flex-1 cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    logoSize === sz
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {t(`clients.logoSize.${sz}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Grayscale Toggle */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              <span className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('clients.grayscale')}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {t('clients.grayscaleHint')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isGrayscale}
              onClick={() => updateSectionContentRaw(sectionId, 'grayscale', !isGrayscale)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isGrayscale ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isGrayscale ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Accent Underline Toggle */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              <span className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
                {t('clients.showUnderline')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showTitleUnderline}
              onClick={() => updateSectionContentRaw(sectionId, 'showTitleUnderline', !showTitleUnderline)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                showTitleUnderline ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showTitleUnderline ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </FormCard>

      {/* ── Client Items List ───────────────────────────────────── */}
      <FormCard title={t('form.clientsList')} subtitle={t('form.subtitleClientsList')}>
        <div className="space-y-3">
          {items.map((item: any, idx: number) => {
            const itemId = item.id || `idx-${idx}`
            const isExpanded = expandedId === itemId
            const currentMode = logoMode[itemId] || (item.logoUrl?.startsWith('data:') || item.logoUrl?.includes('cloudinary') ? 'upload' : item.logoUrl ? 'url' : 'upload')

            const isInvalidBrandUrl = item.url && !/^https?:\/\//i.test(item.url.trim())
            const isInvalidLogoUrl = item.logoUrl && currentMode === 'url' && !/^https?:\/\//i.test(item.logoUrl.trim())
            const hasLogoImgError = Boolean(urlImageErrors[itemId])

            return (
              <div
                key={itemId}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] transition-all overflow-hidden"
              >
                {/* Collapsed Header / Summary Row */}
                <div
                  className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
                  onClick={() => setExpandedId(isExpanded ? null : itemId)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Thumbnail preview */}
                    <div className="h-10 w-10 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-center overflow-hidden">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt=""
                          className="h-full w-full object-contain p-1"
                          onError={() => {
                            setUrlImageErrors((prev) => ({ ...prev, [itemId]: true }))
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                        {item.name || t('item.clientN', { n: idx + 1 })}
                      </p>
                      {item.url ? (
                        <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.url}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {t('item.clientN', { n: idx + 1 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: item.name || idx + 1 })}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={t('common.moveDown', { item: item.name || idx + 1 })}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      aria-label={t('common.removeItem')}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : itemId)}
                      aria-expanded={isExpanded}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90 text-[var(--color-primary)]' : 'rtl:rotate-180'}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Item Form */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-surface)]">
                    {/* Logo Tabs: Upload vs URL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                          {t('field.image')}
                        </label>
                        {/* Segmented control for Upload vs URL */}
                        <div className="flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setLogoMode((prev) => ({ ...prev, [itemId]: 'upload' }))}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                              currentMode === 'upload'
                                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                          >
                            <Upload className="h-3 w-3" />
                            {t('clients.tabUpload')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoMode((prev) => ({ ...prev, [itemId]: 'url' }))}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                              currentMode === 'url'
                                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                          >
                            <LinkIcon className="h-3 w-3" />
                            {t('clients.tabUrl')}
                          </button>
                        </div>
                      </div>

                      {currentMode === 'upload' ? (
                        <div className="flex items-center gap-3">
                          {item.logoUrl ? (
                            <div className="h-14 w-14 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-1.5 flex items-center justify-center overflow-hidden">
                              <img src={item.logoUrl} alt="" className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                              <ImageIcon className="h-5 w-5 opacity-40" />
                            </div>
                          )}
                          <div className="flex-1 flex items-center gap-2">
                            <FileButton
                              accept="image/*"
                              disabled={uploadingIdx === idx}
                              onFiles={(files) => void handleUpload(idx, files?.[0])}
                              aria-label={t('common.upload')}
                              className="h-[44px] flex-1 min-h-[44px]"
                            >
                              {uploadingIdx === idx ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              {uploadingIdx === idx ? `${t('common.uploading')} ${uploadPercent}%` : t('common.upload')}
                            </FileButton>
                            {item.logoUrl && (
                              <ImageDeleteButton
                                onDelete={() => updateItem(idx, { logoUrl: '' })}
                                className="h-[44px] min-h-[44px]"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Input
                              type="url"
                              value={item.logoUrl || ''}
                              onChange={(e) => {
                                updateItem(idx, { logoUrl: e.target.value })
                                setUrlImageErrors((prev) => ({ ...prev, [itemId]: false }))
                              }}
                              placeholder="https://example.com/logo.png"
                              className="h-[44px] min-h-[44px] flex-1 px-[12px] py-[10px] text-[15px]"
                            />
                            {item.logoUrl && (
                              <ImageDeleteButton
                                onDelete={() => updateItem(idx, { logoUrl: '' })}
                                className="h-[44px] min-h-[44px]"
                              />
                            )}
                          </div>
                          {isInvalidLogoUrl && (
                            <p className="text-[11px] text-[var(--color-danger,red)]">
                              {t('clients.invalidUrl')}
                            </p>
                          )}
                          {/* Live preview */}
                          {item.logoUrl && !isInvalidLogoUrl && (
                            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-2 bg-[var(--color-surface-secondary)]">
                              <div className="h-12 w-12 shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-card)] p-1 flex items-center justify-center overflow-hidden">
                                <img
                                  src={item.logoUrl}
                                  alt=""
                                  className="h-full w-full object-contain"
                                  onError={() => setUrlImageErrors((prev) => ({ ...prev, [itemId]: true }))}
                                  onLoad={() => setUrlImageErrors((prev) => ({ ...prev, [itemId]: false }))}
                                />
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)]">
                                {hasLogoImgError ? (
                                  <span className="text-[var(--color-danger,red)] font-medium">
                                    {t('clients.invalidImageUrl')}
                                  </span>
                                ) : (
                                  <span>{t('preview.livePreview') || 'Preview'}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Client / Brand Name (Optional) */}
                    <div>
                      <label htmlFor={`client-name-${itemId}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('clients.clientName')}
                      </label>
                      <Input
                        id={`client-name-${itemId}`}
                        value={typeof item.name === 'string' ? item.name : item.name?.en || item.name?.ar || ''}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                    </div>

                    {/* Brand Link (URL) */}
                    <div>
                      <label htmlFor={`client-url-${itemId}`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('clients.brandUrl')}
                      </label>
                      <Input
                        id={`client-url-${itemId}`}
                        type="url"
                        value={item.url || ''}
                        onChange={(e) => updateItem(idx, { url: e.target.value })}
                        placeholder="https://acme.com"
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                      {isInvalidBrandUrl && (
                        <p className="mt-1 text-[11px] text-[var(--color-danger,red)]">
                          {t('clients.invalidUrl')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {items.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] py-5 text-center text-xs text-[var(--color-text-muted)]">
              {t('empty.clients')}
            </p>
          )}

          <AddActionCard onClick={handleAddClient} label={t('actions.addClient')} />
        </div>
      </FormCard>
    </div>
  )
}
