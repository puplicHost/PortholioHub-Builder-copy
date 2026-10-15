'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Globe, ScrollText, Settings, ChevronsLeft, ChevronsRight, Hammer, Inbox, CreditCard, Receipt, Tags } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/requests', label: 'Requests', icon: Inbox, exact: false },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, exact: false },
  { href: '/admin/payments', label: 'Payments', icon: Receipt, exact: false },
  { href: '/admin/plans', label: 'Plans', icon: Tags, exact: false },
  { href: '/admin/portfolios', label: 'Portfolios', icon: Globe, exact: false },
  { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
]

// Collapsible admin sidebar (state persisted in localStorage).
// Requests / subscriptions / payments / plans land here with Sprint C.
export function AdminSidebar() {
  const pathname = usePathname()
  // Persisted collapse state. Lazy initializer (SSR-safe: server renders
  // expanded); suppressHydrationWarning covers the width/class diff when
  // a stored preference applies on first client render.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem('admin-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })

  const toggle = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem('admin-sidebar', prev ? 'expanded' : 'collapsed')
      } catch {
        // ignore
      }
      return !prev
    })
  }

  return (
    <aside
      suppressHydrationWarning
      className={`shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col transition-all ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <Hammer className="h-4 w-4" />
        </span>
        {!collapsed && <span className="text-sm font-bold truncate">Admin</span>}
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={toggle}
        className="m-2 flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
