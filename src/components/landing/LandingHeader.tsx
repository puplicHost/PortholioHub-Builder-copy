'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Fixed landing header (reference design): transparent over the hero,
// glass (`--glass` + blur(20px) + divider border) after scrollY > 40.
// Layout is logo left · nav centre · actions right. Actions hold the
// AR/EN pill, the circular sun/moon theme toggle and — on ≤767px — the
// hamburger that opens the full-screen blur menu. All copy is passed in
// so it stays identical to the server-rendered landing.
export function LandingHeader({
  name,
  ar,
  lang,
  theme,
  onLang,
  onTheme,
  labels,
}: {
  name: string
  ar: boolean
  lang: 'ar' | 'en'
  theme: 'light' | 'dark'
  onLang: (lang: 'ar' | 'en') => void
  onTheme: () => void
  labels: { features: string; how: string; plans: string; faq: string; login: string; start: string }
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const ids = ['features', 'how', 'plans', 'faq']
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const items = [
    { id: 'features', label: labels.features },
    { id: 'how', label: labels.how },
    { id: 'plans', label: labels.plans },
    { id: 'faq', label: labels.faq },
  ]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className={`ph-header${scrolled ? ' scrolled' : ''}${open ? ' menu-open' : ''}`}>
      <div className="ph-container ph-header-inner">
        <Link href="/" className="ph-brand">{name}</Link>

        <nav className="ph-nav" aria-label={ar ? 'روابط' : 'Links'}>
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={active === it.id ? 'active' : undefined}
              aria-current={active === it.id ? 'true' : undefined}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div className="ph-header-actions">
          <div className="ph-lang" role="group" aria-label={ar ? 'اللغة' : 'Language'}>
            <button
              type="button"
              className={lang === 'ar' ? 'active' : undefined}
              aria-pressed={lang === 'ar'}
              onClick={() => onLang('ar')}
            >
              AR
            </button>
            <button
              type="button"
              className={lang === 'en' ? 'active' : undefined}
              aria-pressed={lang === 'en'}
              onClick={() => onLang('en')}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            className="ph-theme"
            onClick={onTheme}
            aria-label={
              theme === 'dark'
                ? ar ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode'
                : ar ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link href="/login" className="ph-header-link">{labels.login}</Link>
          <Link href="/register" className="ph-btn ph-btn-primary ph-btn-sm ph-header-cta">{labels.start}</Link>

          <button
            type="button"
            className="ph-ham"
            aria-label={ar ? 'القائمة' : 'Menu'}
            aria-expanded={open}
            aria-controls="ph-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div id="ph-mobile-menu" className="ph-menu" role="dialog" aria-modal="true" aria-hidden={!open}>
        {items.map((it) => (
          <a key={it.id} href={`#${it.id}`} onClick={() => setOpen(false)}>{it.label}</a>
        ))}
        <Link href="/login" onClick={() => setOpen(false)}>{labels.login}</Link>
        <Link href="/register" onClick={() => setOpen(false)} className="ph-menu-cta">{labels.start}</Link>
      </div>
    </header>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
