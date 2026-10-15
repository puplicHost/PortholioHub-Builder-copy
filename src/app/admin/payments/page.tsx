import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Payments | Admin',
}

interface PaymentsPageProps {
  searchParams: Promise<{ user?: string; from?: string; to?: string; page?: string; pageSize?: string }>
}

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  const sp = await searchParams
  const user = (sp.user || '').trim()
  const from = sp.from || ''
  const to = sp.to || ''
  const params = new URLSearchParams()
  if (user) params.set('user', user)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const { page, pageSize, skip, take } = parsePagination(params)

  const createdAt: { gte?: Date; lte?: Date } = {}
  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.lte = toDate

  const where = {
    ...(user
      ? {
          user: {
            OR: [
              { email: { contains: user, mode: 'insensitive' as const } },
              { displayName: { contains: user, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        provider: true,
        amountEgp: true,
        status: true,
        createdAt: true,
        user: { select: { email: true, displayName: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Payments</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <Input name="user" defaultValue={user} placeholder="Search user…" className="max-w-xs" />
        <Input name="from" type="date" defaultValue={from} className="max-w-[180px]" />
        <Input name="to" type="date" defaultValue={to} className="max-w-[180px]" />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <DataTable
        columns={[
          { key: 'when', header: 'When' },
          { key: 'user', header: 'User' },
          { key: 'amount', header: 'Amount' },
          { key: 'provider', header: 'Provider' },
          { key: 'status', header: 'Status' },
        ]}
        rows={items.map((p) => ({
          when: new Date(p.createdAt).toLocaleString(),
          user: `${p.user.displayName || p.user.email} (${p.user.email})`,
          amount: `${p.amountEgp} EGP`,
          provider: p.provider,
          status: p.status,
        }))}
        rowKeys={items.map((p) => p.id)}
        meta={meta}
        basePath="/admin/payments"
        params={{ user, from, to }}
        emptyText="No payments yet."
      />
    </div>
  )
}
