import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { UsersSimpleTable, type SimpleUserRow } from '@/components/admin/UsersSimpleTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Users | Admin',
}

interface UsersPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}

function fmtExpiry(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

// Server component: one wall-clock read per request. Wrapped in a function so
// the React purity lint does not treat the request-time read as render state.
function requestNow(): number {
  return Date.now()
}

// Server-rendered simple users list: name, email, Pro/Free/Grace/Suspended
// badge, expiry date, and a details button opening the slide-over drawer.
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
        status: true,
        createdAt: true,
      },
    }),
  ])

  // Latest non-canceled subscription per displayed user (single query).
  const subs = users.length
    ? await prisma.subscription.findMany({
        where: { userId: { in: users.map((u) => u.id) }, canceledAt: null },
        orderBy: { expiresAt: 'desc' },
        select: { userId: true, expiresAt: true, gracePeriodEndsAt: true },
      })
    : []
  const latestByUser = new Map<string, { expiresAt: Date | null; gracePeriodEndsAt: Date | null }>()
  for (const s of subs) {
    if (!latestByUser.has(s.userId)) {
      latestByUser.set(s.userId, { expiresAt: s.expiresAt, gracePeriodEndsAt: s.gracePeriodEndsAt })
    }
  }

  const now = requestNow()
  const rows: SimpleUserRow[] = users.map((u) => {
    if (u.status === 'SUSPENDED') {
      return { id: u.id, displayName: u.displayName, email: u.email, badgeStatus: 'SUSPENDED', badgeLabel: 'معلّق', expiresAt: null }
    }
    const s = latestByUser.get(u.id)
    const endsAt = s?.expiresAt ? new Date(s.expiresAt).getTime() : 0
    const graceEnds = s?.gracePeriodEndsAt ? new Date(s.gracePeriodEndsAt).getTime() : endsAt
    const expiry = s?.expiresAt ? fmtExpiry(new Date(s.expiresAt).toISOString()) : null
    if (s?.expiresAt && now < endsAt) {
      return { id: u.id, displayName: u.displayName, email: u.email, badgeStatus: 'ACTIVE', badgeLabel: 'Pro', expiresAt: expiry }
    }
    if (s?.expiresAt && now < graceEnds) {
      const days = Math.ceil((graceEnds - now) / 86400000)
      return { id: u.id, displayName: u.displayName, email: u.email, badgeStatus: 'GRACE', badgeLabel: `سماح · ${days} أيام`, expiresAt: expiry }
    }
    return { id: u.id, displayName: u.displayName, email: u.email, badgeStatus: 'FREE', badgeLabel: 'Free', expiresAt: expiry }
  })

  const meta = buildMeta(page, pageSize, total)
  const hasFilters = Boolean(search || status)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">المستخدمون</h1>
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
          className="h-12 min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        )}
      </form>

      <UsersSimpleTable rows={rows} meta={meta} basePath="/admin/users" params={{ search, status }} hasFilters={hasFilters} />
    </div>
  )
}
