'use client'

import { useEffect, useState } from 'react'
import { Home, User, LayoutGrid, Mail, MoreHorizontal, X, ChevronRight } from 'lucide-react'

export type PortfolioNavTab = {
  id: string
  label: string
  icon: 'home' | 'about' | 'projects' | 'contact' | 'more'
}

export type ExtraNavSection = {
  id: string
  label: string
}

const ICONS = {
  home: Home,
  about: User,
  projects: LayoutGrid,
  contact: Mail,
  more: MoreHorizontal,
} as const

/**
 * Mobile-only bottom navigation for the public portfolio.
 * Fixed at the bottom, highlights the section currently in view
 * (IntersectionObserver), smooth-scrolls on tap, and offers a slide-up
 * "More" drawer when additional sections are present.
 */
export function PortfolioBottomNav({
  tabs,
  extraSections = [],
  lang = 'ar',
}: {
  tabs: PortfolioNavTab[]
  extraSections?: ExtraNavSection[]
  lang?: 'ar' | 'en'
}) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? 'hero')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const hasExtra = extraSections.length > 0
  const allTabs: PortfolioNavTab[] = hasExtra
    ? [
        ...tabs,
        {
          id: 'more',
          label: lang === 'ar' ? 'المزيد' : 'More',
          icon: 'more' as const,
        },
      ]
    : tabs

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

  // Handle drawer escape key and body scroll lock
  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawerOpen])

  const handleClick = (id: string) => {
    if (id === 'more') {
      setIsDrawerOpen(true)
      return
    }
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
    <>
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
          style={{ gridTemplateColumns: `repeat(${Math.max(allTabs.length, 1)}, minmax(0, 1fr))` }}
        >
          {allTabs.map((tab) => {
            const Icon = ICONS[tab.icon]
            const isActive = tab.id === 'more' ? isDrawerOpen : active === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                aria-current={isActive && tab.id !== 'more' ? 'true' : undefined}
                aria-haspopup={tab.id === 'more' ? 'dialog' : undefined}
                aria-expanded={tab.id === 'more' ? isDrawerOpen : undefined}
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

      {/* Slide-up "More" drawer modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 cq-md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-drawer-title"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl transition-transform"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 id="more-drawer-title" className="text-base font-bold text-[var(--color-text)]">
                {lang === 'ar' ? 'جميع الأقسام' : 'All Sections'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/20 hover:text-[var(--color-text)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-1 overflow-y-auto">
              {extraSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false)
                    handleClick(sec.id)
                  }}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer"
                >
                  <span>{sec.label}</span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] rtl:rotate-180" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
