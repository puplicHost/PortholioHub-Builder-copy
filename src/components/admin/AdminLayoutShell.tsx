'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Users,
  Globe,
  ScrollText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Hammer,
  Inbox,
  CreditCard,
  Receipt,
  Tags,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  LifeBuoy,
  Megaphone,
  Banknote,
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export interface NavItemDef {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
  badgeKey?: 'requests' | 'payments'
}

export const NAV_ITEMS: NavItemDef[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/revenue', label: 'Revenue', icon: Banknote, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy, exact: false },
  { href: '/admin/requests', label: 'Requests', icon: Inbox, exact: false, badgeKey: 'requests' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, exact: false },
  { href: '/admin/payments', label: 'Payments', icon: Receipt, exact: false, badgeKey: 'payments' },
  { href: '/admin/plans', label: 'Plans', icon: Tags, exact: false },
  { href: '/admin/portfolios', label: 'Portfolios', icon: Globe, exact: false },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone, exact: false },
  { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
]

interface AdminLayoutShellProps {
  userEmail: string
  pendingRequestsCount?: number
  pendingPaymentsCount?: number
  children: ReactNode
}

export function AdminLayoutShell({
  userEmail,
  pendingRequestsCount = 0,
  pendingPaymentsCount = 0,
  children,
}: AdminLayoutShellProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setThemeMounted(true)
  }, [])

  // Persisted collapse state for desktop
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem('admin-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem('admin-sidebar', prev ? 'expanded' : 'collapsed')
      } catch {
        // ignore
      }
      return !prev
    })
  }

  const getBadgeCount = (badgeKey?: 'requests' | 'payments') => {
    if (badgeKey === 'requests') return pendingRequestsCount
    if (badgeKey === 'payments') return pendingPaymentsCount
    return 0
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside
        suppressHydrationWarning
        className={`hidden md:flex shrink-0 border-r rtl:border-r-0 rtl:border-l border-[var(--color-border)] bg-[var(--color-surface)] flex-col transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex items-center gap-2.5 p-3.5 border-b border-[var(--color-border)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-xs">
            <Hammer className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold truncate block">Admin Panel</span>
              <span className="text-[10px] text-[var(--color-text-muted)] truncate block">PortfolioHub</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            const badgeCount = getBadgeCount(item.badgeKey)

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <div className="relative shrink-0">
                  <Icon className="h-4 w-4" />
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-2 w-2 rounded-full bg-[var(--color-warning)]" />
                  )}
                </div>

                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-warning)] text-white shrink-0">
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={toggleCollapse}
          className="m-2 flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
          ) : (
            <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
          )}
        </button>
      </aside>

      {/* Mobile Drawer (visible on mobile when opened) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 start-0 z-50 w-64 bg-[var(--color-surface)] border-r rtl:border-r-0 rtl:border-l border-[var(--color-border)] shadow-2xl flex flex-col md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
              <Hammer className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            const badgeCount = getBadgeCount(item.badgeKey)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-warning)] text-white">
                    {badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[var(--color-border)] space-y-2">
          <p className="text-xs text-[var(--color-text-muted)] truncate px-1">
            Signed in as <span className="font-medium text-[var(--color-text-primary)]">{userEmail}</span>
          </p>
          <div className="flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live Site
            </Link>
            <Link
              href="/profile/builder"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
            >
              Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xs px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] cursor-pointer shrink-0"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              Signed in as <span className="font-medium text-[var(--color-text-primary)]">{userEmail}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live site
            </Link>
            <Link
              href="/profile/builder"
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
            >
              Builder
            </Link>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label={themeMounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0"
            >
              {themeMounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 text-[var(--color-warning)]" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                )
              ) : (
                <span className="h-4 w-4" />
              )}
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
