import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { UserActions } from '@/components/admin/UserActions'
import { UserTimeline, type TimelineEvent } from '@/components/admin/UserTimeline'
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  ScrollText,
  UserCheck,
  Shield,
  Globe,
  ExternalLink,
  Eye,
  History,
} from 'lucide-react'

export const metadata = {
  title: 'User detail | Admin',
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const [user, subscriptions, payments, auditLogs, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        isAdmin: true,
        emailVerified: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        portfolioProfile: {
          select: { id: true, username: true, status: true, adminHidden: true, updatedAt: true },
        },
        ownedWorkspaces: { select: { id: true, name: true } },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { userId: id },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        canceledAt: true,
        amountEgp: true,
        plan: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        provider: true,
        amountEgp: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
        admin: { select: { email: true } },
      },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        priceEgp: true,
        durationDays: true,
      },
      orderBy: { priceEgp: 'asc' },
    }),
  ])

  if (!user) notFound()

  // Format plans for UserActions
  const availablePlans = plans.map((p) => ({
    id: p.id,
    name: typeof p.name === 'string' ? p.name : 'Plan',
    priceEgp: p.priceEgp,
    durationDays: p.durationDays,
  }))

  // Assemble chronological unified timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      id: `user-created-${user.id}`,
      timestamp: user.createdAt,
      type: 'user',
      title: 'Account Registered',
      description: `User signed up with email ${user.email}`,
    },
    ...(user.portfolioProfile?.updatedAt
      ? [
          {
            id: `profile-updated-${user.portfolioProfile.id}`,
            timestamp: user.portfolioProfile.updatedAt,
            type: 'portfolio' as const,
            title: 'Portfolio Profile Updated',
            description: `Portfolio /u/${user.portfolioProfile.username} was updated.`,
            status: user.portfolioProfile.adminHidden ? 'HIDDEN' : user.portfolioProfile.status,
          },
        ]
      : []),
    ...subscriptions.map((s) => ({
      id: `sub-${s.id}`,
      timestamp: s.startedAt,
      type: 'subscription' as const,
      title: `Subscription Started (${typeof s.plan.name === 'string' ? s.plan.name : 'Custom Plan'})`,
      description: `Amount: ${s.amountEgp} EGP | Period: ${new Date(s.startedAt).toLocaleDateString()} → ${
        s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'Ongoing'
      }${s.canceledAt ? ` (Canceled on ${new Date(s.canceledAt).toLocaleDateString()})` : ''}`,
      status: s.canceledAt ? 'SUSPENDED' : s.status,
    })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      timestamp: p.createdAt,
      type: 'payment' as const,
      title: `Payment ${p.status.toLowerCase()} (${p.amountEgp} EGP)`,
      description: `Provider gateway: ${p.provider}`,
      status: p.status,
    })),
    ...auditLogs.map((log) => ({
      id: `audit-${log.id}`,
      timestamp: log.createdAt,
      type: 'audit' as const,
      title: `Admin Action: ${log.action}`,
      description: log.reason || undefined,
      actor: log.admin?.email || 'Admin',
    })),
  ]

  return (
    <div className="space-y-6">
      {/* Top navigation row */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          Back to users
        </Link>

        {/* Quick action shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users/${user.id}/preview`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span>Support preview</span>
          </Link>

          {user.portfolioProfile?.username && (
            <Link
              href={`/u/${user.portfolioProfile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-xs font-medium text-[var(--color-text-primary)] transition-colors shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span>Live portfolio</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          )}
        </div>
      </div>

      {/* Header Profile Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-lg">
            {user.displayName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {user.displayName || user.email}
              </h1>
              {user.isAdmin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
          </div>
        </div>
        <StatusBadge status={user.status} size="md" />
      </div>

      {/* User Actions Panel (Inline Edit, Grant Sub, Send Email, Danger Delete, etc.) */}
      <Card className="p-4 bg-[var(--color-surface)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Administrative actions
        </h2>
        <UserActions
          userId={user.id}
          status={user.status}
          userEmail={user.email}
          displayName={user.displayName}
          phone={user.phone}
          isAdmin={user.isAdmin}
          availablePlans={availablePlans}
        />
      </Card>

      {/* Profile Overview Details */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[var(--color-primary)]" />
          Account and profile information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[var(--color-text-muted)] block">Display name</span>
            <span className="font-medium text-[var(--color-text-primary)] mt-0.5 block">
              {user.displayName || '—'}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Phone number</span>
            <span className="font-medium text-[var(--color-text-primary)] mt-0.5 block">
              {user.phone || '—'}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Active browser sessions</span>
            <span className="font-medium text-[var(--color-text-primary)] mt-0.5 block">
              {user._count.sessions}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Owned workspaces</span>
            <span className="font-medium text-[var(--color-text-primary)] mt-0.5 block">
              {user.ownedWorkspaces.length > 0
                ? user.ownedWorkspaces.map((w) => w.name).join(', ')
                : 'None'}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Public portfolio</span>
            {user.portfolioProfile ? (
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/u/${user.portfolioProfile.username}`}
                  target="_blank"
                  className="font-medium text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  /u/{user.portfolioProfile.username}
                </Link>
                <StatusBadge status={user.portfolioProfile.status} size="sm" />
                {user.portfolioProfile.adminHidden && <StatusBadge status="HIDDEN" size="sm" />}
              </div>
            ) : (
              <span className="text-[var(--color-text-muted)] mt-0.5 block">No portfolio created</span>
            )}
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">Account registered</span>
            <span className="font-medium text-[var(--color-text-primary)] mt-0.5 block">
              {new Date(user.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Unified chronological User Lifecycle Timeline */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--color-primary)]" />
            Unified Activity Timeline ({timelineEvents.length})
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            Chronological log of user registrations, subscriptions, payments & admin events
          </span>
        </div>
        <UserTimeline events={timelineEvents} />
      </Card>

      {/* Subscriptions History for this User */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
            Subscriptions ({subscriptions.length})
          </h2>
          <Link
            href={`/admin/subscriptions?search=${encodeURIComponent(user.email)}`}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View in subscriptions
          </Link>
        </div>
        {subscriptions.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-3 italic">
            No subscriptions on record for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-start text-[var(--color-text-muted)]">
                  <th className="py-2 text-start font-medium">Plan</th>
                  <th className="py-2 text-start font-medium">Period</th>
                  <th className="py-2 text-start font-medium">Amount</th>
                  <th className="py-2 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 font-medium">
                      {typeof s.plan.name === 'string' ? s.plan.name : 'Custom Plan'}
                    </td>
                    <td className="py-2 text-[var(--color-text-muted)]">
                      {new Date(s.startedAt).toLocaleDateString()} →{' '}
                      {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2">{s.amountEgp} EGP</td>
                    <td className="py-2">
                      <StatusBadge status={s.canceledAt ? 'SUSPENDED' : s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Payments History for this User */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--color-primary)]" />
            Payments ({payments.length})
          </h2>
          <Link
            href={`/admin/payments?user=${encodeURIComponent(user.email)}`}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View in payments
          </Link>
        </div>
        {payments.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-3 italic">
            No payments recorded for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-start text-[var(--color-text-muted)]">
                  <th className="py-2 text-start font-medium">Date</th>
                  <th className="py-2 text-start font-medium">Amount</th>
                  <th className="py-2 text-start font-medium">Provider</th>
                  <th className="py-2 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 font-semibold">{p.amountEgp} EGP</td>
                    <td className="py-2 font-mono text-[11px]">{p.provider}</td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Audit Events for this User */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-[var(--color-primary)]" />
            Admin audit history ({auditLogs.length})
          </h2>
          <Link href={`/admin/audit-log`} className="text-xs text-[var(--color-primary)] hover:underline">
            View all audit logs
          </Link>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] py-3 italic">
            No administrative actions recorded against this user.
          </p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-xs"
              >
                <div>
                  <code className="font-mono font-semibold text-[var(--color-primary)]">
                    {log.action}
                  </code>
                  {log.reason && (
                    <p className="text-[var(--color-text-muted)] text-[11px] mt-0.5">{log.reason}</p>
                  )}
                </div>
                <div className="text-end text-[11px] text-[var(--color-text-muted)]">
                  <span>by {log.admin?.email || 'Admin'}</span>
                  <span className="block">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
