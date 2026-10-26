/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ChevronUp, ChevronDown, Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { FileButton } from './ui/FileButton'
import { ImageDeleteButton } from './ui/ImageDeleteButton'
import { Select } from './ui/Select'
import { pickLang } from '@/lib/portfolio-language'

interface CustomEditorProps {
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

function emptyCard() {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: { en: 'New Card', ar: 'بطاقة جديدة' },
    description: { en: '', ar: '' },
  }
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
  ImagePositionControl,
  uploadImage,
  isUploading,
  uploadPercent,
  showEn,
  showAr,
}: CustomEditorProps) {
  const { t, locale } = useBuilderI18n()
  const confirm = useConfirm()
  const c = content || {}
  const cards: any[] = Array.isArray(c.cards) ? c.cards : []
  const paragraphs: string[] = Array.isArray(c.paragraphs) ? c.paragraphs : []

  const setCards = (next: any[]) => updateSectionContentRaw(sectionId, 'cards', next)

  const cardText = (card: any, field: string, lang: 'en' | 'ar') => {
    const value = card?.[field]
    if (value && typeof value === 'object') return value[lang] || ''
    return typeof value === 'string' && lang === 'en' ? value : ''
  }

  const setCardField = (idx: number, field: string, lang: 'en' | 'ar', value: string) => {
    const next = [...cards]
    const current = next[idx]?.[field]
    const obj = current && typeof current === 'object' ? current : { en: typeof current === 'string' ? current : '' }
    next[idx] = { ...next[idx], [field]: { ...obj, [lang]: value } }
    setCards(next)
  }

  const setCardRaw = (idx: number, field: string, value: any) => {
    const next = [...cards]
    next[idx] = { ...next[idx], [field]: value }
    setCards(next)
  }

  const moveCard = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= cards.length) return
    const next = [...cards]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    setCards(next)
  }

  const removeCard = async (idx: number) => {
    const ok = await confirm({
      title: t('confirm.removeItemTitle'),
      message: t('confirm.removeItemMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    setCards(cards.filter((_: any, i: number) => i !== idx))
  }

  const moveParagraph = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= paragraphs.length) return
    const next = [...paragraphs]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    updateSectionContentRaw(sectionId, 'paragraphs', next)
  }

  return (
    <div className="space-y-6">
      <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleCustom')}>
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

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={c.showTitleUnderline !== false}
              onChange={(e) => updateSectionContentRaw(sectionId, 'showTitleUnderline', e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            {t('field.showTitleUnderline')}
          </label>

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

      <FormCard title={t('form.customCards')} subtitle={t('form.subtitleCustomCards')}>
        <div className="space-y-4">
          {cards.map((card: any, idx: number) => {
            const uploadKey = `custom-${sectionId}-${card.id || idx}`
            const uploading = isUploading(uploadKey)
            const position = card.imagePosition || { x: 50, y: 50 }
            return (
              <ItemCard
                key={card.id || idx}
                title={pickLang(card.title, locale) || t('item.cardN', { n: idx + 1 })}
                subtitle={pickLang(card.description, locale)}
                onRemove={() => void removeCard(idx)}
              >
                <div className="flex flex-col gap-4 mt-3">
                  {showEn && (
                    <div>
                      <label htmlFor={`${sectionId}-card-${idx}-title-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.title')} (EN)
                      </label>
                      <Input
                        id={`${sectionId}-card-${idx}-title-en`}
                        value={cardText(card, 'title', 'en')}
                        onChange={(e) => setCardField(idx, 'title', 'en', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                    </div>
                  )}
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`${sectionId}-card-${idx}-title-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.title')} (AR)
                      </label>
                      <Input
                        id={`${sectionId}-card-${idx}-title-ar`}
                        value={cardText(card, 'title', 'ar')}
                        onChange={(e) => setCardField(idx, 'title', 'ar', e.target.value)}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px] text-right"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor={`${sectionId}-card-${idx}-desc`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.descriptionOptional')}
                    </label>
                    <textarea
                      id={`${sectionId}-card-${idx}-desc`}
                      value={cardText(card, 'description', 'en')}
                      onChange={(e) => setCardField(idx, 'description', 'en', e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    />
                  </div>
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`${sectionId}-card-${idx}-desc-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.descriptionOptional')} (AR)
                      </label>
                      <textarea
                        id={`${sectionId}-card-${idx}-desc-ar`}
                        value={cardText(card, 'description', 'ar')}
                        onChange={(e) => setCardField(idx, 'description', 'ar', e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-right text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      />
                    </div>
                  )}

                  <div role="group" aria-labelledby={`${sectionId}-card-${idx}-icon`}>
                    <label id={`${sectionId}-card-${idx}-icon`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.icon')}
                    </label>
                    <IconPicker value={card.icon} onChange={(val: string | undefined) => setCardRaw(idx, 'icon', val)} />
                  </div>

                  <div>
                    <label htmlFor={`${sectionId}-card-${idx}-image`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {t('field.image')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id={`${sectionId}-card-${idx}-image`}
                        value={card.image || ''}
                        onChange={(e) => setCardRaw(idx, 'image', e.target.value)}
                        placeholder={t('placeholder.imageUrl')}
                        className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                      />
                      <FileButton
                        accept="image/*"
                        disabled={uploading}
                        onFiles={(files) => void uploadImage(uploadKey, files?.[0], (url) => setCardRaw(idx, 'image', url))}
                        className="h-[44px] min-h-[44px] px-3"
                      >
                        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploading ? `${t('common.uploading')} ${uploadPercent(uploadKey)}%` : t('common.upload')}
                      </FileButton>
                      {card.image && (
                        <ImageDeleteButton
                          onDelete={() => {
                            setCardRaw(idx, 'image', '')
                            setCardRaw(idx, 'imagePosition', { x: 50, y: 50 })
                          }}
                          className="h-[44px] min-h-[44px]"
                        />
                      )}
                    </div>
                    {card.image && (
                      <div className="mt-3">
                        <ImagePositionControl
                          src={card.image}
                          value={position}
                          onChange={(next: any) => setCardRaw(idx, 'imagePosition', next)}
                          variant="wide"
                          uploading={uploading}
                          progress={uploadPercent(uploadKey)}
                          label={t('field.imagePosition')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 border-t border-[var(--color-border)] pt-3">
                    <div>
                      <label htmlFor={`${sectionId}-card-${idx}-link`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.linkUrl')}
                      </label>
                      <Input
                        id={`${sectionId}-card-${idx}-link`}
                        value={card.linkUrl || ''}
                        onChange={(e) => setCardRaw(idx, 'linkUrl', e.target.value)}
                        placeholder={t('placeholder.url')}
                        className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                      />
                    </div>
                    {showEn && (
                      <div>
                        <label htmlFor={`${sectionId}-card-${idx}-linklabel-en`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                          {t('field.linkLabelOptional')}
                        </label>
                        <Input
                          id={`${sectionId}-card-${idx}-linklabel-en`}
                          value={cardText(card, 'linkLabel', 'en')}
                          onChange={(e) => setCardField(idx, 'linkLabel', 'en', e.target.value)}
                          className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-[15px]"
                        />
                      </div>
                    )}
                    {showAr && (
                      <div dir="rtl">
                        <label htmlFor={`${sectionId}-card-${idx}-linklabel-ar`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                          {t('field.linkLabelOptional')} (AR)
                        </label>
                        <Input
                          id={`${sectionId}-card-${idx}-linklabel-ar`}
                          value={cardText(card, 'linkLabel', 'ar')}
                          onChange={(e) => setCardField(idx, 'linkLabel', 'ar', e.target.value)}
                          className="h-[44px] min-h-[44px] w-full px-[12px] py-[10px] text-right text-[15px]"
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor={`${sectionId}-card-${idx}-linkicon`} className="mb-2 block text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {t('field.linkIcon')}
                      </label>
                      <Select
                        id={`${sectionId}-card-${idx}-linkicon`}
                        value={card.linkIcon || 'generic'}
                        onChange={(value) => setCardRaw(idx, 'linkIcon', value)}
                        options={[
                          { value: 'pdf', label: t('linkIcon.pdf') },
                          { value: 'sheet', label: t('linkIcon.sheet') },
                          { value: 'doc', label: t('linkIcon.doc') },
                          { value: 'folder', label: t('linkIcon.folder') },
                          { value: 'generic', label: t('linkIcon.generic') },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveCard(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: pickLang(card.title, locale) || t('item.cardN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCard(idx, 1)}
                      disabled={idx === cards.length - 1}
                      aria-label={t('common.moveDown', { item: pickLang(card.title, locale) || t('item.cardN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ItemCard>
            )
          })}

          {cards.length === 0 && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
              {t('empty.customCards')}
            </p>
          )}
          <AddActionCard onClick={() => setCards([...cards, emptyCard()])} label={t('actions.addCard')} icon={Plus} />
        </div>
      </FormCard>

      {/* Legacy paragraph list: kept editable so older custom sections never
          lose content. New sections use cards above. */}
      {paragraphs.length > 0 && (
        <FormCard title={t('form.paragraphs')} subtitle={t('form.subtitleParagraphs')}>
          <div className="space-y-4">
            {paragraphs.map((text: string, idx: number) => (
              <ItemCard
                key={idx}
                title={(text || '').slice(0, 40) || t('item.paragraphN', { n: idx + 1 })}
                onRemove={() => updateSectionContentRaw(sectionId, 'paragraphs', paragraphs.filter((_: any, i: number) => i !== idx))}
              >
                <div className="mt-2 flex flex-col gap-3">
                  <textarea
                    aria-label={t('item.paragraphN', { n: idx + 1 })}
                    dir="auto"
                    value={typeof text === 'string' ? text : ''}
                    onChange={(e) => {
                      const next = [...paragraphs]
                      next[idx] = e.target.value
                      updateSectionContentRaw(sectionId, 'paragraphs', next)
                    }}
                    rows={3}
                    className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, -1)}
                      disabled={idx === 0}
                      aria-label={t('common.moveUp', { item: t('item.paragraphN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParagraph(idx, 1)}
                      disabled={idx === paragraphs.length - 1}
                      aria-label={t('common.moveDown', { item: t('item.paragraphN', { n: idx + 1 }) })}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ItemCard>
            ))}
          </div>
        </FormCard>
      )}
    </div>
  )
}
