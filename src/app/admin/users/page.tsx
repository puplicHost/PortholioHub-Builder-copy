import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { UserTableClient } from '@/components/admin/UserTableClient'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Users | Admin',
}

interface UsersPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}

// Server-rendered list with bulk multi-select, CSV export, and filtering.
export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const sp = await searchParams
  const search = (sp.search || '').trim()
  const status = sp.status === 'ACTIVE' || sp.status === 'SUSPENDED' ? sp.status : ''
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  const { page, pageSize, skip, take } = parsePagination(params)

  const where = {
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { displayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        isAdmin: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)
  const hasFilters = Boolean(search || status)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Users</h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          Showing {users.length} of {total} registered users
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search email or name…"
          aria-label="Search users by email or name"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Filter by account status"
          className="h-12 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
        {hasFilters && (
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        )}
      </form>

      <UserTableClient
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          phone: u.phone,
          isAdmin: u.isAdmin,
          status: u.status,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
        }))}
        meta={meta}
        basePath="/admin/users"
        params={{ search, status }}
      />
    </div>
  )
}
