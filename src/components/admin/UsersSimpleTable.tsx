'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { UserDetailsDrawer } from './UserDetailsDrawer'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PageMeta } from '@/lib/pagination'

export interface SimpleUserRow {
  id: string
  displayName: string | null
  email: string
  badgeStatus: string
  badgeLabel: string
  expiresAt: string | null
}

interface UsersSimpleTableProps {
  rows: SimpleUserRow[]
  meta: PageMeta
  basePath: string
  params: Record<string, string>
  hasFilters: boolean
}

// Clean simple users table: name, email, status badge, expiry, details
// button that opens the slide-over UserDetailsDrawer. No bulk checkboxes.
export function UsersSimpleTable({ rows, meta, basePath, params, hasFilters }: UsersSimpleTableProps) {
  const router = useRouter()
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)

  const pageHref = (page: number) => {
    const search = new URLSearchParams({ ...params, page: String(page), pageSize: String(meta.pageSize) })
    return `${basePath}?${search.toString()}`
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-8">
          <EmptyState
            icon={Inbox}
            title="لا يوجد مستخدمون"
            description={hasFilters ? 'لا يوجد مستخدمون يطابقون البحث الحالي.' : 'لا يوجد مستخدمون مسجلون بعد.'}
            actionLabel={hasFilters ? 'مسح الفلاتر' : 'تحديث'}
            onAction={() => (hasFilters ? router.push(basePath) : router.refresh())}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/70">
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  الاسم
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  الإيميل
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  الحالة
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  تاريخ الانتهاء
                </th>
                <th scope="col" className="px-4 py-3 text-end rtl:text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--color-surface-secondary)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                    {u.displayName || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]" dir="ltr">
                    <span className="block text-end">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.badgeStatus} label={u.badgeLabel} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]" dir="ltr">
                    <span className="block text-end">{u.expiresAt ?? 'لا يوجد'}</span>
                  </td>
                  <td className="px-4 py-3 text-end rtl:text-start">
                    <button
                      type="button"
                      onClick={() => setDrawerUserId(u.id)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
                    >
                      التفاصيل
                    </button>
                  </td>
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
              className="inline-flex min-h-[44px] items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-medium transition-colors"
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
              className="inline-flex min-h-[44px] items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-medium transition-colors"
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

      <UserDetailsDrawer
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  )
}
