import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PortfolioActions } from '@/components/admin/PortfolioActions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Portfolios | Admin',
}

interface PortfoliosPageProps {
  searchParams: Promise<{ search?: string; status?: string; hidden?: string; page?: string; pageSize?: string }>
}

export default async function AdminPortfoliosPage({ searchParams }: PortfoliosPageProps) {
  const sp = await searchParams
  const search = (sp.search || '').trim()
  const status = sp.status === 'DRAFT' || sp.status === 'PUBLISHED' ? sp.status : ''
  const hidden = sp.hidden === 'true' || sp.hidden === 'false' ? sp.hidden : ''
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (hidden) params.set('hidden', hidden)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(hidden === 'true' ? { adminHidden: true } : hidden === 'false' ? { adminHidden: false } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.userProfile.count({ where }),
    prisma.userProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true,
        adminHidden: true,
        adminHiddenReason: true,
        updatedAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)
  const hasFilters = Boolean(search || status || hidden)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Portfolios</h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          {total} portfolios listed
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search username or name…"
          aria-label="Search portfolios"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Filter by portfolio publication status"
          className="h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <select
          name="hidden"
          defaultValue={hidden}
          aria-label="Filter by visibility"
          className="h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Visible + hidden</option>
          <option value="false">Visible only</option>
          <option value="true">Hidden only</option>
        </select>
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
        {hasFilters && (
          <Link
            href="/admin/portfolios"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        )}
      </form>

      <DataTable
        columns={[
          { key: 'portfolio', header: 'Portfolio' },
          { key: 'status', header: 'Status' },
          { key: 'owner', header: 'Owner' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={items.map((p) => ({
          portfolio: (
            <span>
              <Link href={`/u/${p.username}`} target="_blank" className="font-medium text-[var(--color-primary)] hover:underline">
                /u/{p.username}
              </Link>
              {p.displayName && <span className="block text-xs text-[var(--color-text-muted)]">{p.displayName}</span>}
            </span>
          ),
          status: (
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={p.status} />
              {p.adminHidden && (
                <StatusBadge
                  status="HIDDEN"
                  label={p.adminHiddenReason ? `Hidden: ${p.adminHiddenReason}` : 'Hidden'}
                />
              )}
            </div>
          ),
          owner: (
            <Link href={`/admin/users/${p.user.id}`} className="text-[var(--color-primary)] hover:underline">
              {p.user.email}
            </Link>
          ),
          actions: <PortfolioActions username={p.username} hidden={p.adminHidden} />,
        }))}
        rowKeys={items.map((p) => p.id)}
        meta={meta}
        basePath="/admin/portfolios"
        params={{ search, status, hidden }}
        emptyText="No portfolios found matching your search."
      />
    </div>
  )
}
