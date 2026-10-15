'use client'

import { useState } from 'react'
import { ImageIcon, ExternalLink, Search, ArrowUpDown } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import type { PortfolioAnalyticsProject } from '@/lib/actions/portfolio'

interface ProjectViewsProps {
  items: PortfolioAnalyticsProject[]
  username?: string
}

export function ProjectViews({ items, username }: { items: PortfolioAnalyticsProject[]; username?: string }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'views' | 'title'>('views')

  const totalViews = items.reduce((sum, item) => sum + item.views, 0)
  const maxViews = Math.max(1, ...items.map((i) => i.views))

  // Filter & sort
  const filtered = items
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.slug && p.slug.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return b.views - a.views
    })

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar (Boltshift style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full h-9 rounded-full border border-slate-200/80 bg-[#f8fafc] pl-9 pr-4 text-xs text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'views' ? 'title' : 'views')}
          className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-[#2563eb] hover:text-[#0f172a] transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span>Sort by: {sortBy === 'views' ? 'Views' : 'Title'}</span>
        </button>
      </div>

      {/* Projects Table (Boltshift style) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 dark:border-slate-800">
              <th className="pb-3 pl-2 w-10">#</th>
              <th className="pb-3 font-medium">Project info</th>
              <th className="pb-3 font-medium">Slug / Path</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Traffic share</th>
              <th className="pb-3 text-right pr-3 font-medium">Total views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
            {filtered.map((item, idx) => {
              const rank = idx + 1
              const sharePct = totalViews > 0 ? Math.round((item.views / totalViews) * 100) : 0
              const barWidth = Math.max(6, Math.round((item.views / maxViews) * 100))
              const projectHref = username && item.slug ? `/u/${username}/projects/${item.slug}` : null

              return (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-[#f8fafc] dark:hover:bg-white/[0.02]"
                >
                  {/* Rank / Index */}
                  <td className="py-3.5 pl-2 font-mono text-[11px] text-slate-400">
                    {String(rank).padStart(2, '0')}
                  </td>

                  {/* Project Info: Cover + Title */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = 'none'
                            }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <ImageIcon className="h-4 w-4 opacity-60" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {projectHref ? (
                            <a
                              href={projectHref}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate font-bold text-[#0f172a] hover:text-[#2563eb] transition-colors dark:text-white flex items-center gap-1"
                            >
                              <span className="truncate">{item.title}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
                            </a>
                          ) : (
                            <span className="truncate font-bold text-[#0f172a] dark:text-white">
                              {item.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Slug / Path */}
                  <td className="py-3.5 pr-4 font-mono text-[11px] text-slate-400">
                    {item.slug ? `/projects/${item.slug}` : '—'}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </td>

                  {/* Traffic Share Bar */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#2563eb] transition-all duration-300"
                          style={{ width: `${item.views > 0 ? barWidth : 0}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {sharePct}%
                      </span>
                    </div>
                  </td>

                  {/* Total Views */}
                  <td className="py-3.5 pr-3 text-right">
                    <span className="font-mono text-sm font-extrabold text-[#0f172a] dark:text-white">
                      {item.views.toLocaleString()}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching projects found.
          </div>
        )}
      </div>
    </div>
  )
}
