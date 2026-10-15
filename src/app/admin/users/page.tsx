import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { DataTable } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Users | Admin',
}

interface UsersPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}

// Server-rendered list (search + status filter + server pagination).
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Users</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <Input name="search" defaultValue={search} placeholder="Search email or name…" className="max-w-xs" />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <DataTable
        columns={[
          { key: 'email', header: 'Email' },
          { key: 'name', header: 'Name' },
          { key: 'status', header: 'Status' },
          { key: 'lastLogin', header: 'Last login' },
        ]}
        rows={users.map((u) => ({
          email: (
            <Link href={`/admin/users/${u.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
              {u.email}
            </Link>
          ),
          name: (
            <span>
              {u.displayName || '—'}
              {u.isAdmin ? ' (admin)' : ''}
            </span>
          ),
          status: u.status,
          lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—',
        }))}
        rowKeys={users.map((u) => u.id)}
        meta={meta}
        basePath="/admin/users"
        params={{ search, status }}
        emptyText="No users found."
      />
    </div>
  )
}
