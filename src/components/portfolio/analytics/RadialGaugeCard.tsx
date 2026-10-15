'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

interface RadialGaugeCardProps {
  percentage: number
  label: string
  metric1: {
    label: string
    value: number | string
    badge?: string
    badgeColor?: string
  }
  metric2: {
    label: string
    value: number | string
    badge?: string
    badgeColor?: string
  }
}

// Boltshift-style Semicircular Segmented Arc Gauge with center percentage and dual sub-cards
export function RadialGaugeCard({ percentage, label, metric1, metric2 }: RadialGaugeCardProps) {
  const { t } = useI18n()
  const [showInfo, setShowInfo] = useState(false)

  // Clamp percentage between 0 and 100
  const validPct = Math.min(100, Math.max(0, isNaN(percentage) ? 0 : percentage))
  const displayPct = validPct.toFixed(1)

  // Semicircle parameters
  const totalSegments = 22
  const filledSegments = Math.round((validPct / 100) * totalSegments)
  const cx = 140
  const cy = 135
  const r1 = 70 // Inner radius
  const r2 = 105 // Outer radius

  const segments = Array.from({ length: totalSegments }).map((_, i) => {
    // Angle from PI (180deg - left) to 0 (0deg - right)
    const angle = Math.PI - (i / (totalSegments - 1)) * Math.PI
    const isFilled = i < filledSegments
    const x1 = cx + r1 * Math.cos(angle)
    const y1 = cy - r1 * Math.sin(angle)
    const x2 = cx + r2 * Math.cos(angle)
    const y2 = cy - r2 * Math.sin(angle)

    return { i, x1, y1, x2, y2, isFilled }
  })

  return (
    <div className="flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
          {t('Visitor Engagement')}
        </h3>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800"
          title="Options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Semicircular Radial Gauge Display */}
      <div className="relative my-2 flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 280 155"
          className="w-full max-w-[260px] overflow-visible select-none"
          role="img"
          aria-label={`Gauge: ${displayPct}%`}
        >
          {segments.map((seg) => (
            <line
              key={seg.i}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.isFilled ? '#2563eb' : 'currentColor'}
              className={seg.isFilled ? 'transition-all duration-300' : 'text-slate-100 dark:text-slate-800'}
              strokeWidth={7}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Center Text inside the Arc */}
        <div className="absolute bottom-2 text-center">
          <p className="font-mono text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
            {displayPct}%
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
        </div>
      </div>

      {/* Bottom Dual Metric Sub-Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-3 dark:border-slate-800/80 dark:bg-slate-900/50">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {metric1.label}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-[#0f172a] dark:text-white">
              {metric1.value}
            </span>
            {metric1.badge && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                {metric1.badge}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-3 dark:border-slate-800/80 dark:bg-slate-900/50">
          <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {metric2.label}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-[#0f172a] dark:text-white">
              {metric2.value}
            </span>
            {metric2.badge && (
              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                {metric2.badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
