'use client'

import { useI18n } from '@/components/I18nProvider'
import { Globe } from 'lucide-react'
import type { PortfolioAnalyticsCountry } from '@/lib/actions/portfolio'

// Top ~24 ISO codes with English + Arabic names. Unmapped codes fall
// back to the raw code; 'unknown' renders as "Unknown visitor".
const COUNTRY_NAMES: Record<string, { en: string; ar: string }> = {
  EG: { en: 'Egypt', ar: 'مصر' },
  SA: { en: 'Saudi Arabia', ar: 'السعودية' },
  AE: { en: 'UAE', ar: 'الإمارات' },
  QA: { en: 'Qatar', ar: 'قطر' },
  KW: { en: 'Kuwait', ar: 'الكويت' },
  BH: { en: 'Bahrain', ar: 'البحرين' },
  OM: { en: 'Oman', ar: 'عمان' },
  JO: { en: 'Jordan', ar: 'الأردن' },
  LB: { en: 'Lebanon', ar: 'لبنان' },
  IQ: { en: 'Iraq', ar: 'العراق' },
  MA: { en: 'Morocco', ar: 'المغرب' },
  DZ: { en: 'Algeria', ar: 'الجزائر' },
  TN: { en: 'Tunisia', ar: 'تونس' },
  LY: { en: 'Libya', ar: 'ليبيا' },
  SD: { en: 'Sudan', ar: 'السودان' },
  PS: { en: 'Palestine', ar: 'فلسطين' },
  YE: { en: 'Yemen', ar: 'اليمن' },
  SY: { en: 'Syria', ar: 'سوريا' },
  US: { en: 'United States', ar: 'الولايات المتحدة' },
  GB: { en: 'United Kingdom', ar: 'بريطانيا' },
  DE: { en: 'Germany', ar: 'ألمانيا' },
  FR: { en: 'France', ar: 'فرنسا' },
  NL: { en: 'Netherlands', ar: 'هولندا' },
  CA: { en: 'Canada', ar: 'كندا' },
}

const DOT_PALETTE = [
  'bg-blue-500 shadow-blue-500/40',
  'bg-emerald-500 shadow-emerald-500/40',
  'bg-purple-500 shadow-purple-500/40',
  'bg-amber-500 shadow-amber-500/40',
  'bg-rose-500 shadow-rose-500/40',
  'bg-cyan-500 shadow-cyan-500/40',
  'bg-orange-500 shadow-orange-500/40',
  'bg-indigo-500 shadow-indigo-500/40',
]

export function TopCountries({ items }: { items: PortfolioAnalyticsCountry[] }) {
  const { t, lang } = useI18n()

  if (items.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center px-4 py-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 max-w-[200px] items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
          <Globe className="h-6 w-6 max-w-[200px] opacity-60" />
        </div>
        <p className="text-center text-sm text-[var(--color-text-muted)]">{t('No country data yet')}</p>
      </div>
    )
  }

  const totalViews = items.reduce((sum, item) => sum + item.views, 0)
  const max = Math.max(1, ...items.map((i) => i.views))

  return (
    <ul className="w-full min-w-0 max-w-full space-y-3 overflow-x-hidden">
      {items.map((item, idx) => {
        const isUnknown = item.country === 'unknown'
        const name = isUnknown ? t('Unknown visitor') : COUNTRY_NAMES[item.country]?.[lang] || item.country
        const sharePct = totalViews > 0 ? Math.round((item.views / totalViews) * 100) : 0
        const barWidth = Math.max(5, Math.round((item.views / max) * 100))
        const dotColor = DOT_PALETTE[idx % DOT_PALETTE.length]

        return (
          <li
            key={item.country}
            className="group flex flex-col gap-1.5 rounded-xl p-2 transition-colors hover:bg-[var(--color-surface-secondary)]/50"
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ${dotColor}`} />
              
              {!isUnknown && (
                <span className="w-8 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-[var(--color-text-muted)]">
                  {item.country}
                </span>
              )}

              <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-text-primary)]">
                {name}
              </span>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {sharePct}%
                </span>
                <span className="w-10 text-right font-bold tabular-nums text-[var(--color-text-primary)]">
                  {item.views.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Micro progress bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-secondary)]/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
