'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)]">
        <span className="text-2xl font-bold text-[var(--color-text-muted)]">404</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {t('notfound.title')}
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6">
        {t('notfound.body')}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t('notfound.goHome')}
      </Link>
    </div>
  )
}
