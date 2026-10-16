import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import {
  Inbox,
  CreditCard,
  Receipt,
  Users,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Tags,
  TrendingUp,
  TrendingDown,
  LifeBuoy,
  Megaphone,
  Wrench,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | PortfolioHub Operations',
}

function sevenDaysAgo(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

export default async function AdminDashboardPage() {
  const weekAgo = sevenDaysAgo()
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    usersTotal,
    usersNew7d,
    portfoliosPublished,
    portfoliosDraft,
    portfoliosHidden,
    pendingRequests,
    pendingPaymentsCount,
    activeSubscriptionsCount,
    activeSubscriptions,
    totalRevenueAggregate,
    thisMonthRevenueAggregate,
    lastMonthRevenueAggregate,
    plans,
    recentPayments,
    maintenanceSetting,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.userProfile.count({ where: { status: 'PUBLISHED', adminHidden: false } }),
    prisma.userProfile.count({ where: { status: 'DRAFT' } }),
    prisma.userProfile.count({ where: { adminHidden: true } }),
    prisma.subscriptionRequest.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE', canceledAt: null } }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE', canceledAt: null },
      select: {
        amountEgp: true,
        plan: { select: { id: true, name: true, durationDays: true } },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amountEgp: true },
      where: { status: { in: ['CONFIRMED', 'confirmed'] } },
    }),
    prisma.payment.aggregate({
      _sum: { amountEgp: true },
      where: {
        status: { in: ['CONFIRMED', 'confirmed'] },
        createdAt: { gte: thisMonthStart },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amountEgp: true },
      where: {
        status: { in: ['CONFIRMED', 'confirmed'] },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        priceEgp: true,
        durationDays: true,
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE', canceledAt: null },
            },
          },
        },
      },
      orderBy: {
        subscriptions: { _count: 'desc' },
      },
      take: 3,
    }),
    prisma.payment.findMany({
      where: { status: { in: ['CONFIRMED', 'confirmed'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amountEgp: true,
        provider: true,
        createdAt: true,
        user: { select: { id: true, email: true, displayName: true } },
      },
    }),
    prisma.systemSetting.findUnique({
      where: { key: 'platform.maintenanceMode' },
    }),
  ])

  // Revenue calculations
  const totalRevenueEgp = totalRevenueAggregate._sum.amountEgp || 0
  const thisMonthRev = thisMonthRevenueAggregate._sum.amountEgp || 0
  const lastMonthRev = lastMonthRevenueAggregate._sum.amountEgp || 0

  let momPercent = 0
  if (lastMonthRev > 0) {
    momPercent = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
  } else if (thisMonthRev > 0) {
    momPercent = 100
  }

  // Monthly Recurring Revenue estimate (30-day normalized)
  const mrr = activeSubscriptions.reduce((acc, sub) => {
    const amount = sub.amountEgp ?? 0
    const days = sub.plan?.durationDays || 30
    const normalizedMonthly = Math.round((amount / days) * 30)
    return acc + normalizedMonthly
  }, 0)

  const topPlan = plans[0]
  const isMaintenance = Boolean(
    maintenanceSetting?.value === true || maintenanceSetting?.value === 'true'
  )

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Business Operations Dashboard
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Mission control for Egyptian creator accounts, subscriptions, offline payments, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-semibold text-[var(--color-text-primary)] transition-colors shadow-xs"
          >
            <LifeBuoy className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span>Support Hub</span>
          </Link>
          <Link
            href="/admin/announcements"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Announcements</span>
          </Link>
        </div>
      </div>

      {/* Top Action Required Alert Cards */}
      <div className="space-y-3">
        {/* Maintenance Mode Alert */}
        {isMaintenance && (
          <div className="rounded-2xl border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-danger)] text-white font-bold">
                <Wrench className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-danger)]">
                  Platform Maintenance Mode is Active
                </h3>
                <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                  Public and non-admin visitor traffic is redirected to the maintenance landing page.
                </p>
              </div>
            </div>
            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity text-xs font-semibold shrink-0"
            >
              Manage in Settings
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        )}

        {/* Pending Requests Alert */}
        {pendingRequests > 0 && (
          <div className="rounded-2xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-warning)]">
                    Action required
                  </span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-warning)] text-white">
                    {pendingRequests}
                  </span>
                </div>
                <h2 className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                  {pendingRequests} {pendingRequests === 1 ? 'subscription request' : 'subscription requests'} awaiting review
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Offline bank or wallet transfer receipts need manual approval to activate creator portfolios.
                </p>
              </div>
            </div>
            <Link
              href="/admin/requests?status=PENDING"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-warning)] text-white hover:opacity-90 transition-opacity text-xs font-semibold shrink-0"
            >
              Review Requests
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        )}

        {/* Unconfirmed Payments Alert */}
        {pendingPaymentsCount > 0 && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-600">
                    Payment verification
                  </span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
                    {pendingPaymentsCount}
                  </span>
                </div>
                <h2 className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                  {pendingPaymentsCount} unconfirmed payment record{pendingPaymentsCount === 1 ? '' : 's'}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Manual payments received via InstaPay or Vodafone Cash pending verification.
                </p>
              </div>
            </div>
            <Link
              href="/admin/payments"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white hover:opacity-90 transition-opacity text-xs font-semibold shrink-0"
            >
              Review Payments
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        )}

        {/* All caught up banner if zero pending */}
        {pendingRequests === 0 && pendingPaymentsCount === 0 && !isMaintenance && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>All caught up. Zero pending requests or unconfirmed payments.</span>
            </div>
            <Link
              href="/admin/requests"
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Request history
            </Link>
          </div>
        )}
      </div>

      {/* Dedicated Revenue & Financial Operations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <Banknote className="h-4 w-4 text-[var(--color-primary)]" />
            Financial & Subscription Performance
          </h2>
          <Link
            href="/admin/revenue"
            className="text-xs font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Revenue intelligence</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Confirmed Total Revenue */}
          <Link href="/admin/revenue" className="block">
            <Card className="p-4 flex flex-col justify-between space-y-3 hover:border-[var(--color-primary)] transition-colors h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Total Revenue
                </span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Banknote className="h-4 w-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {totalRevenueEgp.toLocaleString()} <span className="text-xs font-normal text-[var(--color-text-muted)]">EGP</span>
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Lifetime confirmed cash receipts
                </p>
              </div>
            </Card>
          </Link>

          {/* Estimated MRR */}
          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Estimated MRR
              </span>
              <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                {mrr.toLocaleString()} <span className="text-xs font-normal text-[var(--color-text-muted)]">EGP/mo</span>
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                From {activeSubscriptionsCount} active subscribers
              </p>
            </div>
          </Card>

          {/* Month-over-Month Revenue Growth */}
          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Monthly Flow (MoM)
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  momPercent >= 0
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}
              >
                {momPercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {momPercent >= 0 ? `+${momPercent}%` : `${momPercent}%`}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                {thisMonthRev.toLocaleString()} <span className="text-xs font-normal text-[var(--color-text-muted)]">EGP</span>
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Last month: {lastMonthRev.toLocaleString()} EGP
              </p>
            </div>
          </Card>

          {/* Top Performing Plan */}
          <Card className="p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Top Performing Plan
              </span>
              <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Tags className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[var(--color-text-primary)] truncate">
                {topPlan ? (typeof topPlan.name === 'string' ? topPlan.name : 'Primary Plan') : 'No plans'}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {topPlan ? `${topPlan._count.subscriptions} active creators (${topPlan.priceEgp} EGP)` : '—'}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Two Columns: Recent Confirmed Payments & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Confirmed Payments */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              Recent Confirmed Payments
            </h3>
            <Link
              href="/admin/payments"
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] py-4 italic">
              No payments confirmed yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)] text-xs">
              {recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/users/${p.user.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline block truncate max-w-[200px]"
                    >
                      {p.user.displayName || p.user.email}
                    </Link>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {p.provider} • {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {p.amountEgp} EGP
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* User Growth & Platform Health */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-primary)]" />
              Creator Community & Portfolios
            </h3>
            <Link href="/admin/users" className="text-xs text-[var(--color-primary)] hover:underline">
              User directory
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 p-3">
              <span className="text-[11px] text-[var(--color-text-muted)] block">Total Users</span>
              <span className="text-xl font-bold text-[var(--color-text-primary)] mt-1 block">
                {usersTotal}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                +{usersNew7d} in past 7 days
              </span>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 p-3">
              <span className="text-[11px] text-[var(--color-text-muted)] block">Live Portfolios</span>
              <span className="text-xl font-bold text-[var(--color-text-primary)] mt-1 block">
                {portfoliosPublished}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
                {portfoliosDraft} draft • {portfoliosHidden} hidden
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
            <span>PortfolioHub Platform Health: Optimal</span>
            <Link
              href="/admin/portfolios"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Audit portfolios →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Operations Nav Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Business Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/support"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-primary)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">Support Hub</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Lookup any creator</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors rtl:rotate-180" />
          </Link>

          <Link
            href="/admin/announcements"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-primary)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                <Megaphone className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">Announcements</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Broadcast banners</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors rtl:rotate-180" />
          </Link>

          <Link
            href="/admin/requests"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-primary)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                <Inbox className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">Subscription Requests</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{pendingRequests} pending</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors rtl:rotate-180" />
          </Link>

          <Link
            href="/admin/settings"
            className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-primary)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                <Wrench className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-primary)]">System Settings</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Emergency maintenance</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}
