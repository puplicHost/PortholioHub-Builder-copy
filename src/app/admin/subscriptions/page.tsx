import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { SubscriptionActions } from '@/components/admin/SubscriptionActions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'
import { CsvExportButton } from '@/components/admin/CsvExportButton'

export const metadata = {
  title: 'Subscriptions | Admin',
}

interface SubscriptionsPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const sp = await searchParams
  const search = (sp.search || '').trim()
  const statusFilter = sp.status || ''

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter) params.set('status', statusFilter)
  if (sp.page) params.set('page', sp.page)
  if (sp.pageSize) params.set('pageSize', sp.pageSize)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    ...(search
      ? {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}),
    ...(statusFilter === 'SUSPENDED'
      ? { canceledAt: { not: null } }
      : statusFilter === 'ACTIVE'
      ? { status: 'ACTIVE', canceledAt: null }
      : statusFilter === 'EXPIRED'
      ? { status: 'EXPIRED' }
      : {}),
  }

  const [total, items] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
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
  const hasFilters = Boolean(search || statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Subscriptions</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {total} total subscriptions
          </p>
        </div>
        <CsvExportButton
          filename={`subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`}
          headers={['User Email', 'User Name', 'Plan', 'Started At', 'Expires At', 'Amount EGP', 'Status']}
          rows={items.map((s) => [
            s.user.email,
            s.user.displayName || '',
            typeof s.plan.name === 'string' ? s.plan.name : s.plan.id,
            new Date(s.startedAt).toISOString(),
            s.expiresAt ? new Date(s.expiresAt).toISOString() : '',
            s.amountEgp ?? 0,
            s.canceledAt ? 'SUSPENDED' : s.status,
          ])}
          size="sm"
        />
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search user email or name…"
          aria-label="Search subscribers by name or email"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          aria-label="Filter by subscription status"
          className="h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active only</option>
          <option value="SUSPENDED">Suspended only</option>
          <option value="EXPIRED">Expired only</option>
        </select>
        <Button type="submit" variant="secondary" size="md">
          Filter
        </Button>
        {hasFilters && (
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        )}
      </form>

      <DataTable
        columns={[
          { key: 'user', header: 'User' },
          { key: 'plan', header: 'Plan' },
          { key: 'period', header: 'Period' },
          { key: 'state', header: 'Status' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((s) => {
          const effectiveState = s.canceledAt ? 'SUSPENDED' : s.status
          return {
            user: (
              <span>
                <Link href={`/admin/users/${s.user.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                  {s.user.displayName || s.user.email}
                </Link>
                <span className="block text-xs text-[var(--color-text-muted)]">{s.user.email}</span>
              </span>
            ),
            plan: `${typeof s.plan.name === 'string' ? s.plan.name : s.plan.id}`,
            period: (
              <span className="text-xs">
                {new Date(s.startedAt).toLocaleDateString()} →{' '}
                {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
              </span>
            ),
            state: <StatusBadge status={effectiveState} />,
            actions: (
              <SubscriptionActions
                subscriptionId={s.id}
                canceled={!!s.canceledAt}
                currentStatus={s.status}
                expiresAt={s.expiresAt}
              />
            ),
          }
        })}
        rowKeys={items.map((s) => s.id)}
        meta={meta}
        basePath="/admin/subscriptions"
        params={{ search, status: statusFilter }}
        emptyText="No subscriptions found with this filter."
      />
    </div>
  )
}
