import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'
import { PaymentActions } from '@/components/admin/PaymentActions'
import { CsvExportButton } from '@/components/admin/CsvExportButton'

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
        user: { select: { id: true, email: true, displayName: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)
  const hasFilters = Boolean(user || from || to)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Payments</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {total} recorded payments
          </p>
        </div>
        <CsvExportButton
          filename={`payments-export-${new Date().toISOString().split('T')[0]}.csv`}
          headers={['Date', 'User Email', 'User Name', 'Amount EGP', 'Provider', 'Status']}
          rows={items.map((p) => [
            new Date(p.createdAt).toISOString(),
            p.user.email,
            p.user.displayName || '',
            p.amountEgp,
            p.provider,
            p.status,
          ])}
          size="sm"
        />
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            id="payment-user"
            name="user"
            label="Search user"
            defaultValue={user}
            placeholder="Search email or name…"
          />
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            id="payment-from"
            name="from"
            label="From date"
            type="date"
            defaultValue={from}
          />
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            id="payment-to"
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
              href="/admin/payments"
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
          { key: 'user', header: 'User' },
          { key: 'amount', header: 'Amount' },
          { key: 'provider', header: 'Provider' },
          { key: 'status', header: 'Status' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((p) => ({
          when: (
            <span className="text-xs">
              {new Date(p.createdAt).toLocaleDateString()}
              <span className="block text-[10px] text-[var(--color-text-muted)]">
                {new Date(p.createdAt).toLocaleTimeString()}
              </span>
            </span>
          ),
          user: (
            <span>
              <Link href={`/admin/users/${p.user.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                {p.user.displayName || p.user.email}
              </Link>
              <span className="block text-xs text-[var(--color-text-muted)]">{p.user.email}</span>
            </span>
          ),
          amount: <span className="font-semibold">{p.amountEgp} EGP</span>,
          provider: (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
              {p.provider}
            </span>
          ),
          status: <StatusBadge status={p.status} />,
          actions: (
            <PaymentActions
              paymentId={p.id}
              status={p.status}
              userId={p.user.id}
              amountEgp={p.amountEgp}
              provider={p.provider}
            />
          ),
        }))}
        rowKeys={items.map((p) => p.id)}
        meta={meta}
        basePath="/admin/payments"
        params={{ user, from, to }}
        emptyText="No payments found with these filters."
      />
    </div>
  )
}
