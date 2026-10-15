import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { PortfolioActions } from '@/components/admin/PortfolioActions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Portfolios</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <Input name="search" defaultValue={search} placeholder="Search username or name…" className="max-w-xs" />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <select
          name="hidden"
          defaultValue={hidden}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">Visible + hidden</option>
          <option value="false">Visible only</option>
          <option value="true">Hidden only</option>
        </select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
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
              <Link href={`/u/${p.username}`} className="font-medium text-[var(--color-primary)] hover:underline">
                /u/{p.username}
              </Link>
              {p.adminHidden && (
                <span className="ml-2 text-xs text-[var(--color-danger)]">hidden{p.adminHiddenReason ? `: ${p.adminHiddenReason}` : ''}</span>
              )}
            </span>
          ),
          status: p.status,
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
        emptyText="No portfolios found."
      />
    </div>
  )
}
