import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { sanitizeAuditMeta } from '@/lib/audit'
import { DataTable } from '@/components/admin/DataTable'
import { AuditDetailModal } from '@/components/admin/AuditDetailModal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Audit log | Admin',
}

interface AuditLogPageProps {
  searchParams: Promise<{ actor?: string; action?: string; from?: string; to?: string; page?: string; pageSize?: string }>
}

export default async function AdminAuditLogPage({ searchParams }: AuditLogPageProps) {
  const sp = await searchParams
  const actor = (sp.actor || '').trim()
  const action = (sp.action || '').trim()
  const from = sp.from || ''
  const to = sp.to || ''
  const params = new URLSearchParams()
  if (actor) params.set('actor', actor)
  if (action) params.set('action', action)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const { page, pageSize, skip, take } = parsePagination(params)

  const createdAt: { gte?: Date; lte?: Date } = {}
  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.lte = toDate

  const where = {
    ...(actor ? { adminId: actor } : {}),
    ...(action ? { action: { contains: action, mode: 'insensitive' as const } } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        metadata: true,
        createdAt: true,
        admin: { select: { email: true } },
        targetUser: { select: { id: true, email: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)
  const hasFilters = Boolean(actor || action || from || to)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Audit log</h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          {total} administrative audit trail events
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            id="audit-action"
            name="action"
            label="Filter action"
            defaultValue={action}
            placeholder="e.g. user.suspend, plan.update…"
          />
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            id="audit-from"
            name="from"
            label="From date"
            type="date"
            defaultValue={from}
          />
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            id="audit-to"
            name="to"
            label="To date"
            type="date"
            defaultValue={to}
          />
        </div>
        <div className="flex items-center gap-2 h-12">
          <Button type="submit" variant="secondary" size="md">
            Filter
          </Button>
          {hasFilters && (
            <Link
              href="/admin/audit-log"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors h-[42px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Link>
          )}
        </div>
      </form>

      <DataTable
        columns={[
          { key: 'when', header: 'Date' },
          { key: 'admin', header: 'Admin' },
          { key: 'action', header: 'Action' },
          { key: 'target', header: 'Target' },
          { key: 'detail', header: 'Actions' },
        ]}
        rows={rows.map((r) => {
          const targetUserStr = r.targetUser?.email ? ` (${r.targetUser.email})` : ''
          return {
            when: (
              <span className="text-xs">
                {new Date(r.createdAt).toLocaleDateString()}
                <span className="block text-[10px] text-[var(--color-text-muted)]">
                  {new Date(r.createdAt).toLocaleTimeString()}
                </span>
              </span>
            ),
            admin: r.admin?.email || '—',
            action: (
              <code className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                {r.action}
              </code>
            ),
            target: (
              <span className="text-xs">
                {r.targetType}
                {r.targetUser ? (
                  <Link href={`/admin/users/${r.targetUser.id}`} className="block text-[var(--color-primary)] hover:underline truncate max-w-[180px]">
                    {r.targetUser.email}
                  </Link>
                ) : null}
              </span>
            ),
            detail: (
              <AuditDetailModal
                id={r.id}
                action={r.action}
                adminEmail={r.admin?.email || 'System'}
                target={`${r.targetType}${targetUserStr}`}
                reason={r.reason}
                metadata={sanitizeAuditMeta(r.metadata)}
                createdAt={r.createdAt.toISOString()}
              />
            ),
          }
        })}
        rowKeys={rows.map((r) => r.id)}
        meta={meta}
        basePath="/admin/audit-log"
        params={{ actor, action, from, to }}
        emptyText="No audit entries found with these filters."
      />
    </div>
  )
}
