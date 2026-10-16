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
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      {/* Top Search & Filter Bar — stacked full-width on mobile (< md: 768px) */}
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 w-full flex-1 md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="h-11 max-h-[44px] min-h-[44px] w-full rounded-full border border-slate-200/80 bg-[#f8fafc] pl-9 pr-4 text-base text-[#0f172a] placeholder:text-slate-400 focus:border-[#2563eb] focus:bg-white focus:outline-none transition-all md:h-9 md:min-h-[36px] md:text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'views' ? 'title' : 'views')}
          aria-label={`Sort by ${sortBy === 'views' ? 'title' : 'views'}`}
          className="flex max-h-[44px] min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-[#2563eb] hover:text-[#0f172a] transition-all md:w-auto md:min-h-[36px] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Sort by: {sortBy === 'views' ? 'Views' : 'Title'}</span>
        </button>
      </div>

      {/* Projects Table — on mobile only Project info + Total views stay visible */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-0 text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 dark:border-slate-800">
              <th className="hidden w-10 pb-3 pl-2 md:table-cell">#</th>
              <th className="pb-3 font-medium">Project info</th>
              <th className="hidden pb-3 font-medium md:table-cell">Slug / Path</th>
              <th className="hidden pb-3 font-medium md:table-cell">Status</th>
              <th className="hidden pb-3 font-medium md:table-cell">Traffic share</th>
              <th className="pb-3 pr-3 text-right font-medium">Total views</th>
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
                  {/* Rank / Index — desktop only */}
                  <td className="hidden py-3.5 pl-2 font-mono text-[11px] text-slate-400 md:table-cell">
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

                  {/* Slug / Path — desktop only */}
                  <td className="hidden py-3.5 pr-4 font-mono text-[11px] text-slate-400 md:table-cell">
                    {item.slug ? `/projects/${item.slug}` : '—'}
                  </td>

                  {/* Status Badge — desktop only */}
                  <td className="hidden py-3.5 pr-4 md:table-cell">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </td>

                  {/* Traffic Share Bar — desktop only */}
                  <td className="hidden py-3.5 pr-4 md:table-cell">
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
          <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 max-w-[200px] items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <ImageIcon className="h-6 w-6 max-w-[200px] opacity-60" />
            </div>
            <p className="text-center text-sm text-slate-400">
              {search ? t('No matching projects found') : t('No projects found')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
