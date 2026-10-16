import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RequestActions } from '@/components/admin/RequestActions'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Subscription requests | Admin',
}

interface RequestsPageProps {
  searchParams: Promise<{ status?: string; page?: string; pageSize?: string }>
}

export default async function AdminRequestsPage({ searchParams }: RequestsPageProps) {
  const sp = await searchParams
  const rawStatus = sp.status
  const status =
    rawStatus === 'PENDING' || rawStatus === 'APPROVED' || rawStatus === 'REJECTED' || rawStatus === 'CANCELED'
      ? rawStatus
      : rawStatus === 'ALL'
      ? ''
      : 'PENDING'

  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = status ? { status } : {}
  const [total, items] = await Promise.all([
    prisma.subscriptionRequest.count({ where }),
    prisma.subscriptionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        code: true,
        status: true,
        note: true,
        createdAt: true,
        user: { select: { id: true, email: true, displayName: true, phone: true } },
        plan: { select: { id: true, name: true, priceEgp: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)
  const isFiltered = status !== 'PENDING'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Subscription requests</h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          {total} {status ? status.toLowerCase() : 'total'} requests
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={status || 'ALL'}
          aria-label="Filter requests by status"
          className="h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="PENDING">Pending (action required)</option>
          <option value="ALL">All statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELED">Canceled</option>
        </select>
        <Button type="submit" variant="secondary" size="md">
          Filter
        </Button>
        {isFiltered && (
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to pending
          </Link>
        )}
      </form>

      <DataTable
        columns={[
          { key: 'request', header: 'Request' },
          { key: 'user', header: 'User' },
          { key: 'plan', header: 'Plan' },
          { key: 'status', header: 'Status' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((r) => ({
          request: (
            <span>
              <code className="text-xs font-mono font-bold">{r.code}</code>
              <span className="ms-2 text-xs text-[var(--color-text-muted)]">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
              {r.note && <span className="block text-xs text-[var(--color-text-muted)]">{r.note}</span>}
            </span>
          ),
          user: (
            <span>
              <span className="font-medium text-[var(--color-text-primary)]">{r.user.displayName || r.user.email}</span>
              <span className="block text-xs text-[var(--color-text-muted)]">
                {r.user.email} {r.user.phone ? `(${r.user.phone})` : ''}
              </span>
            </span>
          ),
          plan: `${typeof r.plan.name === 'string' ? r.plan.name : r.plan.id} (${r.plan.priceEgp} EGP)`,
          status: <StatusBadge status={r.status} />,
          actions:
            r.status === 'PENDING' ? (
              <RequestActions requestId={r.id} defaultAmount={r.plan.priceEgp} />
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                Handled
              </span>
            ),
        }))}
        rowKeys={items.map((r) => r.id)}
        meta={meta}
        basePath="/admin/requests"
        params={{ status }}
        emptyText="No subscription requests found with this filter."
      />
    </div>
  )
}
