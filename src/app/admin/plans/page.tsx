import { prisma } from '@/lib/prisma'
import { DataTable } from '@/components/admin/DataTable'
import { PlanForm } from '@/components/admin/PlanForm'
import { PlanActions } from '@/components/admin/PlanActions'
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Plans</h1>
      <PlanForm />
      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'price', header: 'Price' },
          { key: 'duration', header: 'Duration' },
          { key: 'state', header: 'State' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={plans.map((p) => ({
          name: typeof p.name === 'string' ? p.name : p.id,
          price: `${p.priceEgp} EGP`,
          duration: p.durationDays ? `${p.durationDays} days` : '—',
          state: `${p.isActive ? 'Active' : 'Inactive'} · ${p._count.subscriptions} subs`,
          actions: <PlanActions planId={p.id} isActive={p.isActive} />,
        }))}
        rowKeys={plans.map((p) => p.id)}
        meta={meta}
        basePath="/admin/plans"
        params={{}}
        emptyText="No plans yet — create the first one above."
      />
    </div>
  )
}
