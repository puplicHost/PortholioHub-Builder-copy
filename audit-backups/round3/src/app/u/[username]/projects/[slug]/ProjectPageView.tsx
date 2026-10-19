'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/urls'

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
      <path d="M11 12h4" /><path d="M11 16h7" /><path d="M11 20h10" />
    </svg>
  )
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

function Code({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2))
}

export function ProjectPageView({ profile, projectPage }: { profile: any; projectPage: any }) {
  const appearance = profile.appearance || {}
  const defaultLangMode = appearance.defaultLanguage || 'en'
  const defaultColorMode = appearance.colorMode || 'light'
  const [lang, setLang] = useState<'ar' | 'en'>(defaultLangMode === 'ar' ? 'ar' : 'en')
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultColorMode)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Mount-only read of the browser-persisted theme. Kept in an effect
  // (not a state initializer) so the first committed render always matches
  // SSR; applied inside rAF so it lands before the next paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const savedTheme = localStorage.getItem('portfolio-theme') as 'light' | 'dark' | null
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const primary = appearance.primaryColor || '#60a5fa'
  const primaryLight = adjustColor(primary, 40)
  const bgLight = appearance.bgColorLight || '#f9fafb'
  const bgDark = appearance.bgColorDark || '#111827'
  const currentBg = theme === 'dark' ? bgDark : bgLight
  const currentText = theme === 'dark' ? '#f3f4f6' : '#1f2937'
  const currentCard = theme === 'dark' ? adjustColor(bgDark, 15) : adjustColor(bgLight, -5)
  const currentBorder = appearance.borderColor || (theme === 'dark' ? '#374151' : '#e5e7eb')
  const currentOutline = appearance.outlineColor || primary
  const fontFam = appearance.font || 'Inter'
  const displayName = profile.displayName || profile.username
  const initial = displayName.substring(0, 2).toUpperCase()
  const projects = projectPage.items || []
  const displayMode = projectPage.displayMode || 'grid'

  const style = {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-bg': currentBg,
    '--color-text': currentText,
    '--color-text-muted': `color-mix(in srgb, ${currentText} 70%, ${currentBg})`,
    '--color-card': currentCard,
    '--color-border': currentBorder,
    '--border-color': currentBorder,
    '--color-outline': currentOutline,
    '--outline-color': currentOutline,
    fontFamily: `"${fontFam}", system-ui, sans-serif`,
  } as React.CSSProperties

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={style}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 flex items-center justify-between">
          <Link href={`/u/${profile.username}`} className="flex items-center">
            {appearance.logoUrl ? (
              <img src={sanitizeUrl(appearance.logoUrl)} alt="Logo" className="h-9 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-black text-[var(--color-primary)] tracking-tight">{initial}</span>
            )}
          </Link>
          <div className="flex items-center gap-6">
            {appearance.defaultLanguage === 'both' && (
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="px-2 py-1 text-[11px] font-bold text-[var(--color-text)] border border-[var(--color-border)] rounded bg-[var(--color-card)] hover:bg-[var(--color-border)] transition-colors"
              >
                {lang === 'en' ? 'AR' : 'EN'}
              </button>
            )}
            <button
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark'
                setTheme(next)
                localStorage.setItem('portfolio-theme', next)
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm text-[var(--color-text)] cursor-pointer"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </nav>

      {/* Back Button */}
      {projectPage.showBackButton !== false && (
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-6">
          <Link
            href={`/u/${profile.username}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowUp className="h-4 w-4 rotate-[-90deg]" />
            {projectPage.backButtonLabel || 'Back to Portfolio'}
          </Link>
        </div>
      )}

      {/* Page Title */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] break-words">{projectPage.title}</h1>
        {projectPage.description && (
          <p className="mt-3 text-[var(--color-text-muted)] text-lg break-words">{projectPage.description}</p>
        )}
      </div>

      {/* Projects Grid/List */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pb-16">
        {displayMode === 'list' ? (
          <div className="flex flex-col gap-6">
            {projects.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
                <div className="w-full sm:w-[300px] h-[200px] sm:h-auto shrink-0 bg-[var(--color-bg)] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--color-border)] overflow-hidden">
                  {item.imageUrl ? (
                    <img src={sanitizeUrl(item.imageUrl)} alt={item.title || 'Project'} className="w-full h-full object-cover" />
                  ) : (
                    <Code className="h-12 w-12 text-[var(--color-border)]" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 min-w-0">
                  <h3 className="text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-3">{item.title || 'Project Item'}</h3>
                  {item.textContent && <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4">{item.textContent}</p>}
                  {item.externalUrl && (
                    <a href={sanitizeUrl(item.externalUrl)} target="_blank" rel="noreferrer" className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                      <ExternalLink className="h-4 w-4" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-[var(--color-text-muted)] text-center font-medium py-8">No projects on this page yet.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {projects.map((item: any) => (
              <div key={item.id} className="group rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                <div className="h-[200px] w-full bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)] overflow-hidden">
                  {item.imageUrl ? (
                    <img src={sanitizeUrl(item.imageUrl)} alt={item.title || 'Project'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Code className="h-12 w-12 text-[var(--color-border)]" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 min-w-0">
                  <h3 className="text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-3">{item.title || 'Project Item'}</h3>
                  {item.textContent && <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4 line-clamp-3">{item.textContent}</p>}
                  {item.externalUrl && (
                    <a href={sanitizeUrl(item.externalUrl)} target="_blank" rel="noreferrer" className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                      <ExternalLink className="h-4 w-4" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-[var(--color-text-muted)] text-center font-medium py-8 col-span-full">No projects on this page yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="py-16"
        style={{ backgroundColor: appearance.footerBg || '#0f172a', color: appearance.footerText || '#94a3b8' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-white/70">© {new Date().getFullYear()} · Developed with PortfolioHub</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      {appearance.actionButtons?.showScrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <ArrowUp className="h-5 w-5 rotate-180" />
        </button>
      )}
    </div>
  )
}
