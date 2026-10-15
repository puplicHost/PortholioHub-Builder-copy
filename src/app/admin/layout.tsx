import Link from 'next/link'
import { requireAdmin } from '@/lib/guards'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin | PortfolioHub',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs text-[var(--color-text-muted)] truncate">
            Signed in as <span className="font-medium text-[var(--color-text-primary)]">{user.email}</span>
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/profile/builder" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
              Builder
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
