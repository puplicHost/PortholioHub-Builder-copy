import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'

function sevenDaysAgo(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

export const metadata = {
  title: 'Admin dashboard | PortfolioHub',
}

// Dashboard with real counters only (plan Phase 7: no charts).
// Each card links to the matching filtered list.
export default async function AdminDashboardPage() {
  const weekAgo = sevenDaysAgo()
  const [usersTotal, usersNew7d, portfoliosPublished, portfoliosDraft, portfoliosHidden] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.userProfile.count({ where: { status: 'PUBLISHED', adminHidden: false } }),
    prisma.userProfile.count({ where: { status: 'DRAFT' } }),
    prisma.userProfile.count({ where: { adminHidden: true } }),
  ])

  const cards = [
    { label: 'Users total', value: usersTotal, href: '/admin/users' },
    { label: 'New users (7d)', value: usersNew7d, href: '/admin/users' },
    { label: 'Portfolios published', value: portfoliosPublished, href: '/admin/portfolios?status=PUBLISHED' },
    { label: 'Portfolios draft', value: portfoliosDraft, href: '/admin/portfolios?status=DRAFT' },
    { label: 'Portfolios hidden', value: portfoliosHidden, href: '/admin/portfolios?hidden=true' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="p-4 hover:border-[var(--color-primary)] transition-colors">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.label}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="p-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/requests" className="font-medium text-[var(--color-primary)] hover:underline">
          Review subscription requests
        </Link>
        <Link href="/admin/plans" className="font-medium text-[var(--color-primary)] hover:underline">
          Manage plans
        </Link>
        <Link href="/admin/payments" className="font-medium text-[var(--color-primary)] hover:underline">
          Payment history
        </Link>
      </Card>
    </div>
  )
}
