'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Fixed landing header (DESIGN.md §5.1): transparent over the hero, glass
// (`--glass` + blur(20px) + divider border) after scrollY > 40. Adds the
// reference hamburger + blur overlay menu on ≤767px. Labels are passed in so
// copy stays identical to the server-rendered landing.
export function LandingHeader({
  name,
  ar,
  labels,
}: {
  name: string
  ar: boolean
  labels: { features: string; how: string; plans: string; login: string; start: string }
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <a href="#features">{labels.features}</a>
          <a href="#how">{labels.how}</a>
          <a href="#plans">{labels.plans}</a>
        </nav>
        <div className="ph-header-actions">
          <Link href="/login" className="ph-header-link">{labels.login}</Link>
          <Link href="/register" className="ph-btn ph-btn-primary ph-btn-sm">{labels.start}</Link>
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
        <a href="#features" onClick={() => setOpen(false)}>{labels.features}</a>
        <a href="#how" onClick={() => setOpen(false)}>{labels.how}</a>
        <a href="#plans" onClick={() => setOpen(false)}>{labels.plans}</a>
        <Link href="/login" onClick={() => setOpen(false)}>{labels.login}</Link>
        <Link href="/register" onClick={() => setOpen(false)} className="ph-menu-cta">{labels.start}</Link>
      </div>
    </header>
  )
}
