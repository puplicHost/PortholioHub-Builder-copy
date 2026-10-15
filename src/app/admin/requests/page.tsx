import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { RequestActions } from '@/components/admin/RequestActions'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Subscription requests | Admin',
}

interface RequestsPageProps {
  searchParams: Promise<{ status?: string; page?: string; pageSize?: string }>
}

export default async function AdminRequestsPage({ searchParams }: RequestsPageProps) {
  const sp = await searchParams
  const status = sp.status === 'PENDING' || sp.status === 'APPROVED' || sp.status === 'REJECTED' || sp.status === 'CANCELED'
    ? sp.status
    : 'PENDING'
  const params = new URLSearchParams()
  params.set('status', status)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = { status }
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Subscription requests</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELED">Canceled</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <DataTable
        columns={[
          { key: 'request', header: 'Request' },
          { key: 'user', header: 'User' },
          { key: 'plan', header: 'Plan' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((r) => ({
          request: (
            <span>
              <code className="text-xs font-mono font-bold">{r.code}</code>
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
              {r.note && <span className="block text-xs text-[var(--color-text-muted)]">{r.note}</span>}
            </span>
          ),
          user: (
            <span>
              {r.user.displayName || r.user.email}
              <span className="block text-xs text-[var(--color-text-muted)]">
                {r.user.email} · {r.user.phone || 'no phone'}
              </span>
            </span>
          ),
          plan: `${typeof r.plan.name === 'string' ? r.plan.name : r.plan.id} (${r.plan.priceEgp} EGP)`,
          actions: r.status === 'PENDING' ? <RequestActions requestId={r.id} /> : r.status,
        }))}
        rowKeys={items.map((r) => r.id)}
        meta={meta}
        basePath="/admin/requests"
        params={{ status }}
        emptyText="No requests with this status."
      />
    </div>
  )
}
