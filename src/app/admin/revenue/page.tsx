import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CsvExportButton } from '@/components/admin/CsvExportButton'
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Receipt,
  Tags,
  ArrowLeft,
  Layers,
  ArrowUpRight,
} from 'lucide-react'

export const metadata = {
  title: 'Revenue & Financial Intelligence | Admin',
}

export default async function AdminRevenuePage() {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    allTimeRevenueAggregate,
    thisMonthRevenueAggregate,
    lastMonthRevenueAggregate,
    activeSubscriptions,
    allPlans,
    recentPayments,
  ] = await Promise.all([
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
    prisma.subscription.findMany({
      where: { status: 'ACTIVE', canceledAt: null },
      select: {
        id: true,
        planId: true,
        amountEgp: true,
        startedAt: true,
        expiresAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            priceEgp: true,
            durationDays: true,
          },
        },
      },
    }),
    prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        priceEgp: true,
        durationDays: true,
        isActive: true,
        _count: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE', canceledAt: null },
            },
          },
        },
      },
      orderBy: { priceEgp: 'asc' },
    }),
    prisma.payment.findMany({
      where: { status: { in: ['CONFIRMED', 'confirmed'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderId: true,
        amountEgp: true,
        provider: true,
        createdAt: true,
        status: true,
        user: { select: { id: true, email: true, displayName: true } },
      },
    }),
  ])

  // Financial aggregates
  const totalRevenueEgp = allTimeRevenueAggregate._sum.amountEgp || 0
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
    const amount = sub.amountEgp ?? sub.plan.priceEgp ?? 0
    const days = sub.plan?.durationDays || 30
    const normalizedMonthly = Math.round((amount / days) * 30)
    return acc + normalizedMonthly
  }, 0)

  // Plan Cohort Breakdown
  const totalSubscribers = activeSubscriptions.length
  const cohortBreakdown = allPlans.map((plan) => {
    const subscriberCount = plan._count.subscriptions
    const subsForPlan = activeSubscriptions.filter((s) => s.planId === plan.id)
    const planMonthlyRev = subsForPlan.reduce((acc, s) => {
      const amount = s.amountEgp ?? plan.priceEgp
      const days = plan.durationDays || 30
      return acc + Math.round((amount / days) * 30)
    }, 0)
    const shareOfMrr = mrr > 0 ? Math.round((planMonthlyRev / mrr) * 100) : 0

    return {
      id: plan.id,
      name: typeof plan.name === 'string' ? plan.name : plan.id,
      priceEgp: plan.priceEgp,
      durationDays: plan.durationDays,
      subscriberCount,
      planMonthlyRev,
      shareOfMrr,
      isActive: plan.isActive,
    }
  }).sort((a, b) => b.subscriberCount - a.subscriberCount)

  const topPlan = cohortBreakdown[0]

  // CSV export rows for payments
  const csvHeaders = ['Date', 'User Email', 'User Name', 'Amount (EGP)', 'Gateway Provider', 'Status', 'Order Ref']
  const csvRows = recentPayments.map((p) => [
    new Date(p.createdAt).toISOString(),
    p.user.email,
    p.user.displayName || '',
    p.amountEgp,
    p.provider,
    p.status,
    p.orderId || p.id,
  ])

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[var(--color-primary)]" />
            Revenue & Financial Intelligence
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Real-time MRR, subscription cohorts, and offline payment cash flow for Egyptian creators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CsvExportButton
            filename={`portfoliohub-revenue-${now.toISOString().split('T')[0]}.csv`}
            headers={csvHeaders}
            rows={csvRows}
            label="Export Payments CSV"
            size="sm"
          />
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated MRR */}
        <Card className="p-5 flex flex-col justify-between space-y-3 shadow-xs">
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
              {mrr.toLocaleString()} <span className="text-xs font-normal text-[var(--color-text-muted)]">EGP / mo</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Normalized from {totalSubscribers} active creator plans
            </p>
          </div>
        </Card>

        {/* Confirmed All-Time Revenue */}
        <Card className="p-5 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Lifetime Revenue
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
              Verified deposits & bank transfers
            </p>
          </div>
        </Card>

        {/* Month-over-Month Growth */}
        <Card className="p-5 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Month-over-Month (MoM)
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
              vs {lastMonthRev.toLocaleString()} EGP in previous month
            </p>
          </div>
        </Card>

        {/* Top Performing Tier */}
        <Card className="p-5 flex flex-col justify-between space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Top Subscription Tier
            </span>
            <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Tags className="h-4 w-4" />
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">
              {topPlan ? topPlan.name : 'None'}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {topPlan
                ? `${topPlan.subscriberCount} subscribers • ${topPlan.priceEgp} EGP`
                : 'No active plans'}
            </p>
          </div>
        </Card>
      </div>

      {/* Subscription Cohort Breakdown Table */}
      <Card className="p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--color-primary)]" />
              Subscription Cohorts & Tier Distribution
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Breakdown of active recurring revenue contributed by each published tier.
            </p>
          </div>
          <Link
            href="/admin/plans"
            className="text-xs text-[var(--color-primary)] hover:underline font-medium inline-flex items-center gap-1"
          >
            Manage plans
            <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-start text-[var(--color-text-muted)]">
                <th className="py-2.5 px-3 text-start font-semibold">Tier Name</th>
                <th className="py-2.5 px-3 text-start font-semibold">Pricing</th>
                <th className="py-2.5 px-3 text-start font-semibold">Active Creators</th>
                <th className="py-2.5 px-3 text-start font-semibold">Monthly Contribution</th>
                <th className="py-2.5 px-3 text-start font-semibold">Share of MRR</th>
                <th className="py-2.5 px-3 text-end rtl:text-start font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {cohortBreakdown.map((cohort) => (
                <tr key={cohort.id} className="hover:bg-[var(--color-surface-secondary)]/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">
                    {cohort.name}
                  </td>
                  <td className="py-3 px-3 text-[var(--color-text-secondary)]">
                    {cohort.priceEgp} EGP / {cohort.durationDays || 30} days
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {cohort.subscriberCount}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] ms-1">
                      ({totalSubscribers > 0 ? Math.round((cohort.subscriberCount / totalSubscribers) * 100) : 0}%)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">
                    {cohort.planMonthlyRev.toLocaleString()} EGP
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[var(--color-border)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[var(--color-primary)] h-full rounded-full"
                          style={{ width: `${Math.min(100, cohort.shareOfMrr)}%` }}
                        />
                      </div>
                      <span className="font-medium text-[11px]">{cohort.shareOfMrr}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-end rtl:text-start">
                    <StatusBadge
                      status={cohort.isActive ? 'ACTIVE' : 'INACTIVE'}
                      label={cohort.isActive ? 'Active Tier' : 'Archived'}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Confirmed Transactions Feed */}
      <Card className="p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              Verified Payment Stream (Last 20 Receipts)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Chronological log of confirmed creator subscription payments and renewals.
            </p>
          </div>
          <Link
            href="/admin/payments"
            className="text-xs text-[var(--color-primary)] hover:underline font-medium inline-flex items-center gap-1"
          >
            All payments
            <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-6 text-center italic">
            No confirmed payments recorded on the platform yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-start text-[var(--color-text-muted)]">
                  <th className="py-2.5 px-3 text-start font-semibold">Date & Time</th>
                  <th className="py-2.5 px-3 text-start font-semibold">Creator Account</th>
                  <th className="py-2.5 px-3 text-start font-semibold">Amount</th>
                  <th className="py-2.5 px-3 text-start font-semibold">Gateway / Provider</th>
                  <th className="py-2.5 px-3 text-start font-semibold">Reference</th>
                  <th className="py-2.5 px-3 text-end rtl:text-start font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-secondary)]/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className="block text-[10px] text-[var(--color-text-muted)]">
                        {new Date(p.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/users/${p.user.id}`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                        title="View user details"
                      >
                        {p.user.displayName || p.user.email}
                      </Link>
                      <span className="block text-[10px] text-[var(--color-text-muted)] font-mono">
                        {p.user.email}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--color-text-primary)]">
                      {p.amountEgp} EGP
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                        {p.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-muted)] font-mono text-[11px]">
                      {p.orderId ? p.orderId.slice(0, 16) : p.id.slice(0, 12)}
                    </td>
                    <td className="py-2.5 px-3 text-end rtl:text-start">
                      <Link
                        href={`/admin/users/${p.user.id}`}
                        title="View creator user details"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] transition-colors"
                      >
                        User
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
