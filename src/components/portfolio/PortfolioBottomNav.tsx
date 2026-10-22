'use client'

import { useEffect, useState } from 'react'
import { Home, User, LayoutGrid, Mail } from 'lucide-react'

export type PortfolioNavTab = {
  id: string
  label: string
  icon: 'home' | 'about' | 'projects' | 'contact'
}

const ICONS = {
  home: Home,
  about: User,
  projects: LayoutGrid,
  contact: Mail,
} as const

/**
 * Mobile-only bottom navigation for the public portfolio.
 * Fixed at the bottom, highlights the section currently in view
 * (IntersectionObserver) and smooth-scrolls on tap.
 */
export function PortfolioBottomNav({ tabs }: { tabs: PortfolioNavTab[] }) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? 'hero')

  useEffect(() => {
    const elements = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    elements.forEach((el) => observer.observe(el))

    const onScroll = () => {
      if (window.scrollY < 80) setActive(tabs[0]?.id ?? 'hero')
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [tabs])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActive(tabs[0]?.id ?? 'hero')
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 cq-md:hidden"
      style={{
        backgroundColor: 'var(--color-primary)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Portfolio sections"
    >
      <div
        className="grid h-14"
        style={{ gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon]
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleClick(tab.id)}
              aria-current={isActive ? 'true' : undefined}
              className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer"
              style={{ color: isActive ? '#D4A017' : '#ffffff' }}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
