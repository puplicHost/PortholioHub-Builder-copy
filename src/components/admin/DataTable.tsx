'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
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
// client-side pagination links preserving filters.
export function DataTable({ columns, rows, rowKeys, meta, basePath, params, emptyText }: DataTableProps) {
  const pageHref = (page: number) => {
    const search = new URLSearchParams({ ...params, page: String(page), pageSize: String(meta.pageSize) })
    return `${basePath}?${search.toString()}`
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)]">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={rowKeys[i] ?? i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-secondary)]/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-[var(--color-text-primary)] align-top">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>
          Page {meta.page} of {meta.totalPages} · {meta.total} total
        </span>
        <div className="flex gap-2">
          {meta.page > 1 ? (
            <Link href={pageHref(meta.page - 1)} className="px-3 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]">
              Previous
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-md border border-[var(--color-border)] opacity-40">Previous</span>
          )}
          {meta.page < meta.totalPages ? (
            <Link href={pageHref(meta.page + 1)} className="px-3 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]">
              Next
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-md border border-[var(--color-border)] opacity-40">Next</span>
          )}
        </div>
      </div>
    </div>
  )
}
