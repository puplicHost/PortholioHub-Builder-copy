'use client'

import { useState } from 'react'
import type { PortfolioAnalyticsDay } from '@/lib/actions/portfolio'

// Boltshift-style Bar Chart:
// Light capsule track behind each bar, active bar with diagonal stripes/accent dot,
// and floating white tooltip card.
export function ViewsChart({ daily }: { daily: PortfolioAnalyticsDay[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const max = Math.max(1, ...daily.map((d) => d.views))

  // 5 Y-axis ticks
  const ticks = [
    { pct: 100, label: max >= 1000 ? `${(max / 1000).toFixed(1)}k` : String(max) },
    { pct: 75, label: max * 0.75 >= 1000 ? `${((max * 0.75) / 1000).toFixed(1)}k` : String(Math.round(max * 0.75)) },
    { pct: 50, label: max * 0.5 >= 1000 ? `${((max * 0.5) / 1000).toFixed(1)}k` : String(Math.round(max * 0.5)) },
    { pct: 25, label: max * 0.25 >= 1000 ? `${((max * 0.25) / 1000).toFixed(1)}k` : String(Math.round(max * 0.25)) },
    { pct: 0, label: '0' },
  ]

  // Default active bar is the peak day (or latest day if all 0)
  const peakIdx = daily.reduce(
    (best, d, i) => (d.views > daily[best].views ? i : best),
    daily.length - 1,
  )
  const activeIdx = hoveredIdx !== null ? hoveredIdx : peakIdx

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* Y-Axis scale */}
        <div
          className="flex h-52 w-8 shrink-0 flex-col justify-between py-1 text-right font-mono text-[11px] font-medium text-slate-400 select-none"
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span key={t.pct}>{t.label}</span>
          ))}
        </div>

        {/* Chart Canvas Area */}
        <div className="relative flex-1">
          {/* Horizontal gridlines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((t) => (
              <div
                key={t.pct}
                className="w-full border-t border-slate-100 dark:border-slate-800/80"
              />
            ))}
          </div>

          {/* Bar track container */}
          <div
            className="relative flex h-52 items-end gap-2 sm:gap-3 px-2"
            role="img"
            aria-label="Performance Overview Bar Chart"
          >
            {daily.map((d, i) => {
              const isActive = i === activeIdx
              const heightPct = Math.max(8, Math.round((d.views / max) * 100))

              return (
                <div
                  key={d.date}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.date}: ${d.views} views`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(i)}
                  onBlur={() => setHoveredIdx(null)}
                  className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end items-center focus-visible:outline-2 focus-visible:outline-[#2563eb]"
                >
                  {/* Outer capsule track (Boltshift signature pill track) */}
                  <div className="relative w-full max-w-[44px] h-full rounded-2xl bg-[#f1f5f9]/70 dark:bg-slate-800/50 flex flex-col justify-end overflow-hidden p-1">
                    {/* Inner filled bar */}
                    <div
                      className={`w-full rounded-xl transition-all duration-300 relative ${
                        isActive
                          ? 'bg-[#2563eb] shadow-md shadow-blue-500/20'
                          : 'bg-[#cbd5e1]/80 dark:bg-slate-700/80 group-hover:bg-[#94a3b8]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Active bar diagonal texture */}
                      {isActive && (
                        <div
                          className="absolute inset-0 opacity-25"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.7) 4px, rgba(255,255,255,0.7) 8px)',
                          }}
                        />
                      )}

                      {/* Top circular indicator dot on active bar */}
                      {isActive && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-white ring-2 ring-[#2563eb] shadow-sm z-10" />
                      )}
                    </div>
                  </div>

                  {/* Boltshift-style Floating Tooltip Card */}
                  {isActive && (
                    <div className="pointer-events-none absolute -top-4 left-1/2 z-30 -translate-x-1/2 -translate-y-full min-w-[140px] rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
                      <p className="font-semibold text-xs text-[#0f172a] dark:text-white">
                        {d.date}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            Total Views
                          </span>
                          <span className="font-mono font-bold text-[#0f172a] dark:text-white">
                            {d.views}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                            Peak Ratio
                          </span>
                          <span className="font-mono font-bold text-[#2563eb]">
                            {Math.round((d.views / max) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Month / Day Labels */}
      <div className="flex justify-between pl-12 pr-4 text-[11px] font-medium text-slate-400 select-none">
        {daily.map((d, i) => {
          // Show every 3rd or 4th label on dense ranges, or all if <= 10
          const shouldShow =
            daily.length <= 10 ||
            i === 0 ||
            i === Math.floor(daily.length / 2) ||
            i === daily.length - 1 ||
            i % 5 === 0

          return (
            <span
              key={d.date}
              className={`transition-colors ${
                i === activeIdx ? 'font-bold text-[#2563eb]' : 'text-slate-400'
              }`}
            >
              {shouldShow ? d.date.slice(5) : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
