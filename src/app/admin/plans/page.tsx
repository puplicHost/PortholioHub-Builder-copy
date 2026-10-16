import { prisma } from '@/lib/prisma'
import { DataTable } from '@/components/admin/DataTable'
import { PlanCreateToggle } from '@/components/admin/PlanCreateToggle'
import { PlanActions } from '@/components/admin/PlanActions'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { PageMeta } from '@/lib/pagination'

export const metadata = {
  title: 'Plans | Admin',
}

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      priceEgp: true,
      durationDays: true,
      isActive: true,
      _count: { select: { subscriptions: true } },
    },
  })
  const meta: PageMeta = { page: 1, pageSize: plans.length || 1, total: plans.length, totalPages: 1 }

  return (
    <div className="space-y-5">
      <PlanCreateToggle />
      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'price', header: 'Price' },
          { key: 'duration', header: 'Duration' },
          { key: 'state', header: 'Status' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={plans.map((p) => ({
          name: <span className="font-semibold">{typeof p.name === 'string' ? p.name : p.id}</span>,
          price: `${p.priceEgp} EGP`,
          duration: p.durationDays ? `${p.durationDays} days` : '—',
          state: (
            <div className="flex items-center gap-2">
              <StatusBadge
                status={p.isActive ? 'ACTIVE' : 'INACTIVE'}
                label={p.isActive ? 'Active' : 'Inactive'}
              />
              <span className="text-xs text-[var(--color-text-muted)]">
                ({p._count.subscriptions} subscribers)
              </span>
            </div>
          ),
          actions: (
            <PlanActions
              planId={p.id}
              isActive={p.isActive}
              initialName={typeof p.name === 'string' ? p.name : p.id}
              initialPriceEgp={p.priceEgp}
              initialDurationDays={p.durationDays || 30}
            />
          ),
        }))}
        rowKeys={plans.map((p) => p.id)}
        meta={meta}
        basePath="/admin/plans"
        params={{}}
        emptyText="No plans configured yet. Create your first plan above."
      />
    </div>
  )
}
