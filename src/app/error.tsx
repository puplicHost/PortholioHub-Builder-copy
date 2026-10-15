'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/I18nProvider'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)]">
        <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {t('error.title')}
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6">
        {process.env.NODE_ENV === 'development' ? error.message : t('error.body')}
      </p>
      <Button onClick={reset}>
        {t('error.tryAgain')}
      </Button>
    </div>
  )
}
