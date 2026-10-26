'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { useBuilderI18n } from '../i18n/BuilderI18nContext'

export interface ImageDeleteButtonProps {
  onDelete: () => void
  label?: string
  className?: string
}

export function ImageDeleteButton({ onDelete, label, className = '' }: ImageDeleteButtonProps) {
  const { t, locale } = useBuilderI18n()
  const defaultLabel = locale === 'ar' ? 'حذف الصورة' : 'Remove'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDelete()
      }}
      className={`h-[44px] min-h-[44px] px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900 text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${className}`}
      title={label || defaultLabel}
      aria-label={label || defaultLabel}
    >
      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label || defaultLabel}</span>
    </button>
  )
}
