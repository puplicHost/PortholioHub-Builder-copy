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
        {items.map((it) => (
          <a key={it.id} href={`#${it.id}`} onClick={() => setOpen(false)}>{it.label}</a>
        ))}
        <Link href="/login" onClick={() => setOpen(false)}>{labels.login}</Link>
        <Link href="/register" onClick={() => setOpen(false)} className="ph-menu-cta">{labels.start}</Link>
      </div>
    </header>
  )
}
