/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef } from 'react'
import { Check, Crown, Eye, LayoutTemplate, X } from 'lucide-react'
import { DEFAULT_TEMPLATE_ID, EDITORIAL_TEMPLATE_ID, type TemplateId } from '@/lib/templates'
import { useBuilderI18n } from './i18n/BuilderI18nContext'

export type TemplatePickerModalProps = {
  open: boolean
  onClose: () => void
  /** Template the saved portfolio uses right now (resolver-normalized). */
  currentTemplate: TemplateId
  /** Active preview-only override (never persisted) or null. */
  previewTemplateId: TemplateId | null
  /** Apply a template — persists ONLY `appearance.template`. Async (save). */
  onApply: (templateId: TemplateId) => Promise<boolean>
  /** Switch the preview to a template without touching saved state. */
  onPreview: (templateId: TemplateId | null) => void
  isFreePlan: boolean
  applying: boolean
  /** Upgrade funnel for Free users (WhatsApp deep-link or /profile/subscription). */
  upgradeHref?: string
}

type TemplateInfo = {
  id: TemplateId
  nameKey: string
  descKey: string
  pro: boolean
  /** Tiny CSS swatch so the cards read as previews without heavier assets. */
  swatch: { bg: string; accent: string; ink: string; paper: string }
}

const TEMPLATES: TemplateInfo[] = [
  {
    id: DEFAULT_TEMPLATE_ID,
    nameKey: 'templates.classic',
    descKey: 'templates.classicDesc',
    pro: false,
    swatch: { bg: '#101418', accent: '#3b82f6', ink: '#f4f7ff', paper: '#ffffff' },
  },
  {
    id: EDITORIAL_TEMPLATE_ID,
    nameKey: 'templates.editorial',
    descKey: 'templates.editorialDesc',
    pro: true,
    swatch: { bg: '#6e1e35', accent: '#6e1e35', ink: '#2a2622', paper: '#fbf7ee' },
  },
]

/**
 * Template picker. Preview flips a PREVIEW-ONLY state (the builder re-renders
 * the canvas by passing a template override — nothing is saved); the Apply
 * button runs the explicit save flow which persists only the template key.
 * Free plans can preview the editorial template but never apply it.
 */
export function TemplatePickerModal({
  open,
  onClose,
  currentTemplate,
  previewTemplateId,
  onPreview,
  onApply,
  isFreePlan,
  applying,
  upgradeHref = '/profile/subscription',
}: TemplatePickerModalProps) {
  const { t } = useBuilderI18n()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Modal a11y: scroll lock, Escape to close, focus — same conventions as the
  // workspace picker modal.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        const list = Array.from(nodes).filter((el) => el.offsetParent !== null)
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else if (!active || active === last || !dialogRef.current.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const visibleTemplate: TemplateId = previewTemplateId ?? currentTemplate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        tabIndex={-1}
        className="bg-[var(--color-surface)] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden outline-none"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div>
            <h2 id="template-picker-title" className="text-base font-bold text-[var(--color-text-primary)]">
              {t('templates.title')}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md">
              {t('templates.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('templates.close')}
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => {
            const isActive = currentTemplate === tpl.id
            const isPreviewing = previewTemplateId === tpl.id && tpl.id !== currentTemplate
            return (
              <div
                key={tpl.id}
                className={`relative flex flex-col rounded-lg border p-4 gap-3 transition-colors ${
                  visibleTemplate === tpl.id
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {/* Miniature swatch — decorative, aria-hidden */}
                <div
                  aria-hidden="true"
                  className="h-16 w-full rounded-md overflow-hidden border border-[var(--color-border)]"
                  style={{ background: tpl.swatch.paper }}
                >
                  <div className="flex h-full">
                    <div className="flex-1 p-2">
                      <div className="h-2 w-16 rounded-full" style={{ background: tpl.swatch.accent }} />
                      <div className="mt-2 h-3.5 w-24 rounded" style={{ background: tpl.swatch.ink, opacity: 0.85 }} />
                      <div className="mt-1.5 h-2 w-12 rounded" style={{ background: tpl.swatch.ink, opacity: 0.35 }} />
                    </div>
                    <div className="w-12 h-full" style={{ background: tpl.swatch.ink, opacity: 0.9 }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      {t(tpl.nameKey)}
                    </span>
                    {tpl.pro && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--on-primary)]">
                        <Crown className="h-3 w-3" aria-hidden="true" />
                        {t('templates.proBadge')}
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-success)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {t('templates.currentBadge')}
                      </span>
                    )}
                    {isPreviewing && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-secondary)]">
                        <Eye className="h-3 w-3" aria-hidden="true" />
                        {t('templates.previewBadge')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t(tpl.descKey)}</p>
                </div>

                {/* Free-plan restriction: preview allowed, apply locked */}
                {tpl.pro && isFreePlan && (
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {t('templates.previewOnlyFree')}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview(isPreviewing ? null : tpl.id)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    aria-pressed={isPreviewing}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {isPreviewing ? t('templates.exitPreview') : t('templates.preview')}
                  </button>

                  {tpl.pro && isFreePlan ? (
                    <a
                      href={upgradeHref}
                      target={upgradeHref.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-bold text-[var(--on-primary)] hover:opacity-90 cursor-pointer"
                    >
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('templates.upgradeCta')}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onApply(tpl.id)}
                      disabled={applying || (tpl.id === currentTemplate && !previewTemplateId)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 text-xs font-bold text-[var(--on-primary)] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applying ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                          {t('templates.applying')}
                        </>
                      ) : (
                        <>
                          <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
                          {tpl.id === currentTemplate ? t('templates.applyAgain') : t('templates.apply')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-5 py-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">{t('templates.previewBanner')}</p>
          <button
            type="button"
            onClick={() => {
              onPreview(null)
              onClose()
            }}
            className="inline-flex min-h-[36px] items-center rounded-md border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] cursor-pointer"
          >
            {t('templates.done')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplatePickerModal
