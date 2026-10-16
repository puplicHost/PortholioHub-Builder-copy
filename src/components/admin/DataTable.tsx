'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PageMeta } from '@/lib/pagination'

export interface DataColumn {
  key: string
  header: string
}

interface DataTableProps {
  columns: DataColumn[]
  rows: Record<string, ReactNode>[]
  // Precomputed server-side: function props cannot cross the server/client
  // boundary (RSC serialization throws and the whole list fails to load).
  rowKeys: string[]
  meta: PageMeta
  basePath: string
  params: Record<string, string>
  emptyText: string
}

// Shared admin table: server-rendered rows (passed as ReactNode),
// client-side pagination links preserving filters, with rich EmptyState and RTL support.
export function DataTable({ columns, rows, rowKeys, meta, basePath, params, emptyText }: DataTableProps) {
  const router = useRouter()

  const hasFilters = Object.entries(params || {}).some(
    ([k, v]) => k !== 'page' && k !== 'pageSize' && Boolean(v && v.trim())
  )

  const pageHref = (page: number) => {
    const search = new URLSearchParams({ ...params, page: String(page), pageSize: String(meta.pageSize) })
    return `${basePath}?${search.toString()}`
  }

  const handleEmptyAction = () => {
    if (hasFilters) {
      router.push(basePath)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-8">
          <EmptyState
            icon={Inbox}
            title="No records found"
            description={emptyText || 'Try adjusting your search terms or clearing active filters.'}
            actionLabel={hasFilters ? 'Clear filters' : 'Refresh'}
            onAction={handleEmptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/70">
                {columns.map((col) => {
                  const isAction = col.key === 'actions' || col.key === 'detail'
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={`px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] ${
                        isAction ? 'text-end rtl:text-start' : 'text-start'
                      }`}
                    >
                      {col.header}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((row, i) => (
                <tr
                  key={rowKeys[i] ?? i}
                  className="hover:bg-[var(--color-surface-secondary)]/50 transition-colors"
                >
                  {columns.map((col) => {
                    const isAction = col.key === 'actions' || col.key === 'detail'
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-[var(--color-text-primary)] align-middle ${
                          isAction ? 'text-end rtl:text-start' : 'text-start'
                        }`}
                      >
                        {row[col.key]}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)] pt-1">
        <span>
          Showing page {meta.page} of {meta.totalPages || 1} ({meta.total} total)
        </span>
        <div className="flex items-center gap-1.5">
          {meta.page > 1 ? (
            <Link
              href={pageHref(meta.page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-medium transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] opacity-40 cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              Previous
            </span>
          )}

          {meta.page < meta.totalPages ? (
            <Link
              href={pageHref(meta.page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-medium transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] opacity-40 cursor-not-allowed">
              Next
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
