'use client'

import { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { useBuilderI18n } from '../i18n/BuilderI18nContext'

interface Usage {
  limitBytes: number
  usedBytes: number
  reservedBytes: number
  remainingBytes: number
  percent: number
  uploadsAllowed: boolean
}

const MIB = 1024 * 1024
function mb(bytes: number) {
  return `${(bytes / MIB).toFixed(bytes >= 100 * MIB ? 0 : 1)} MB`
}

export function StorageUsage({ refreshKey = 0 }: { refreshKey?: number }) {
  const { t } = useBuilderI18n()
  const [usage, setUsage] = useState<Usage | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/me/storage', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unavailable'))))
      .then((data: Usage) => { if (active) { setUsage(data); setFailed(false) } })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [refreshKey])

  if (failed || !usage) return null

  const used = usage.usedBytes + usage.reservedBytes
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3" aria-label={t('storage.title')}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)]">
          <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
          {t('storage.title')}
        </span>
        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
          {mb(used)} / {mb(usage.limitBytes)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]" role="progressbar" aria-valuenow={usage.percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all ${usage.percent >= 100 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary)]'}`}
          style={{ width: `${Math.min(100, usage.percent)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
        {t('storage.remaining')}: {mb(usage.remainingBytes)}
        {usage.reservedBytes > 0 ? ` · ${t('storage.reserved')}: ${mb(usage.reservedBytes)}` : ''}
      </p>
      {!usage.uploadsAllowed && (
        <p className="mt-1 text-[10px] font-semibold text-[var(--color-danger)]">{t('storage.limitReached')}</p>
      )}
    </div>
  )
}