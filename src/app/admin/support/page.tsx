import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  LifeBuoy,
  Search,
  RotateCcw,
  User,
  CreditCard,
  Receipt,
  Globe,
  ExternalLink,
  Eye,
  Shield,
  Clock,
  Phone,
  Mail,
  Smartphone,
  CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Customer Support Hub | Admin',
}

interface SupportPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminSupportPage({ searchParams }: SupportPageProps) {
  const sp = await searchParams
  const q = (sp.q || '').trim()

  const users = q
    ? await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { displayName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { id: { equals: q } },
          ],
        },
        take: 20,
        include: {
          portfolioProfile: {
            select: {
              id: true,
              username: true,
              status: true,
              adminHidden: true,
              updatedAt: true,
            },
          },
          subscriptions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
            include: { plan: true },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              sessions: true,
              subscriptions: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Pre-fetch counts for quick diagnostic metrics when no search is active
  const [recentUsers, pendingPaymentsCount, suspendedCount] = !q
    ? await Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, displayName: true, createdAt: true, status: true },
        }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { status: 'SUSPENDED' } }),
      ])
    : [[], 0, 0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-[var(--color-primary)]" />
            Customer Support & Diagnostics
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Global instant lookup across accounts, subscriptions, payments, and live portfolios.
          </p>
        </div>
      </div>

      {/* Primary Global Search Bar */}
      <Card className="p-4 bg-[var(--color-surface)] shadow-xs">
        <form method="get" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by customer email, name, Egyptian phone (+20...), or UUID…"
              className="ps-9 h-11 text-sm w-full"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" variant="primary" size="md" className="flex-1 sm:flex-initial">
              Search Customer
            </Button>
            {q && (
              <Link
                href="/admin/support"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors h-11"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Link>
            )}
          </div>
        </form>
      </Card>

      {/* Query Active: Search Results */}
      {q ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Found {users.length} match{users.length === 1 ? '' : 'es'} for &ldquo;{q}&rdquo;
            </h2>
          </div>

          {users.length === 0 ? (
            <Card className="p-8 flex flex-col items-center">
              <EmptyState
                icon={Search}
                title={`No customers found for "${q}"`}
                description="Double-check the email address or phone digits. You can also try searching by first name or workspace owner."
              />
              <div className="-mt-8 pb-4">
                <Link
                  href="/admin/support"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear search</span>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((u) => {
                const latestSub = u.subscriptions[0]
                const latestPayment = u.payments[0]
                const portfolio = u.portfolioProfile

                return (
                  <Card key={u.id} className="p-5 space-y-4 hover:border-[var(--color-primary)]/40 transition-colors">
                    {/* User header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-base">
                          {u.displayName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-[var(--color-text-primary)]">
                              {u.displayName || 'Unnamed User'}
                            </span>
                            {u.isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                <Shield className="h-3 w-3" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                            {u.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {u.phone}
                              </span>
                            )}
                            <span className="font-mono text-[10px] opacity-75">ID: {u.id}</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={u.status} size="md" />
                    </div>

                    {/* 4 Diagnostic Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Subscription Status */}
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                          Subscription ({u._count.subscriptions})
                        </span>
                        {latestSub ? (
                          <div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {typeof latestSub.plan.name === 'string' ? latestSub.plan.name : 'Plan'}
                              </span>
                              <StatusBadge
                                status={latestSub.canceledAt ? 'SUSPENDED' : latestSub.status}
                                size="sm"
                              />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                              {latestSub.expiresAt
                                ? `Expires: ${new Date(latestSub.expiresAt).toLocaleDateString()}`
                                : 'Ongoing / Lifetime'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] block pt-1">
                            No active plan
                          </span>
                        )}
                      </div>

                      {/* Latest Payment */}
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 text-amber-500" />
                          Payment ({u._count.payments})
                        </span>
                        {latestPayment ? (
                          <div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {latestPayment.amountEgp} EGP
                              </span>
                              <StatusBadge status={latestPayment.status} size="sm" />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                              {latestPayment.provider} • {new Date(latestPayment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] block pt-1">
                            No payments on record
                          </span>
                        )}
                      </div>

                      {/* Portfolio Status */}
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-blue-500" />
                          Portfolio Site
                        </span>
                        {portfolio ? (
                          <div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                                /u/{portfolio.username}
                              </span>
                              <StatusBadge
                                status={portfolio.adminHidden ? 'HIDDEN' : portfolio.status}
                                size="sm"
                              />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                              Updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] block pt-1">
                            Not yet created
                          </span>
                        )}
                      </div>

                      {/* Account Activity */}
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                          Activity & Sessions
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] block mt-1">
                            {u._count.sessions} active session{u._count.sessions === 1 ? '' : 's'}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Support Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Manage User Account</span>
                      </Link>

                      <Link
                        href={`/admin/users/${u.id}/preview`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                        <span>Support Preview</span>
                      </Link>

                      <Link
                        href={`/admin/subscriptions?search=${encodeURIComponent(u.email)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Subscriptions</span>
                      </Link>

                      <Link
                        href={`/admin/payments?user=${encodeURIComponent(u.email)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
                      >
                        <Receipt className="h-3.5 w-3.5 text-amber-600" />
                        <span>Payments</span>
                      </Link>

                      {portfolio?.username && (
                        <Link
                          href={`/u/${portfolio.username}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-emerald-600 transition-colors ms-auto"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Live Site</span>
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </Link>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* No Query: Support Dashboard & Quick Lookups */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 md:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--color-primary)]" />
              Recently Registered Customers
            </h2>
            <div className="divide-y divide-[var(--color-border)]">
              {recentUsers.map((ru) => (
                <div key={ru.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <Link
                      href={`/admin/users/${ru.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {ru.displayName || ru.email}
                    </Link>
                    <span className="block text-[11px] text-[var(--color-text-muted)]">{ru.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {new Date(ru.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={ru.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Urgent Attention
              </h3>
              <div className="space-y-2">
                <Link
                  href="/admin/payments"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 transition-colors text-xs"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">Pending Payments</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 text-[11px]">
                    {pendingPaymentsCount}
                  </span>
                </Link>
                <Link
                  href="/admin/users?status=SUSPENDED"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 transition-colors text-xs"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">Suspended Users</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-600 text-[11px]">
                    {suspendedCount}
                  </span>
                </Link>
              </div>
            </Card>

            <Card className="p-5 space-y-2 text-xs">
              <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Support Operator Tips
              </h3>
              <p className="text-[var(--color-text-muted)] text-[11px] leading-relaxed">
                When a freelancer calls or messages on WhatsApp about a payment transfer, search their Egyptian mobile number or email. You can view their portfolio, verify bank slips, or grant courtesy days directly.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
