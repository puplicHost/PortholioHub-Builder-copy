import { requireAdmin } from '@/lib/guards'
import { prisma } from '@/lib/prisma'
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell'

export const metadata = {
  title: 'Admin | PortfolioHub',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, pendingRequestsCount, pendingPaymentsCount] = await Promise.all([
    requireAdmin(),
    prisma.subscriptionRequest.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ])

  return (
    <AdminLayoutShell
      userEmail={user.email}
      pendingRequestsCount={pendingRequestsCount}
      pendingPaymentsCount={pendingPaymentsCount}
    >
      {children}
    </AdminLayoutShell>
  )
}
