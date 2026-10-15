import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { SubscriptionActions } from '@/components/admin/SubscriptionActions'

export const metadata = {
  title: 'Subscriptions | Admin',
}

interface SubscriptionsPageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const sp = await searchParams
  const params = new URLSearchParams()
  if (sp.page) params.set('page', sp.page)
  if (sp.pageSize) params.set('pageSize', sp.pageSize)
  const { page, pageSize, skip, take } = parsePagination(params)

  const [total, items] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.findMany({
      orderBy: { startedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        canceledAt: true,
        amountEgp: true,
        user: { select: { id: true, email: true, displayName: true } },
        plan: { select: { id: true, name: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Subscriptions</h1>
      <DataTable
        columns={[
          { key: 'user', header: 'User' },
          { key: 'plan', header: 'Plan' },
          { key: 'period', header: 'Period' },
          { key: 'state', header: 'State' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((s) => ({
          user: (
            <span>
              {s.user.displayName || s.user.email}
              <span className="block text-xs text-[var(--color-text-muted)]">{s.user.email}</span>
            </span>
          ),
          plan: `${typeof s.plan.name === 'string' ? s.plan.name : s.plan.id}`,
          period: (
            <span className="text-xs">
              {new Date(s.startedAt).toLocaleDateString()} → {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
            </span>
          ),
          state: s.canceledAt ? 'SUSPENDED' : s.status,
          actions: <SubscriptionActions subscriptionId={s.id} canceled={!!s.canceledAt} />,
        }))}
        rowKeys={items.map((s) => s.id)}
        meta={meta}
        basePath="/admin/subscriptions"
        params={{}}
        emptyText="No subscriptions yet."
      />
    </div>
  )
}
