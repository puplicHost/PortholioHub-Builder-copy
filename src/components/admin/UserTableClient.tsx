'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Download,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from './StatusBadge'
import { AdminModal, AdminConfirmModal } from './AdminModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { exportCsvFile } from './CsvExportButton'
import { useToast } from '@/components/ui/Toast'
import type { PageMeta } from '@/lib/pagination'

export interface UserRowData {
  id: string
  email: string
  displayName: string | null
  phone: string | null
  isAdmin: boolean
  status: string
  lastLoginAt: string | Date | null
  createdAt: string | Date
}

interface UserTableClientProps {
  users: UserRowData[]
  meta: PageMeta
  basePath: string
  params: Record<string, string>
}

export function UserTableClient({ users, meta, basePath, params }: UserTableClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [unsuspendModalOpen, setUnsuspendModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [busy, setBusy] = useState(false)

  const allSelected = users.length > 0 && selectedIds.length === users.length
  const hasFilters = Boolean(params.search || params.status)

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map((u) => u.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const pageHref = (page: number) => {
    const search = new URLSearchParams({
      ...params,
      page: String(page),
      pageSize: String(meta.pageSize),
    })
    return `${basePath}?${search.toString()}`
  }

  // Export CSV helper
  const handleExport = (subsetOnly = false) => {
    const exportUsers = subsetOnly
      ? users.filter((u) => selectedIds.includes(u.id))
      : users

    if (exportUsers.length === 0) {
      toast('info', 'No user records to export')
      return
    }

    const headers = [
      'User ID',
      'Email',
      'Display Name',
      'Phone',
      'Status',
      'Role',
      'Last Login',
      'Registered At',
    ]

    const rows = exportUsers.map((u) => [
      u.id,
      u.email,
      u.displayName || '',
      u.phone || '',
      u.status,
      u.isAdmin ? 'Admin' : 'Member',
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : '',
      new Date(u.createdAt).toISOString(),
    ])

    const dateStr = new Date().toISOString().split('T')[0]
    exportCsvFile(`portfoliohub-users-${dateStr}.csv`, headers, rows)
    toast('success', `Exported ${exportUsers.length} users to CSV`)
  }

  // Bulk Suspend
  const handleBulkSuspend = async () => {
    setBusy(true)
    let succeeded = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST' })
        if (res.ok) succeeded++
        else failed++
      } catch {
        failed++
      }
    }

    setBusy(false)
    setSuspendModalOpen(false)
    setSelectedIds([])

    if (failed === 0) {
      toast('success', `Successfully suspended ${succeeded} users`)
    } else {
      toast('warning', `Suspended ${succeeded} users (${failed} skipped or admin-protected)`)
    }
    router.refresh()
  }

  // Bulk Unsuspend
  const handleBulkUnsuspend = async () => {
    setBusy(true)
    let succeeded = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/users/${id}/unsuspend`, { method: 'POST' })
        if (res.ok) succeeded++
        else failed++
      } catch {
        failed++
      }
    }

    setBusy(false)
    setUnsuspendModalOpen(false)
    setSelectedIds([])

    if (failed === 0) {
      toast('success', `Successfully restored ${succeeded} users to Active`)
    } else {
      toast('warning', `Restored ${succeeded} users (${failed} failed)`)
    }
    router.refresh()
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      toast('error', 'Please type DELETE to confirm deletion')
      return
    }

    setBusy(true)
    let succeeded = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        if (res.ok) succeeded++
        else failed++
      } catch {
        failed++
      }
    }

    setBusy(false)
    setDeleteModalOpen(false)
    setDeleteConfirmText('')
    setSelectedIds([])

    if (failed === 0) {
      toast('success', `Deleted ${succeeded} user${succeeded === 1 ? '' : 's'} successfully`)
    } else {
      toast('warning', `Deleted ${succeeded} users (${failed} skipped or admin-protected)`)
    }
    router.refresh()
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
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--color-text-muted)]">
          {selectedIds.length > 0
            ? `${selectedIds.length} of ${users.length} selected on this page`
            : `${users.length} users displayed`}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => handleExport(false)}
          className="inline-flex items-center gap-1.5"
          title="Export all displayed users to CSV"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export All On Page</span>
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-8">
          <EmptyState
            icon={Inbox}
            title="No users found"
            description={
              hasFilters
                ? 'No users match your active search or status filters.'
                : 'There are currently no registered users in the database.'
            }
            actionLabel={hasFilters ? 'Clear filters' : 'Refresh'}
            onAction={handleEmptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/70">
                <th scope="col" className="w-10 px-4 py-3 text-start">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all users on this page"
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  Name / Role
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  Last Login
                </th>
                <th scope="col" className="px-4 py-3 text-end rtl:text-start text-xs font-semibold text-[var(--color-text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {users.map((u) => {
                const isChecked = selectedIds.includes(u.id)
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isChecked
                        ? 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10'
                        : 'hover:bg-[var(--color-surface-secondary)]/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-start">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(u.id)}
                        aria-label={`Select user ${u.email}`}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-start font-medium text-[var(--color-primary)]">
                      <Link href={`/admin/users/${u.id}`} className="hover:underline">
                        {u.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-start text-[var(--color-text-primary)]">
                      <span>{u.displayName || '—'}</span>
                      {u.isAdmin && (
                        <span className="ms-1.5 inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-start text-xs text-[var(--color-text-muted)]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-end rtl:text-start">
                      <Link
                        href={`/admin/users/${u.id}`}
                        title="Manage user account"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <aside
          aria-label="Bulk actions toolbar"
          className="sticky bottom-4 z-40 flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              users selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleExport(true)}
              className="inline-flex items-center gap-1"
              title="Export selected users to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Selected</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setUnsuspendModalOpen(true)}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
              title="Restore selected accounts to Active"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Unsuspend</span>
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setSuspendModalOpen(true)}
              className="inline-flex items-center gap-1"
              title="Suspend access for selected users"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Suspend</span>
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteConfirmText('')
                setDeleteModalOpen(true)
              }}
              className="inline-flex items-center gap-1 !bg-rose-700 hover:!bg-rose-800 text-white"
              title="Permanently hard-delete selected accounts"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected</span>
            </Button>

            <button
              onClick={() => setSelectedIds([])}
              title="Clear selection"
              aria-label="Clear selection"
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
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

      {/* Bulk Suspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={suspendModalOpen}
        onClose={() => !busy && setSuspendModalOpen(false)}
        onConfirm={handleBulkSuspend}
        title={`Suspend ${selectedIds.length} Selected Users`}
        description={`Are you sure you want to suspend access for ${selectedIds.length} accounts? Their active browser sessions will be terminated.`}
        confirmText="Suspend accounts"
        variant="danger"
        loading={busy}
      />

      {/* Bulk Unsuspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={unsuspendModalOpen}
        onClose={() => !busy && setUnsuspendModalOpen(false)}
        onConfirm={handleBulkUnsuspend}
        title={`Unsuspend ${selectedIds.length} Selected Users`}
        description={`Restore full account access and active status for ${selectedIds.length} selected accounts?`}
        confirmText="Restore accounts"
        variant="primary"
        loading={busy}
      />

      {/* Bulk Delete Modal with DELETE typing confirmation and user list */}
      <AdminModal
        isOpen={deleteModalOpen}
        onClose={() => !busy && setDeleteModalOpen(false)}
        title={`Permanently Delete ${selectedIds.length} Users`}
        description="Permanently purge selected user accounts and all associated data."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 p-3 text-[var(--color-danger)]">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Destructive and Irreversible</p>
              <p className="leading-relaxed">
                This will permanently delete all {selectedIds.length} selected users, their portfolios, subscriptions, uploaded media, and workspaces.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Users to be deleted ({selectedUsers.length}):
            </span>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-2 divide-y divide-[var(--color-border)] text-xs">
              {selectedUsers.map((u) => (
                <div key={u.id} className="py-1 px-1 flex items-center justify-between">
                  <span className="font-medium text-[var(--color-text-primary)]">{u.displayName || u.email}</span>
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{u.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Type <strong className="font-mono text-[var(--color-danger)]">DELETE</strong> to confirm permanent deletion:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="font-mono text-xs"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleteConfirmText.trim() !== 'DELETE' || busy}
              loading={busy}
              onClick={handleBulkDelete}
              className="!bg-rose-700 hover:!bg-rose-800 text-white"
            >
              Delete {selectedIds.length} Accounts Permanently
            </Button>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
