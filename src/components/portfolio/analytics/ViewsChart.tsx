'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
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

  if (daily.length === 0) {
    return (
      <div className="flex h-[200px] w-full min-w-0 flex-col items-center justify-center p-6 text-center md:h-[300px]">
        <div className="mx-auto mb-3 flex h-14 w-14 max-w-[200px] items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
          <BarChart3 className="h-7 w-7 max-w-[200px] opacity-60" />
        </div>
        <p className="text-center text-sm text-slate-400">No traffic recorded for this range.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="flex min-w-0 gap-2 md:gap-4">
        {/* Y-Axis scale */}
        <div
          className="flex h-[200px] w-8 shrink-0 flex-col justify-between py-1 text-right font-mono text-[10px] font-medium text-slate-400 select-none md:h-[300px] md:text-[11px]"
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span key={t.pct}>{t.label}</span>
          ))}
        </div>

        {/* Chart Canvas Area */}
        <div className="relative min-w-0 flex-1">
          {/* Horizontal gridlines — hidden on mobile to reduce visual noise */}
          <div className="pointer-events-none absolute inset-0 hidden flex-col justify-between md:flex" aria-hidden="true">
            {ticks.map((t) => (
              <div
                key={t.pct}
                className="w-full border-t border-slate-100 dark:border-slate-800/80"
              />
            ))}
          </div>

          {/* Bar track container — 200px mobile / 300px desktop */}
          <div
            className="relative flex h-[200px] min-w-0 items-end gap-1 px-1 md:h-[300px] md:gap-2 md:px-2"
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
                  {/* Outer capsule track (Boltshift signature pill track) — reduced bar width on mobile */}
                  <div className="relative flex h-full w-full max-w-[18px] sm:max-w-[28px] md:max-w-[44px] flex-col justify-end overflow-hidden rounded-xl bg-[#f1f5f9]/70 p-0.5 md:rounded-2xl md:p-1 dark:bg-slate-800/50">
                    {/* Inner filled bar — no transition on mobile (low-end perf) */}
                    <div
                      className={`relative w-full rounded-lg md:rounded-xl md:transition-all md:duration-300 ${
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
                    <div className="pointer-events-none absolute -top-4 left-1/2 z-30 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-full min-w-[140px] rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-2xl md:animate-in md:fade-in md:zoom-in-95 md:duration-150 dark:border-slate-800 dark:bg-slate-900">
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

      {/* X-Axis Month / Day Labels — sparse on mobile, smaller font */}
      <div className="flex min-w-0 justify-between overflow-x-hidden pl-10 pr-2 text-[10px] font-medium text-slate-400 select-none md:pl-12 md:pr-4 md:text-[11px]">
        {daily.map((d, i) => {
          // Show every 3rd or 4th label on dense ranges, or all if <= 10.
          // On mobile show only first/last to avoid crowding.
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
