/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackPortfolioEvent } from '@/components/portfolio/TrackBeacon'
import { normalizeWhatsappNumber } from '@/lib/whatsapp'
import { sanitizeUrl } from '@/lib/urls'
import { portfolioImageUrl } from '@/lib/cloudinary'
import { isSectionVisible } from '@/lib/section-visibility'
import { getPortfolioLang, pickLang } from '@/lib/portfolio-language'
import {
  formatExperienceRange,
  isStoredMonth,
  calcExperienceDuration,
} from '@/lib/experience-dates'
import { TestimonialsSlider } from '@/components/portfolio/TestimonialsSlider'
import { PortfolioBottomNav, type PortfolioNavTab, type ExtraNavSection } from '@/components/portfolio/PortfolioBottomNav'
import { PortfolioFooter, getContactIcon, getSocialIcon } from '@/components/portfolio/PortfolioFooter'
import { ProjectCardBody, ProjectCardMedia, ProjectFileIcon } from '@/components/portfolio/ProjectCard'
import {
  getDynamicGridCols,
  projectCardVisual,
  projectFileAction,
  projectFileType,
  projectImageFit,
} from '@/lib/project-card-visuals'
import { Globe, Mail, Phone, ExternalLink, ArrowRight, ArrowUp, Code, Layout, Palette, Database, PenTool, CheckCircle, Briefcase, User as UserIcon, MessageCircle, Trophy, Star, Users, Heart, Zap, Target, Award, Clock, TrendingUp, Layers, Rocket, MapPin, FileText, Table2, FolderOpen, Image as ImageIcon, File, X, Menu, Sun, Moon } from 'lucide-react'

// Helper to lighten/darken a hex color
function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

import { PORTFOLIO_ICON_MAP } from '@/lib/portfolio-icons'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  trophy: Trophy, star: Star, users: Users, briefcase: Briefcase,
  heart: Heart, zap: Zap, target: Target, award: Award,
  clock: Clock, trendingup: TrendingUp, globe: Globe, code: Code,
  layers: Layers, checkcircle: CheckCircle, rocket: Rocket,
  mail: Mail, phone: Phone, externalink: ExternalLink, arrowright: ArrowRight,
  layout: Layout, palette: Palette, database: Database, pen: PenTool,
  user: UserIcon, message: MessageCircle,
}

function getIcon(name?: string | null, className?: string) {
  if (!name) return null
  const key = name.toLowerCase().trim()
  const clean = key.replace(/[^a-z0-9]/g, '')
  const Icon = PORTFOLIO_ICON_MAP[clean] || PORTFOLIO_ICON_MAP[key] || ICON_MAP[key]
  return Icon ? <Icon className={className} aria-hidden="true" /> : null
}

// Document-specific color tones, card visuals and file actions live in the
// shared project-card helpers so project-page items reuse them exactly.

// Helper to determine if a color hex is light or dark
function isLightColor(colorStr?: string): boolean {
  if (!colorStr) return false
  const hex = colorStr.replace('#', '')
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
  }
  return false
}

// Focal point stored by the builder as percentages. Unknown/legacy values fall
// back to the centre so old profiles render exactly as before.
function normalizeImagePosition(value: any): { x: number; y: number } {
  const x = Number(value?.x)
  const y = Number(value?.y)
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  }
}

// The template is rendered both as a full page and inline inside the
// builder's preview boxes. In the inline case the page does not scroll —
// an ancestor does — so scroll-driven behaviour must target that ancestor.
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node)
    // Only a real wrapper scroller counts. body/html are excluded on purpose:
    // `body { overflow-x: hidden }` computes overflow-y to `auto`, but the
    // document (not the body element) is what scrolls, so binding to it
    // would silently break the nav shadow and "back to top" on public pages.
    if (/(auto|scroll)/.test(style.overflowY)) return node
    node = node.parentElement
  }
  return null
}

// Fixed navbar labels per section TYPE (independent of the editable section
// heading). Derived from each type's built-in default title, so renaming a
// section only changes its on-page heading, never its nav link. Custom
// sections have no per-type label and therefore always read "More".
const SECTION_NAV_LABELS: Record<string, { en: string; ar: string }> = {
  about: { en: 'About', ar: 'نبذة عني' },
  skills: { en: 'Skills', ar: 'المهارات' },
  experience: { en: 'Experience', ar: 'الخبرة' },
  education: { en: 'Education', ar: 'التعليم' },
  services: { en: 'Services', ar: 'الخدمات' },
  projects: { en: 'Projects', ar: 'المشاريع' },
  clients: { en: 'Clients', ar: 'العملاء' },
  gallery: { en: 'Gallery', ar: 'معرض الأعمال' },
  files: { en: 'Downloads', ar: 'الملفات' },
  testimonials: { en: 'Testimonials', ar: 'آراء العملاء' },
  contact: { en: 'Contact', ar: 'تواصل معي' },
  footer: { en: 'Contact', ar: 'تواصل معي' },
  custom: { en: 'More', ar: 'المزيد' },
}

// Project cards may opt into a file-style tile instead of a cover image.
// Older rows have no metadata and keep the original image/placeholder look.

function ClientLogoItem({
  client,
  shapeClass,
  sizeClass,
  paddingClass,
  cardBg,
  isGrayscale,
  lang,
  t,
}: {
  client: any
  shapeClass: string
  sizeClass: string
  paddingClass: string
  cardBg: string
  isGrayscale: boolean
  lang: string
  t: (val: any) => string
}) {
  const [imgError, setImgError] = useState(false)
  if (imgError) return null

  const name = t(client.name) || ''
  const rawUrl = client.url ? sanitizeUrl(client.url) : ''
  const isHttpUrl = /^https?:\/\//i.test(rawUrl)
  const logoSrc = sanitizeUrl(client.logoUrl)
  if (!logoSrc || !/^https?:\/\//i.test(logoSrc)) return null

  const ariaLabel = name
    ? (isHttpUrl ? (lang === 'ar' ? `زيارة ${name}` : `Visit ${name}`) : name)
    : (isHttpUrl ? (lang === 'ar' ? 'زيارة الموقع' : 'Visit brand') : undefined)

  const containerBase = `relative flex items-center justify-center shrink-0 border border-[var(--color-border)] shadow-sm overflow-hidden select-none ${shapeClass} ${sizeClass} ${paddingClass}`

  const imgElement = (
    <img
      src={portfolioImageUrl(logoSrc, 300)}
      alt={name}
      loading="lazy"
      decoding="async"
      width={144}
      height={144}
      onError={() => setImgError(true)}
      className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
        isGrayscale ? 'grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-focus-visible:grayscale-0 group-focus-visible:opacity-100' : ''
      }`}
    />
  )

  if (isHttpUrl) {
    return (
      <a
        href={rawUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        title={name || undefined}
        style={{ backgroundColor: cardBg }}
        className={`group ${containerBase} cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]`}
      >
        {imgElement}
      </a>
    )
  }

  return (
    <div
      title={name || undefined}
      aria-label={ariaLabel}
      style={{ backgroundColor: cardBg }}
      className={`group ${containerBase}`}
    >
      {imgElement}
    </div>
  )
}

export function ClassicTemplate({
  profile,
  isFree = false,
  preview = false,
}: {
  profile: any
  isFree?: boolean
  preview?: boolean
  onThemeChange?: (mode: 'light' | 'dark') => void
}) {
  const appearance = profile.appearance || {}
  const avatarPosition = normalizeImagePosition(appearance.avatarPosition)
  const localized = profile.localized || {}
  const contactLinks = profile.contactLinks || []
  
  const defaultLangMode = getPortfolioLang(appearance)
  // New profiles store `defaultColorMode`; `colorMode` is the legacy field.
  const defaultColorMode: string = appearance.defaultColorMode || appearance.colorMode || 'light'
  const defaultTheme: 'light' | 'dark' = defaultColorMode.startsWith('dark') ? 'dark' : 'light'

  // Visitor theme: read from localStorage on mount, fall back to owner's defaultColorMode
  const [visitorTheme, setVisitorTheme] = useState<'light' | 'dark'>(defaultTheme)
  // If there's a saved visitor preference, use it; otherwise fall back to owner default
  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem(`portfolio-theme-${profile.username || 'unknown'}`)
      : null
    if (saved === 'light' || saved === 'dark') {
      setVisitorTheme(saved)
    }
  }, [profile.username])

  const [lang, setLang] = useState<'ar' | 'en'>(defaultLangMode === 'ar' ? 'ar' : 'en')
  // Sync when the incoming language default changes (render-phase adjustment
  // instead of setState-in-effect: same end state, no cascading render pass).
  const [prevDefaultLang, setPrevDefaultLang] = useState(defaultLangMode)
  if (prevDefaultLang !== defaultLangMode) {
    setPrevDefaultLang(defaultLangMode)
    setLang(defaultLangMode === 'ar' ? 'ar' : 'en')
  }

  // Live-update the preview when the owner changes the default color mode.
  const [prevDefaultTheme, setPrevDefaultTheme] = useState(defaultTheme)
  if (prevDefaultTheme !== defaultTheme) {
    setPrevDefaultTheme(defaultTheme)
    setVisitorTheme(defaultTheme)
  }

  // Show toggle only when defaultColorMode includes "with-toggle" and showThemeToggle is not false
  const showToggle = defaultColorMode?.includes('with-toggle') && appearance.showThemeToggle !== false

  // Theme toggle function: flip visitor theme and persist to localStorage
  const toggleTheme = () => {
    const newTheme = visitorTheme === 'light' ? 'dark' : 'light'
    setVisitorTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`portfolio-theme-${profile.username || 'unknown'}`, newTheme)
    }
  }

  // The owner's default theme (`defaultColorMode`) seeds the visitor theme.
  // When the owner enables a "with-toggle" mode, visitors may switch and their
  // choice is persisted in localStorage per username.


  const [isScrolled, setIsScrolled] = useState(false)
  const [isScrolledPast24, setIsScrolledPast24] = useState(false)
  const [previewHeight, setPreviewHeight] = useState<number | null>(null)
  const [activeId, setActiveId] = useState('hero')
  const [educationLightbox, setEducationLightbox] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Certificate lightbox: Escape closes, body scroll is locked while open.
  useEffect(() => {
    if (!educationLightbox) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEducationLightbox(null)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [educationLightbox])

  useEffect(() => {
    const target = getScrollParent(rootRef.current)
    let rafId: number | null = null

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const scrollY = target ? target.scrollTop : window.scrollY
        setIsScrolled(scrollY > 50)
        setIsScrolledPast24(scrollY > 24)
      })
    }

    handleScroll()
    const el: HTMLElement | Window = target ?? window
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!preview) return
    const scrollParent = getScrollParent(rootRef.current)
    if (!scrollParent) return
    const updateHeight = () => {
      setPreviewHeight(scrollParent.clientHeight)
    }
    updateHeight()
    const ro = new ResizeObserver(updateHeight)
    ro.observe(scrollParent)
    return () => ro.disconnect()
  }, [preview])

  const scrollToTop = () => {
    const target = getScrollParent(rootRef.current)
    if (target) {
      target.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const actionButtons = appearance.actionButtons || {}
  const showScrollToTop = actionButtons.showScrollToTop !== false
  const whatsappNumber = actionButtons.whatsappNumber || ''
  const waDigits = normalizeWhatsappNumber(whatsappNumber)
  // In the builder preview there is no real visitor scroll position and no
  // requirement to have a phone number saved yet. Keep both toggles visible so
  // flipping them produces immediate, observable feedback.
  const showScrollToTopButton = showScrollToTop && (preview || isScrolled)
  const showWhatsappButton = actionButtons.showWhatsapp !== false && (!!waDigits || preview)

  // Item 8: resolve every `{ar,en}` (or flat-string) user-content value for the
  // visitor's language, falling back to the other language when a translation
  // is empty. `t()` is the single bilingual resolver used across the template.
  const t = (v: unknown): string => pickLang(v as never, lang)
  const displayName = t(localized.displayName) || profile.displayName || profile.username
  const title = t(localized.professionalTitle)
  const bio = t(localized.bio)
  const rawSections = [...(profile.pages?.[0]?.sections || [])]
  const hasFooterSection = rawSections.some((s: any) => s.sectionType === 'footer')
  const sections = rawSections
    .filter((s: any) => s.sectionType !== 'contact')
    .concat(
      !hasFooterSection
        ? [{
            id: 'footer-default-fallback',
            sectionType: 'footer',
            sectionOrder: 999,
            // Old profiles without a footer section still get a footer, but
            // with no invented copy: identity and links come from real data.
            content: { links: contactLinks },
            settings: { isVisible: true },
          }]
        : []
    )
    .sort((a: any, b: any) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0))

  // Derived colors
  const primary = appearance.primaryColor || '#38BDF8'
  const accent = appearance.accentColor || '#818CF8'
  const primaryLight = adjustColor(primary, 40)
  
  const bgLight = appearance.bgColorLight || '#F0F9FF'
  const bgDark = appearance.bgColorDark || '#111827'
  
  const isDark = visitorTheme === 'dark'
  const currentBg = isDark ? bgDark : bgLight
  const currentText = isDark 
    ? (appearance.textColorDark || '#E5E7EB') 
    : (appearance.textColorLight || '#0F172A')
  const currentMuted = isDark
    ? (appearance.mutedTextDark || '#858688')
    : (appearance.mutedText || '#64748B')
  const currentCard = isDark
    ? (appearance.cardBackgroundDark || '#374151')
    : (appearance.cardBackground || '#FFFFFF')
  const currentBorder = isDark
    ? (appearance.borderColorDark || '#4B5563')
    : (appearance.borderColor || '#BAE6FD')
  const currentOutline = appearance.outlineColor || primary
  
  // Font name is charset-guarded: only letters/digits/space/+/- may reach the
  // Google Fonts URL. Anything else falls back to the default "Inter", so the
  // value can never inject extra query params or break the stylesheet.
  const fontFam =
    typeof appearance.font === 'string' &&
    /^[A-Za-z0-9 +-]+$/.test(appearance.font) &&
    appearance.font.trim()
      ? appearance.font.trim()
      : 'Inter'
  const fontLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFam).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`

  const onPrimary = isLightColor(primary) ? '#0f172a' : '#ffffff'

  const style = {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-on-primary': onPrimary,
    '--color-accent': accent,
    '--color-gradient': `linear-gradient(135deg, ${primary}, ${accent})`,
    '--color-bg': currentBg,
    '--color-bg-alt': currentCard,
    '--color-text': currentText,
    '--color-text-muted': currentMuted,
    '--color-muted': currentMuted,
    '--color-card': currentCard,
    '--color-card-border': currentBorder,
    '--border-radius-card': '15px',
    '--shadow-subtle': 'rgba(0,0,0,0.1) 0px 2px 10px 0px',
    '--shadow-medium': 'rgba(0,0,0,0.1) 0px 5px 15px 0px',
    '--color-border': currentBorder,
    '--color-outline': currentOutline,
    '--outline-color': currentOutline,
    fontFamily: `"${fontFam}", system-ui, sans-serif`,
  } as React.CSSProperties

  // Visibility comes from the shared helper so the page, the builder list and
  // the publish check can never disagree on which sections are shown.
  // Empty base Education sections are skipped too: existing profiles gain the
  // section through the builder migration, but their published page must stay
  // unchanged until an actual education item exists.
  const hasRenderableEducation = (section: any) => {
    if (section?.sectionType !== 'education') return true
    const items = Array.isArray(section.content?.items) ? section.content.items : []
    return items.some((item: any) => t(item?.title))
  }
  const hasRenderableClients = (section: any) => {
    if (section?.sectionType !== 'clients') return true
    const items = Array.isArray(section.content?.items) ? section.content.items : []
    return items.some((item: any) => Boolean(item?.logoUrl))
  }
  const visibleSections = sections.filter(isSectionVisible).filter(hasRenderableEducation).filter(hasRenderableClients)
  const firstVisibleSection = visibleSections[0]
  const isHeroFirst = Boolean(firstVisibleSection && firstVisibleSection.sectionType === 'hero')
  const isNavbarTransparent = isHeroFirst && !isScrolledPast24

  const isSectionRenderable = (section: any) => {
    if (!section || !isSectionVisible(section)) return false
    if (section.sectionType === 'hero') return false
    const c = section.content || {}
    switch (section.sectionType) {
      case 'about':
      case 'projects':
      case 'experience':
      case 'services':
      case 'testimonials':
        return true
      case 'clients': {
        const items = Array.isArray(c.items) ? c.items : []
        return items.some((item: any) => Boolean(item?.logoUrl))
      }
      case 'education': {
        const items = Array.isArray(c.items) ? c.items : []
        return items.some((item: any) => Boolean(t(item?.title)))
      }
      case 'skills': {
        const groups = Array.isArray(c.groups) ? c.groups : []
        if (groups.length > 0) {
          return groups.some((g: any) => Array.isArray(g.skills) && g.skills.some((s: any) => s && s.name && s.name.trim()))
        }
        const fallback = Array.isArray(c.skills) ? c.skills : []
        return fallback.some((s: any) => typeof s === 'string' && s.trim() !== '')
      }
      case 'gallery': {
        const items = Array.isArray(c.items) ? c.items : []
        return items.length > 0
      }
      case 'files': {
        const items = Array.isArray(c.items) ? c.items : []
        return items.some((f: any) => f && (f.url || f.externalUrl))
      }
      case 'contact': {
        const links = Array.isArray(c.links) ? c.links : []
        return links.length > 0 || Boolean(t(c.title)) || Boolean(t(c.headline)) || Boolean(t(c.description))
      }
      case 'custom': {
        const paras = Array.isArray(c.paragraphs) ? c.paragraphs.filter((p: any) => typeof p === 'string' && p.trim() !== '') : []
        const cards = (Array.isArray(c.cards) ? c.cards : []).filter((card: any) => {
          if (!card || typeof card !== 'object') return false
          return Boolean(t(card.title) || t(card.description) || sanitizeUrl(card.image) || card.icon || sanitizeUrl(card.linkUrl))
        })
        return Boolean(t(c.title)) || paras.length > 0 || Boolean(t(c.description)) || cards.length > 0
      }
      case 'footer':
        return true
      default:
        return false
    }
  }
  const renderedSections = visibleSections.filter(isSectionRenderable)

  // Reveal animations are re-scanned whenever the rendered structure changes.
  // A one-shot observer (mount only) left re-shown sections, display-mode
  // remounts and newly added items stuck at opacity-0 until a full reload.
  const revealKey = visibleSections
    .map((s: any) => {
      const c = s.content || {}
      const count = (v: unknown) => (Array.isArray(v) ? v.length : 0)
      return [
        s.id,
        c.displayMode || '',
        count(c.items),
        count(c.groups),
        count(c.stats),
        count(c.paragraphs),
        count(c.links),
        count(c.images),
        count(c.cards),
      ].join(':')
    })
    .join('|') + `#${(profile.projectPages || []).map((p: any) => `${p.id}:${p.title || ''}:${p.coverImage ? 1 : 0}`).join(',')}`

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Safety net: force-reveal all fade-up elements after a short timeout
    // if the IntersectionObserver never fires (e.g., very tall section on
    // small viewport where intersection ratio never reaches threshold).
    // Respects prefers-reduced-motion via the existing CSS rule.
    const safetyTimer = setTimeout(() => {
      root.querySelectorAll('.fade-up:not(.animate-in), .skill-bar:not(.animate-in)').forEach((el) => {
        el.classList.add('animate-in')
        if (el.classList.contains('skill-bar')) {
          const width = el.getAttribute('data-width')
          if (width) (el as HTMLElement).style.width = width
        }
      })
    }, 2000)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('animate-in')
          if (entry.target.classList.contains('skill-bar')) {
            const width = entry.target.getAttribute('data-width')
            if (width) (entry.target as HTMLElement).style.width = width
          }
          // One-shot per element: a remount creates a fresh node anyway.
          observer.unobserve(entry.target)
        })
      },
      // threshold: 0 fires as soon as ANY pixel intersects (even 1px).
      // This guarantees reveal on tall sections where 0.1 threshold
      // would never be reached on small viewports.
      { threshold: 0, root: getScrollParent(root) }
    )

    root
      .querySelectorAll('.fade-up:not(.animate-in), .skill-bar:not(.animate-in)')
      .forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      clearTimeout(safetyTimer)
    }
  }, [revealKey])

  // Scroll-spy: highlight the nav link for the section currently in view.
  const navSectionIds = ['hero', ...renderedSections.map((s: any) =>
    s.sectionType === 'footer'
      ? 'contact'
      : s.sectionType === 'contact'
        ? 'contact-info'
        : s.sectionType === 'custom'
          ? `custom-${s.id}`
          : s.sectionType
  )]
  const navSectionIdsKey = navSectionIds.join(',')
  useEffect(() => {
    const root = rootRef.current
    const scrollRoot = getScrollParent(root)
    const els = navSectionIdsKey
      .split(',')
      .map((id) => (root && id ? root.querySelector<HTMLElement>(`#${id}`) : null))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const update = () => {
      const offset = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top - offset <= 120) current = el.id
      }
      setActiveId(current)
    }
    update()
    const el: HTMLElement | Window = scrollRoot ?? window
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [navSectionIdsKey])

  // Desktop navbar links & hamburger menu state
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isNavMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNavMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNavMenuOpen])

  const navLinks = renderedSections.map((s: any) => {
    const label =
      s.sectionType === 'custom'
        ? (t(s.content?.title) || SECTION_NAV_LABELS.custom[lang])
        : SECTION_NAV_LABELS[s.sectionType]?.[lang] ||
          t(s.content?.title) ||
          s.sectionType
    const targetId =
      s.sectionType === 'footer'
        ? 'contact'
        : s.sectionType === 'contact'
          ? 'contact-info'
          : s.sectionType === 'custom'
            ? `custom-${s.id}`
            : s.sectionType
    return { id: s.id, targetId, label }
  })

  // Mobile bottom navigation: always Home + Contact (the footer always
  // renders), plus About / Projects only when those sections are published.
  const navTabs: PortfolioNavTab[] = [
    { id: 'hero', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: 'home' },
    ...(renderedSections.some((s: any) => s.sectionType === 'about')
      ? [{ id: 'about', label: lang === 'ar' ? 'عني' : 'About', icon: 'about' as const }]
      : []),
    ...(renderedSections.some((s: any) => s.sectionType === 'projects')
      ? [{ id: 'projects', label: lang === 'ar' ? 'أعمالي' : 'Projects', icon: 'projects' as const }]
      : []),
    { id: 'contact', label: lang === 'ar' ? 'تواصل' : 'Contact', icon: 'contact' },
  ]

  const primaryTabTargetIds = new Set(navTabs.map((t) => t.id))
  // Rendered sections that are not one of the 4 primary tabs go into the "More" drawer
  const extraSections: ExtraNavSection[] = navLinks
    .filter((l) => !primaryTabTargetIds.has(l.targetId))
    .map((l) => ({ id: l.targetId, label: l.label }))

  const renderSectionDescription = (content: any) => {
    const text = t(content?.description)
    if (!text) return null
    return (
      <p
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="text-[var(--color-text-muted)] leading-relaxed max-w-2xl text-sm cq-sm:text-base mb-6 text-pretty"
      >
        {text}
      </p>
    )
  }

  const renderSection = (section: any, index: number) => {
    const c = section.content || {}
    const sectionBg = index % 2 === 0 ? 'var(--color-bg)' : 'var(--color-card)'
    const sectionIcon = c.icon

    switch (section.sectionType) {
      case 'about':
        const aboutStats = c.stats || []
        const bioVal = t(c.biography) || t(c.text)
        const biography = bioVal || (lang === 'ar' ? 'لا يوجد نص' : 'No about text provided.')
        const statCardBg = sectionBg === 'var(--color-bg)' ? 'var(--color-card)' : 'var(--color-bg)'
        return (
          <section id="about" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-4 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              
              {/* MOBILE VIEW (< md): text only. The profile image now lives in
                  the hero so it is not repeated here. */}
              <div className="cq-md:hidden mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                    {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                    <span>{t(c.title) || (lang === 'ar' ? 'نبذة عني' : 'About Me')}</span>
                  </h2>
                  <span
                    className="mt-2.5 block h-1 w-12 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col justify-start text-start">
                  {biography.split(/\n+/).map((para: string, i: number) => (
                    <p key={i} className="text-[var(--color-text)]/80 leading-[1.9] text-sm font-normal whitespace-pre-wrap text-pretty">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* DESKTOP VIEW (>= md): heading + text left, stat cards right */}
              <div className="hidden cq-md:block">
                <div className="mb-8 cq-md:mb-12">
                  <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                    {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                    <span>{t(c.title) || (lang === 'ar' ? 'نبذة عني' : 'About Me')}</span>
                  </h2>
                  <span
                    className="mt-2.5 block h-1 w-12 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                </div>
                {renderSectionDescription(c)}
                {aboutStats.length > 0 ? (
                  <div className="grid grid-cols-5 gap-8 items-start">
                    <div className="col-span-3 text-[var(--color-text-muted)] leading-[1.75] whitespace-pre-wrap text-lg break-words text-start">
                      {biography}
                    </div>
                    <div className="col-span-2 grid grid-cols-1 cq-lg:grid-cols-2 gap-4">
                      {aboutStats.map((stat: any, i: number) => (
                        <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms`, backgroundColor: statCardBg }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 rounded-[10px] p-6 text-center border border-[var(--color-border)] hover:-translate-y-1 transition-all duration-500 shadow-sm">
                          {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]') && (
                            <div className="flex justify-center mb-3">
                              {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]')}
                            </div>
                          )}
                          <div className="text-3xl font-bold text-[var(--color-primary)] mb-2">{stat.value}</div>
                          <div className="text-sm text-[var(--color-text-muted)] font-medium">{t(stat.label)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[var(--color-text-muted)] leading-[1.75] whitespace-pre-wrap text-lg break-words text-start">
                    {biography}
                  </div>
                )}
              </div>

              {aboutStats.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-8 cq-sm:mt-10 cq-md:hidden">
                  {aboutStats.map((stat: any, i: number) => (
                    <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms`, backgroundColor: statCardBg }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 rounded-[10px] p-6 text-center border border-[var(--color-border)] hover:-translate-y-1 transition-all duration-500 shadow-sm">
                      {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]') && (
                        <div className="flex justify-center mb-3">
                          {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]')}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-[var(--color-primary)] mb-2">{stat.value}</div>
                      <div className="text-sm text-[var(--color-text-muted)] font-medium">{t(stat.label)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      case 'skills':
        const skillGroups = c.groups || []
        const fallbackSkills = c.skills || []
        const skillsDisplayMode = c.displayMode || 'chips'
        let categories: { title: string; icon?: string | null; items: { name: string; percentage: number }[] }[] = []

        if (skillGroups.length > 0) {
          categories = skillGroups.map((g: any) => ({
            title: g.name || 'Skills',
            icon: g.icon || null,
            items: (g.skills || [])
              .filter((s: any) => s && s.name && s.name.trim() !== '')
              .map((s: any) => ({ name: s.name, percentage: s.percentage || 75 }))
          })).filter((cat: any) => cat.items.length > 0)
        } else if (fallbackSkills.length > 0) {
          const valid = fallbackSkills.filter((s: string) => s && typeof s === 'string' && s.trim() !== '')
          if (valid.length > 0) {
            categories = [
              { title: lang === 'ar' ? 'مهارات تقنية' : 'Technical Skills', icon: 'code', items: valid.slice(0, Math.ceil(valid.length/2)).map((s: string) => ({ name: s, percentage: 75 })) },
              { title: lang === 'ar' ? 'مهارات أخرى' : 'Other Skills', icon: 'pentool', items: valid.slice(Math.ceil(valid.length/2)).map((s: string) => ({ name: s, percentage: 75 })) }
            ].filter((cat: any) => cat.items.length > 0)
          }
        }

        // If user has not added any skills, do NOT render any default skills — omit section entirely
        if (categories.length === 0) {
          return null
        }

        return (
          <section id="skills" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.heading) || t(c.title) || (lang === 'ar' ? 'المهارات' : 'Skills & Expertise')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}
              <div className={`grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(categories.length)}`}>
                {categories.map((cat, i) => {
                  const groupIcon = cat.icon ? getIcon(cat.icon, 'w-4 h-4 cq-sm:w-5 cq-sm:h-5') : null
                  return (
                    <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group relative overflow-hidden rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] p-5 cq-sm:p-[30px] bg-[var(--color-card)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <span className="absolute top-0 inset-x-6 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))' }} />
                      <div className="flex items-center gap-2.5 cq-sm:gap-3 mb-5 cq-sm:mb-6">
                        {groupIcon ? (
                          <span
                            className="w-9 h-9 cq-sm:w-11 cq-sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'var(--color-on-primary, #ffffff)',
                            }}
                          >
                            {groupIcon}
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1 text-start">
                          <h3 className="text-base cq-sm:text-xl break-words font-bold tracking-tight text-[var(--color-text)] leading-tight">
                            {cat.title}
                          </h3>
                          <p className="text-[11px] cq-sm:text-xs font-semibold text-[var(--color-text-muted)] mt-1">
                            {cat.items.length} {cat.items.length === 1 ? (lang === 'ar' ? 'مهارة' : 'skill') : (lang === 'ar' ? 'مهارات' : 'skills')}
                          </p>
                        </div>
                      </div>

                    {skillsDisplayMode === 'bars' ? (
                      <div className="space-y-4">
                        {cat.items.map((skill: { name: string; percentage: number }, j: number) => {
                          const pct = Math.min(100, Math.max(0, skill.percentage || 75))
                          return (
                            <div key={j} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs cq-sm:text-sm font-semibold">
                                <span className="text-[var(--color-text)] truncate">{skill.name}</span>
                                <span className="text-[var(--color-text-muted)] font-mono shrink-0 ms-2">{pct}%</span>
                              </div>
                              <div
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={skill.name}
                                className="h-2 w-full rounded-full bg-[var(--color-border)]/40 overflow-hidden"
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : skillsDisplayMode === 'both' ? (
                      <div className="space-y-5">
                        <div className="space-y-3.5">
                          {cat.items.map((skill: { name: string; percentage: number }, j: number) => {
                            const pct = Math.min(100, Math.max(0, skill.percentage || 75))
                            return (
                              <div key={j} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs cq-sm:text-sm font-semibold">
                                  <span className="text-[var(--color-text)] truncate">{skill.name}</span>
                                  <span className="text-[var(--color-text-muted)] font-mono shrink-0 ms-2">{pct}%</span>
                                </div>
                                <div
                                  role="progressbar"
                                  aria-valuenow={pct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={skill.name}
                                  className="h-2 w-full rounded-full bg-[var(--color-border)]/40 overflow-hidden"
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${pct}%`,
                                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]/40">
                          {cat.items.map((skill: { name: string; percentage: number }, j: number) => (
                            <span
                              key={j}
                              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 cq-sm:gap-2.5">
                        {cat.items.map((skill: { name: string; percentage: number }, j: number) => (
                          <span
                            key={j}
                            className="inline-flex min-h-[32px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs cq-sm:text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:-translate-y-0.5 transition-all"
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
          </section>
        )
      case 'experience':
        const expItems = c.items || []
        const expDisplayMode = c.displayMode || 'timeline'
        const renderExpItem = (item: any) => {
          const dateLabel = formatExperienceRange(item.startDate, item.endDate, Boolean(item.isCurrent), lang)
          const duration = item.startDate ? calcExperienceDuration(item.startDate, item.endDate, Boolean(item.isCurrent), lang) : ''
          const bullets = (t(item.description) || '').split('\n').filter((l: string) => l.trim())
          const itemIcon = getIcon(item.icon, 'w-5 h-5 text-white')
          return (
            <div key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-3">
                {item.companyLogo ? (
                  <img src={portfolioImageUrl(sanitizeUrl(item.companyLogo), 96)} alt={t(item.companyName)} loading="lazy" decoding="async" width={40} height={40} className="w-10 h-10 rounded-lg object-contain p-0.5 bg-[var(--color-bg)] border border-[var(--color-border)]/50 shrink-0" />
                ) : itemIcon ? (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {itemIcon}
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg break-words font-bold text-[var(--color-text)]">{t(item.jobTitle) || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title')}</h3>
                    {item.employmentType && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        {item.employmentType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium break-words" style={{ color: 'var(--color-primary)' }}>
                    {t(item.companyName) || (lang === 'ar' ? 'اسم الشركة' : 'Company Name')}
                  </p>
                </div>
              </div>
              {(dateLabel || duration || t(item.location) || item.workMode) && (
                <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] font-medium mb-3 flex-wrap">
                  {(dateLabel || duration) && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 max-w-full font-medium" style={{ color: 'var(--color-primary)' }}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{dateLabel}{duration && ` · ${duration}`}</span>
                    </span>
                  )}
                  {t(item.location) && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 max-w-full">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t(item.location)}</span>
                    </span>
                  )}
                  {item.workMode && (
                    <span className="inline-flex items-center whitespace-nowrap shrink-0 text-xs px-2 py-0.5 rounded bg-[var(--color-border)]/30 text-[var(--color-text-muted)]">
                      {item.workMode}
                    </span>
                  )}
                </div>
              )}
              {bullets.length > 0 && (
                <ul className="space-y-2 text-[15px] leading-relaxed break-words text-[var(--color-text-muted)]">
                  {bullets.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                      <div className="flex-1 min-w-0 break-words">{b.trim()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        }
        return (
          <section id="experience" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.heading) || (lang === 'ar' ? 'الخبرات العملية' : 'Work Experience')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                {t(c.description) && (
                  <p className="text-[var(--color-text-muted)] leading-relaxed break-words mt-4 max-w-2xl text-base cq-sm:text-lg">{t(c.description)}</p>
                )}
              </div>
              {expItems.length > 0 ? (
                expDisplayMode === 'timeline' ? (
                  <div className="relative ps-8 cq-md:ps-12">
                    <div className="absolute start-3 cq-md:start-5 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-primary) 12%, var(--color-primary) 88%, transparent)' }} />
                    <div className="space-y-10">
                      {expItems.map((item: any, ei: number) => {
                        const dateLabel = formatExperienceRange(item.startDate, item.endDate, Boolean(item.isCurrent), lang)
                        const duration = item.startDate ? calcExperienceDuration(item.startDate, item.endDate, Boolean(item.isCurrent), lang) : ''
                        const bullets = (t(item.description) || '').split('\n').filter((l: string) => l.trim())
                        const itemIcon = getIcon(item.icon, 'w-5 h-5 text-white')
                        return (
                          <div key={item.id} style={{ transitionDelay: `${Math.min(ei * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 relative transition-all duration-500">
                            <div
                              className={`absolute -start-5 cq-md:-start-7 top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[var(--color-bg)] ring-2 ring-[var(--color-primary)]/20 ${
                                item.isCurrent ? 'motion-safe:animate-pulse' : ''
                              }`}
                              style={{ backgroundColor: item.isCurrent ? '#22c55e' : 'var(--color-primary)' }}
                            />
                            {(dateLabel || duration) && (
                              <div className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="break-words">{dateLabel}{duration && ` · ${duration}`}</span>
                              </div>
                            )}
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
                              <div className="flex items-start gap-4 mb-3">
                                {item.companyLogo ? (
                                  <img src={portfolioImageUrl(sanitizeUrl(item.companyLogo), 96)} alt={t(item.companyName)} loading="lazy" decoding="async" width={40} height={40} className="w-10 h-10 rounded-lg object-contain p-0.5 bg-[var(--color-bg)] border border-[var(--color-border)]/50 shrink-0" />
                                ) : itemIcon ? (
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                                    {itemIcon}
                                  </div>
                                ) : null}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg break-words font-bold text-[var(--color-text)]">{t(item.jobTitle) || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title')}</h3>
                                    {item.employmentType && (
                                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                        {item.employmentType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium break-words" style={{ color: 'var(--color-primary)' }}>
                                    {t(item.companyName) || (lang === 'ar' ? 'اسم الشركة' : 'Company Name')}
                                  </p>
                                </div>
                              </div>
                              {(dateLabel || duration || t(item.location) || item.workMode) && (
                                <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] font-medium mb-3 flex-wrap">
                                  {(dateLabel || duration) && (
                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 max-w-full font-medium" style={{ color: 'var(--color-primary)' }}>
                                      <Clock className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{dateLabel}{duration && ` · ${duration}`}</span>
                                    </span>
                                  )}
                                  {t(item.location) && (
                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 max-w-full">
                                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{t(item.location)}</span>
                                    </span>
                                  )}
                                  {item.workMode && (
                                    <span className="inline-flex items-center whitespace-nowrap shrink-0 text-xs px-2 py-0.5 rounded bg-[var(--color-border)]/30 text-[var(--color-text-muted)]">
                                      {item.workMode}
                                    </span>
                                  )}
                                </div>
                              )}
                              {bullets.length > 0 && (
                                <ul className="space-y-2 text-[15px] leading-relaxed break-words text-[var(--color-text-muted)]">
                                  {bullets.map((b: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                      <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                                      <div className="flex-1 min-w-0 break-words">{b.trim()}</div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : expDisplayMode === 'grid' ? (
                  <div className="grid grid-cols-1 cq-md:grid-cols-2 cq-lg:grid-cols-3 gap-6">
                    {expItems.map((item: any) => renderExpItem(item))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {expItems.map((item: any) => renderExpItem(item))}
                  </div>
                )
              ) : (
                <p className="text-[var(--color-text-muted)] text-center py-12 font-medium">
                  {lang === 'ar' ? 'لم تتم إضافة أي خبرات بعد' : 'No experience added yet.'}
                </p>
              )}
            </div>
          </section>
        )
      case 'education': {
        const educationItems = (Array.isArray(c.items) ? c.items : []).filter(
          (item: any) => t(item.title),
        )
        // Empty base Education sections are intentionally omitted (see
        // visibleSections above); keep the guard local as well so no caller
        // can render an empty shell or its "no education" placeholder.
        if (educationItems.length === 0) return null
        return (
          <section id="education" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || (lang === 'ar' ? 'التعليم' : 'Education')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}
              {educationItems.length > 0 ? (
                <div className={`mt-8 grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(educationItems.length)}`}>
                  {educationItems.map((item: any, index: number) => {
                    const image = sanitizeUrl(item.image)
                    const position = normalizeImagePosition(item.imagePosition)
                    return (
                      <article
                        key={item.id || index}
                        style={{ transitionDelay: `${Math.min(index * 70, 350)}ms` }}
                        className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 flex flex-col overflow-hidden rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        {image ? (
                          <button
                            type="button"
                            onClick={() => setEducationLightbox(image)}
                            aria-label={lang === 'ar' ? 'عرض الشهادة' : 'View certificate'}
                            className="block h-[150px] cq-sm:h-[190px] w-full shrink-0 overflow-hidden bg-[var(--color-bg)] cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                          >
                            <img
                              src={portfolioImageUrl(image, 700)}
                              alt={t(item.title)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              style={{ objectPosition: `${position.x}% ${position.y}%` }}
                            />
                          </button>
                        ) : null}
                        <div className="flex flex-1 flex-col p-4 cq-sm:p-6">
                          <div className="mb-3 flex items-start gap-3">
                            {getIcon(item.icon, 'h-5 w-5 text-white') ? (
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                              >
                                {getIcon(item.icon, 'h-5 w-5 text-white')}
                              </span>
                            ) : null}
                            <div className="min-w-0">
                              <h3 className="break-words text-base cq-sm:text-lg font-bold tracking-tight text-[var(--color-text)]">
                                {t(item.title)}
                              </h3>
                              {(t(item.institution) || t(item.subtitle)) && (
                                <p className="break-words text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                                  {t(item.institution) || t(item.subtitle)}
                                </p>
                              )}
                            </div>
                          </div>
                          {t(item.date) ? (
                            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="break-words">{t(item.date)}</span>
                            </p>
                          ) : null}
                          {t(item.description) ? (
                            <p className="whitespace-pre-wrap break-words text-[13px] cq-sm:text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                              {t(item.description)}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)] text-center py-12 font-medium">
                  {lang === 'ar' ? 'لم تتم إضافة أي تعليم بعد' : 'No education added yet.'}
                </p>
              )}
            </div>

            {educationLightbox ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={lang === 'ar' ? 'عرض الشهادة' : 'Certificate preview'}
                onClick={() => setEducationLightbox(null)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setEducationLightbox(null)}
                  aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                  className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={portfolioImageUrl(educationLightbox, 1400)}
                  alt={lang === 'ar' ? 'شهادة' : 'Certificate'}
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
                />
              </div>
            ) : null}
          </section>
        )
      }
      case 'services':
        const serviceItems = c.services || []
        return (
          <section id="services" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.heading) || t(c.title) || (lang === 'ar' ? 'الخدمات' : 'Services')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                {(t(c.description)) && (
                  <p className="text-[var(--color-text-muted)] leading-relaxed break-words text-base cq-sm:text-lg max-w-2xl mt-4">
                    {t(c.description)}
                  </p>
                )}
              </div>
              {serviceItems.length > 0 ? (
                <div className={`grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(serviceItems.length)}`}>
                  {serviceItems.map((service: any, i: number) => (
                    <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group relative overflow-hidden rounded-xl border border-[var(--color-border)] p-4 cq-sm:p-7 bg-[var(--color-card)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <span className="absolute top-0 inset-x-6 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))' }} />
                      {getIcon(service.icon, 'w-5 h-5 text-white') && (
                        <div className="w-10 h-10 cq-sm:w-12 cq-sm:h-12 rounded-xl flex items-center justify-center mb-4 cq-sm:mb-5 shadow-sm text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                          {getIcon(service.icon, 'w-5 h-5 text-white')}
                        </div>
                      )}
                      <h3 className="text-base cq-sm:text-xl break-words font-bold mb-2 cq-sm:mb-3 text-[var(--color-text)] tracking-tight">{t(service.title)}</h3>
                      {t(service.description) ? (
                        <p className="text-[var(--color-text-muted)] text-[13px] cq-sm:text-[15px] leading-relaxed break-words mb-4 cq-sm:mb-5 line-clamp-3">{t(service.description)}</p>
                      ) : null}
                      {service.features && service.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {service.features.slice(0, 4).map((feature: string, fi: number) => (
                            <span key={fi} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-1 text-[11px] cq-sm:text-xs font-semibold break-words" style={{ color: 'var(--color-primary)' }}>
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {feature}
                            </span>
                          ))}
                          {service.features.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 text-[11px] cq-sm:text-xs font-semibold text-[var(--color-text-muted)]">
                              +{service.features.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)] text-center font-medium">{lang === 'ar' ? 'سيتم إضافة الخدمات قريباً' : 'Services coming soon.'}</p>
              )}
            </div>
          </section>
        )
      case 'testimonials':
        const testimonialItems = c.items || []
        return (
          <section id="testimonials" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-12 text-center">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center justify-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || (lang === 'ar' ? 'آراء العملاء' : 'Testimonials')}</span>
                </h2>
                <span
                  className="mt-2.5 mx-auto block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                {(t(c.subtitle) || t(c.description)) && (
                  <p className="text-[var(--color-text-muted)] leading-relaxed break-words text-base cq-sm:text-lg max-w-2xl mx-auto mt-4">
                    {t(c.subtitle) || t(c.description)}
                  </p>
                )}
              </div>
              {testimonialItems.length > 0 ? (
                <TestimonialsSlider items={testimonialItems} lang={lang} />
              ) : (
                <p className="text-[var(--color-text-muted)] text-center font-medium">{lang === 'ar' ? 'سيتم إضافة آراء العملاء قريباً' : 'Client testimonials coming soon.'}</p>
              )}
            </div>
          </section>
        )
      case 'projects': {
        // Content pages (`showInProjects === false`) are reachable by direct
        // link only; only card rows render in the Projects section.
        const projects = (profile.projectPages || []).filter(
          (p: any) => p.showInProjects !== false
        )
        const displayMode = c.displayMode || 'grid'
        // Groups live on the section content; cards reference them by id from
        // `ProjectPage.content.groupId`. Legacy flat rows have neither and
        // render exactly as before.
        const groups = (Array.isArray(c.groups) ? c.groups : []).filter(
          (group: any) => group && typeof group.id === 'string' && group.id
        )
        const groupIds = new Set(groups.map((group: any) => group.id))
        const projectsByGroup = (groupId: string) =>
          projects.filter((project: any) => project?.content?.groupId === groupId)
        const ungroupedProjects = projects.filter((project: any) => {
          const groupId = project?.content?.groupId
          return !groupId || !groupIds.has(groupId)
        })
        const hasGroupedCards = groups.some((group: any) => projectsByGroup(group.id).length > 0)

        const projectLinkLabel = (project: any) => {
          if (projectCardVisual(project) === 'file-icon') {
            return projectFileAction(projectFileType(project), lang)
          }
          if (project.linkLabel) return project.linkLabel
          return lang === 'ar' ? 'عرض المشروع' : 'View Project'
        }

        const renderProjectLinkIcon = (project: any) =>
          projectCardVisual(project) === 'file-icon' ? (
            <ProjectFileIcon fileType={projectFileType(project)} className="h-4 w-4 shrink-0" />
          ) : (
            <ExternalLink className="h-4 w-4 shrink-0" />
          )

        const renderExtraLinkIcon = (iconType?: string) => {
          switch (iconType) {
            case 'pdf':
              return <FileText className="h-3.5 w-3.5 shrink-0" />
            case 'sheet':
              return <Table2 className="h-3.5 w-3.5 shrink-0" />
            case 'doc':
              return <FileText className="h-3.5 w-3.5 shrink-0" />
            case 'folder':
              return <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            case 'generic':
            default:
              return <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          }
        }

        const renderProjectLinks = (project: any) => {
          const linkType = project.linkType || (project.content as any)?.linkType || 'none'
          const linkedSlug = project.linkedPageSlug || (project.content as any)?.linkedPageSlug
          const isTempSlug = !linkedSlug || String(linkedSlug).startsWith('new-') || String(linkedSlug).startsWith('project-new-')
          const label = projectLinkLabel(project)

          // Extra link buttons from project.items
          const extraLinkItems = (Array.isArray(project.items) ? project.items : []).filter((item: any) => {
            const itemLabel = String(item.title || item.label || item.linkLabel || '').trim()
            const rawUrl = sanitizeUrl(item.externalUrl || item.url || '')
            return Boolean(itemLabel && rawUrl && /^https?:\/\//i.test(rawUrl))
          })

          return (
            <>
              {/* Main Button */}
              {linkType === 'page' && !isTempSlug && !isFree ? (
                <Link
                  href={`/u/${profile.username}/projects/${linkedSlug}`}
                  className="text-sm font-semibold flex items-center gap-1.5 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                  title={label}
                  aria-label={label}
                >
                  {renderProjectLinkIcon(project)}
                  <span className="truncate max-w-[180px]">{label}</span>
                </Link>
              ) : null}
              {linkType === 'external' && project.externalLink ? (
                <a
                  href={sanitizeUrl(project.externalLink)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold flex items-center gap-1.5 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                  title={label}
                  aria-label={label}
                >
                  {renderProjectLinkIcon(project)}
                  <span className="truncate max-w-[180px]">{label}</span>
                </a>
              ) : null}

              {/* Extra Buttons (Linked Content) in saved order */}
              {extraLinkItems.map((item: any, i: number) => {
                const itemLabel = String(item.title || item.label || item.linkLabel || '').trim()
                const rawUrl = sanitizeUrl(item.externalUrl || item.url || '')
                const iconType = item.iconType || (['generic', 'pdf', 'sheet', 'doc', 'folder'].includes(item.textContent) ? item.textContent : 'generic')
                return (
                  <a
                    key={item.id || i}
                    href={rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={itemLabel}
                    aria-label={itemLabel}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] bg-[color-mix(in_srgb,var(--color-bg)_70%,transparent)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] shadow-2xs"
                  >
                    {renderExtraLinkIcon(iconType)}
                    <span className="truncate max-w-[160px]">{itemLabel}</span>
                  </a>
                )
              })}
            </>
          )
        }

        const hasProjectLinks = (project: any) => {
          const linkType = project.linkType || (project.content as any)?.linkType || 'none'
          const linkedSlug = project.linkedPageSlug || (project.content as any)?.linkedPageSlug
          const isTempSlug = !linkedSlug || String(linkedSlug).startsWith('new-') || String(linkedSlug).startsWith('project-new-')
          const hasMainLink = (linkType === 'page' && !isTempSlug && !isFree) || (linkType === 'external' && Boolean(project.externalLink))
          if (hasMainLink) return true

          if (Array.isArray(project.items)) {
            return project.items.some((item: any) => {
              const itemLabel = String(item.title || item.label || item.linkLabel || '').trim()
              const rawUrl = sanitizeUrl(item.externalUrl || item.url || '')
              return Boolean(itemLabel && rawUrl && /^https?:\/\//i.test(rawUrl))
            })
          }
          return false
        }

        const renderListCard = (project: any) => (
          <div key={project.id} className="group flex flex-col cq-sm:flex-row rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <ProjectCardMedia
              visual={projectCardVisual(project)}
              fileType={projectFileType(project)}
              imageUrl={project.coverImage}
              imageFit={projectImageFit(project)}
              title={project.title}
              variant="list"
            />
            <ProjectCardBody
              title={project.title}
              description={project.description}
              tags={project.tags}
              links={hasProjectLinks(project) ? renderProjectLinks(project) : null}
              variant="list"
            />
          </div>
        )

        const renderGridCard = (project: any, index: number) => (
          <div
            key={project.id}
            style={{ transitionDelay: `${Math.min(index * 70, 350)}ms` }}
            className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
          >
            <ProjectCardMedia
              visual={projectCardVisual(project)}
              fileType={projectFileType(project)}
              imageUrl={project.coverImage}
              imageFit={projectImageFit(project)}
              title={project.title}
              variant="grid"
            />
            <ProjectCardBody
              title={project.title}
              description={project.description}
              tags={project.tags}
              links={hasProjectLinks(project) ? renderProjectLinks(project) : null}
              variant="grid"
            />
          </div>
        )

        return (
          <section id="projects" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || (lang === 'ar' ? 'المشاريع' : 'Featured Projects')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}

              {groups.length > 0 ? (
                <div className="space-y-10">
                  {groups.map((group: any) => {
                    const groupCards = projectsByGroup(group.id)
                    if (groupCards.length === 0) return null
                    const titleText = t(group.title)?.trim()
                    return (
                      <div key={group.id}>
                        {titleText ? (
                          <div className="mb-5">
                            <h3
                              className="text-xl break-words font-bold tracking-tight"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {titleText}
                            </h3>
                            <span
                              className="mt-1.5 block h-0.5 w-10 rounded-full"
                              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)' }}
                              aria-hidden="true"
                            />
                          </div>
                        ) : null}
                        <div className={displayMode === 'list' ? "flex flex-col gap-6" : `grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(groupCards.length)}`}>
                          {groupCards.map((project: any, index: number) =>
                            displayMode === 'list' ? renderListCard(project) : renderGridCard(project, index)
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {ungroupedProjects.length > 0 ? (
                    <div>
                      {hasGroupedCards ? (
                        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          {lang === 'ar' ? 'غير مصنّفة' : 'Ungrouped'}
                        </h3>
                      ) : null}
                      <div className={displayMode === 'list' ? "flex flex-col gap-6" : `grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(ungroupedProjects.length)}`}>
                        {ungroupedProjects.map((project: any, index: number) =>
                          displayMode === 'list' ? renderListCard(project) : renderGridCard(project, index)
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : displayMode === 'list' ? (
                <div className="flex flex-col gap-6">
                  {projects.map(renderListCard)}
                  {projects.length === 0 && (
                    <p className="text-[var(--color-text-muted)] text-center font-medium">{lang === 'ar' ? 'لا توجد مشاريع مضافة' : 'No projects added yet.'}</p>
                  )}
                </div>
              ) : (
                <div className={`grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(projects.length)}`}>
                  {projects.map((project: any, index: number) => renderGridCard(project, index))}
                  {projects.length === 0 && (
                    <p className="text-[var(--color-text-muted)] col-span-full font-medium">{lang === 'ar' ? 'لا توجد مشاريع مضافة' : 'No projects added yet.'}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )
      }
      case 'clients': {
        const clientItems = Array.isArray(c.items) ? c.items : []
        const validClients = clientItems.filter((item: any) => Boolean(item?.logoUrl))
        if (validClients.length === 0) return null

        const titleText = (c.title === undefined || c.title === null)
          ? (lang === 'ar' ? 'العملاء' : 'Clients')
          : (t(c.title)?.trim() || '')
        const descText = t(c.description)?.trim() || ''
        const showUnderline = c.showTitleUnderline !== false
        const logoShape = c.logoShape || 'circle'
        const logoSize = c.logoSize || 'md'
        const isGrayscale = Boolean(c.grayscale)
        const isCircle = logoShape === 'circle'

        const shapeClass =
          logoShape === 'rounded'
            ? 'rounded-2xl'
            : logoShape === 'square'
              ? 'rounded-md'
              : 'rounded-full'

        const sizeClass =
          logoSize === 'sm'
            ? 'w-[60px] h-[60px] cq-md:w-[72px] cq-md:h-[72px]'
            : logoSize === 'lg'
              ? 'w-[112px] h-[112px] cq-md:w-[144px] cq-md:h-[144px]'
              : 'w-[88px] h-[88px] cq-md:w-[112px] cq-md:h-[112px]'

        const paddingClass = isCircle
          ? logoSize === 'sm'
            ? 'p-2 cq-md:p-2.5'
            : logoSize === 'lg'
              ? 'p-4 cq-md:p-5'
              : 'p-3 cq-md:p-4'
          : logoSize === 'sm'
            ? 'p-1.5 cq-md:p-2'
            : logoSize === 'lg'
              ? 'p-2.5 cq-md:p-3'
              : 'p-2 cq-md:p-2.5'

        const cardBg = sectionBg === 'var(--color-bg)' ? 'var(--color-card)' : 'var(--color-bg)'

        return (
          <section id="clients" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              {(titleText || descText) && (
                <div className="mb-8 cq-md:mb-12">
                  {titleText && (
                    <div>
                      <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                        {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                        <span>{titleText}</span>
                      </h2>
                      {showUnderline && (
                        <span
                          className="mt-2.5 block h-1 w-12 rounded-full"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )}
                  {descText && (
                    <p className={`text-[var(--color-text-muted)] leading-relaxed break-words text-base cq-sm:text-lg max-w-2xl ${titleText ? 'mt-4' : ''}`}>
                      {descText}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 cq-md:gap-6">
                {validClients.map((client: any, i: number) => (
                  <ClientLogoItem
                    key={client.id || i}
                    client={client}
                    shapeClass={shapeClass}
                    sizeClass={sizeClass}
                    paddingClass={paddingClass}
                    cardBg={cardBg}
                    isGrayscale={isGrayscale}
                    lang={lang}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      }
      case 'gallery': {
        const galleryItems = Array.isArray(c.items) ? c.items : []
        if (galleryItems.length === 0) return null
        return (
          <section id="gallery" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || (lang === 'ar' ? 'معرض الأعمال' : 'Gallery')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}
              <div className="grid grid-cols-2 cq-md:grid-cols-3 gap-4">
                {galleryItems.map((item: any, i: number) => {
                  const src = sanitizeUrl(item.imageUrl || item.url || '')
                  if (!src) return null
                  return (
                    <figure key={item.id || i} className="group rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
                      <img src={portfolioImageUrl(src, 600)} alt={t(item.caption)} loading="lazy" decoding="async" width={600} height={600} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                      {t(item.caption) ? (
                        <figcaption className="px-4 py-3 text-sm text-[var(--color-text-muted)] break-words">{t(item.caption)}</figcaption>
                      ) : null}
                    </figure>
                  )
                })}
              </div>
            </div>
          </section>
        )
      }
      case 'files': {
        const fileItems = Array.isArray(c.items) ? c.items.filter((f: any) => f && (f.url || f.externalUrl)) : []
        if (fileItems.length === 0) return null
        return (
          <section id="files" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || (lang === 'ar' ? 'ملفات للتحميل' : 'Downloads')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}
              <div className="flex flex-col gap-3 max-w-[800px]">
                {fileItems.map((file: any, i: number) => {
                  const href = sanitizeUrl(file.url || file.externalUrl)
                  return (
                    <a
                      key={file.id || i}
                      href={href}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-sm font-medium text-[var(--color-text)] break-words">
                        {t(file.label) || t(file.title) || href}
                      </span>
                      <span className="shrink-0 rounded-full bg-[var(--color-primary)]/10 px-4 py-1.5 text-xs font-bold text-[var(--color-primary)]">
                        {lang === 'ar' ? 'تحميل' : 'Download'}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          </section>
        )
      }
      case 'contact': {
        // Own anchor (footer keeps #contact for back-compat); nav maps
        // contact-type sections here, footer stays untouched.
        const contactLinks = Array.isArray(c.links) ? c.links : []
        if (contactLinks.length === 0 && !t(c.title) && !t(c.headline) && !t(c.description)) return null
        return (
          <section id="contact-info" key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-8 cq-md:mb-12">
                <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                  <span>{t(c.title) || t(c.headline) || (lang === 'ar' ? 'تواصل معي' : 'Contact')}</span>
                </h2>
                <span
                  className="mt-2.5 block h-1 w-12 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
              </div>
              {renderSectionDescription(c)}
              <div className="flex flex-col gap-3 max-w-[800px]">
                {contactLinks.map((link: any, i: number) => {
                  const platform = link.platform || link.type || link.label || 'globe'
                  const rawUrl = link.url || link.value || ''
                  if (!rawUrl) return null
                  const href = rawUrl.startsWith('http') || rawUrl.startsWith('mailto:') || rawUrl.startsWith('tel:')
                    ? rawUrl
                    : rawUrl.includes('@')
                      ? `mailto:${rawUrl}`
                      : `https://${rawUrl}`
                  return (
                    <a
                      key={link.id || i}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="h-10 w-10 shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
                        {getSocialIcon(platform) || getContactIcon(platform)}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text)] break-words">
                        {t(link.label) || link.value || href}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          </section>
        )
      }
      case 'custom': {
        const paragraphs = Array.isArray(c.paragraphs) ? c.paragraphs.filter((p: any) => typeof p === 'string' && p.trim() !== '') : []
        const customCards = (Array.isArray(c.cards) ? c.cards : []).filter((card: any) => {
          if (!card || typeof card !== 'object') return false
          return Boolean(t(card.title) || t(card.description) || sanitizeUrl(card.image) || card.icon || sanitizeUrl(card.linkUrl))
        })
        if (!t(c.title) && paragraphs.length === 0 && !t(c.description) && customCards.length === 0) return null
        // New custom sections store `showTitleUnderline: true`; legacy rows do
        // not have the key and must keep rendering without an underline.
        const showUnderline = c.showTitleUnderline === true
        return (
          <section id={`custom-${section.id}`} key={section.id} className="py-12 cq-md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 cq-sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              {t(c.title) ? (
                <div className="mb-8">
                  <h2 className="text-2xl cq-md:text-3xl break-words font-bold tracking-tight text-[var(--color-text)] flex items-center gap-3">
                    {getIcon(sectionIcon, 'text-[var(--color-primary)]')}
                    {t(c.title)}
                  </h2>
                  {showUnderline ? (
                    <span
                      className="mt-3 block h-1 w-16 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              ) : null}
              {renderSectionDescription(c)}

              {customCards.length > 0 ? (
                <div className={`mt-6 grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(customCards.length)}`}>
                  {customCards.map((card: any, index: number) => {
                    const image = sanitizeUrl(card.image)
                    const href = sanitizeUrl(card.linkUrl)
                    const position = normalizeImagePosition(card.imagePosition)
                    const linkLabel = t(card.linkLabel) || (lang === 'ar' ? 'فتح الرابط' : 'Open Link')
                    return (
                      <article
                        key={card.id || index}
                        style={{ transitionDelay: `${Math.min(index * 70, 350)}ms` }}
                        className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 flex flex-col overflow-hidden rounded-[var(--border-radius-card)] border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        {image ? (
                          <div className="h-[150px] cq-sm:h-[190px] w-full shrink-0 overflow-hidden bg-[var(--color-bg)]">
                            <img
                              src={portfolioImageUrl(image, 700)}
                              alt={t(card.title)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                              style={{ objectPosition: `${position.x}% ${position.y}%` }}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-1 flex-col p-4 cq-sm:p-6">
                          <div className="mb-3 flex items-start gap-3">
                            {getIcon(card.icon, 'h-5 w-5 text-white') ? (
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                              >
                                {getIcon(card.icon, 'h-5 w-5 text-white')}
                              </span>
                            ) : null}
                            {t(card.title) ? (
                              <h3 className="min-w-0 break-words text-base cq-sm:text-lg font-bold tracking-tight text-[var(--color-text)]">
                                {t(card.title)}
                              </h3>
                            ) : null}
                          </div>
                          {t(card.description) ? (
                            <p className="whitespace-pre-wrap break-words text-[13px] cq-sm:text-[15px] leading-relaxed text-[var(--color-text-muted)]">
                              {t(card.description)}
                            </p>
                          ) : null}
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
                            >
                              <ProjectFileIcon fileType={card.linkIcon || 'generic'} className="h-4 w-4 shrink-0" />
                              <span className="break-words">{linkLabel}</span>
                            </a>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {paragraphs.length > 0 ? (
                <div className="max-w-[800px] space-y-4 text-[var(--color-text-muted)] leading-[1.75] text-lg break-words">
                  {paragraphs.map((p: string, i: number) => (
                    <p key={i} className="whitespace-pre-wrap">{p}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        )
      }
      case 'footer': {
        return (
          <PortfolioFooter
            key={section.id}
            profile={profile}
            sections={visibleSections}
            footerContent={c}
            lang={lang}
            t={t}
            displayName={displayName}
            role={title}
            bio={bio}
            localizedLocation={t(localized.location)}
            contactLinks={contactLinks}
            whatsappNumber={whatsappNumber}
            showScrollToTop={showScrollToTop}
            onScrollToTop={scrollToTop}
            id="contact"
          />
        )
      }
      default:
        return null
    }
  }

  const initial = displayName.substring(0, 2).toUpperCase()

  return (
    <>
      {/* Single hoisted stylesheet request for the owner's font (was
          requested twice: body link + client head injection). */}
      <link rel="stylesheet" href={fontLink} precedence="portfolio-font" />
      <style dangerouslySetInnerHTML={{__html: `
        html { scroll-behavior: smooth; }
        @media (min-width: 768px) {
          html { scroll-padding-top: 5rem; }
        }
        @keyframes heroMesh1 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(45px, -35px, 0) scale(1.08); }
          100% { transform: translate3d(-35px, 30px, 0) scale(0.94); }
        }
        @keyframes heroMesh2 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-50px, 40px, 0) scale(1.1); }
          100% { transform: translate3d(40px, -30px, 0) scale(0.92); }
        }
        @keyframes heroMesh3 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(35px, 45px, 0) scale(0.95); }
          100% { transform: translate3d(-30px, -40px, 0) scale(1.07); }
        }
        .hero-blob-1 { animation: heroMesh1 22s ease-in-out infinite alternate; will-change: transform; }
        .hero-blob-2 { animation: heroMesh2 28s ease-in-out infinite alternate; will-change: transform; }
        .hero-blob-3 { animation: heroMesh3 20s ease-in-out infinite alternate; will-change: transform; }
        @container (min-width: 48rem) {
          #hero {
            clip-path: polygon(0 0, 100% 0, 100% calc(100% - 56px), 0 100%);
          }
          [dir="rtl"] #hero {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 56px));
          }
        }
        @media (min-width: 768px) {
          #hero {
            clip-path: polygon(0 0, 100% 0, 100% calc(100% - 56px), 0 100%);
          }
          [dir="rtl"] #hero {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 56px));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .fade-up { opacity: 1 !important; transform: none !important; transition: none !important; }
          .hero-blob-1, .hero-blob-2, .hero-blob-3 { animation: none !important; }
          nav { transition: none !important; }
        }
      `}} />
      
      <div
        ref={rootRef}
        className={`${preview ? 'min-h-full' : 'min-h-screen'} w-full transition-colors duration-300`}
        style={style}
      >
        <div className={`w-full ${preview ? 'min-h-full' : 'min-h-screen'} bg-[var(--color-bg)] text-[var(--color-text)] relative`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Navigation Bar — desktop only (md+); mobile uses the bottom
              nav. Transparent at top of hero, smoothly transitions to solid/blurred past 24px. */}
          <nav
            className={`hidden cq-md:block fixed top-0 left-0 right-0 z-40 transition-all duration-300 motion-reduce:transition-none ${
              isNavbarTransparent
                ? 'py-4 cq-sm:py-5 shadow-none'
                : isScrolledPast24
                  ? 'py-2.5 cq-sm:py-3 shadow-md'
                  : 'py-3 cq-sm:py-5 shadow-sm'
            }`}
            style={{
              backgroundColor: isNavbarTransparent
                ? 'transparent'
                : 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
              backdropFilter: isNavbarTransparent ? 'none' : 'blur(10px)',
              WebkitBackdropFilter: isNavbarTransparent ? 'none' : 'blur(10px)',
              borderBottom: isNavbarTransparent
                ? '1px solid transparent'
                : '1px solid var(--color-border)',
            }}
          >
            <div className="max-w-[1200px] mx-auto px-4 cq-sm:px-12">
              {/* DESKTOP (md+): 2-sided split — Brand on start, [Contact Me + Hamburger] on end */}
              <div className="flex w-full items-center justify-between gap-4">
                <a
                  href="#hero"
                  className={`truncate max-w-[260px] text-lg font-bold tracking-tight transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    isNavbarTransparent
                      ? 'hover:opacity-85'
                      : !isDark
                        ? 'text-[var(--color-text)] hover:text-[var(--color-primary)]'
                        : 'text-[var(--color-text)] hover:opacity-80'
                  }`}
                  style={{
                    color: isNavbarTransparent ? 'var(--color-on-primary)' : undefined,
                    textShadow: isNavbarTransparent ? '0 1px 4px color-mix(in srgb, var(--color-primary) 50%, black)' : undefined,
                  }}
                >
                  {displayName}
                </a>

                {/* Other side: flex group with Contact Me button + Hamburger menu button */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {showToggle && (
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-label={
                        isDark
                          ? (lang === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode')
                          : (lang === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode')
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      style={{
                        borderColor: isNavbarTransparent
                          ? 'color-mix(in srgb, var(--color-on-primary) 30%, transparent)'
                          : 'var(--color-border)',
                        backgroundColor: isNavbarTransparent
                          ? 'color-mix(in srgb, var(--color-on-primary) 18%, transparent)'
                          : 'color-mix(in srgb, var(--color-bg) 80%, transparent)',
                        color: isNavbarTransparent ? 'var(--color-on-primary)' : 'var(--color-text)',
                      }}
                    >
                      {isDark ? (
                        <Sun className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                  <a
                    href="#contact"
                    className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm hover:-translate-y-0.5 active:scale-[0.97]"
                    style={{
                      backgroundColor: isNavbarTransparent
                        ? 'var(--color-on-primary)'
                        : 'var(--color-primary)',
                      color: isNavbarTransparent
                        ? 'var(--color-primary)'
                        : 'var(--color-on-primary)',
                    }}
                  >
                    {lang === 'ar' ? 'تواصل معي' : 'Contact Me'}
                  </a>

                  {navLinks.length > 0 && (
                    <div className="relative" ref={navMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsNavMenuOpen((prev) => !prev)}
                        aria-expanded={isNavMenuOpen}
                        aria-label={
                          isNavMenuOpen
                            ? (lang === 'ar' ? 'إغلاق القائمة' : 'Close menu')
                            : (lang === 'ar' ? 'فتح القائمة' : 'Open menu')
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] shadow-sm"
                        style={{
                          backgroundColor: isNavbarTransparent
                            ? 'color-mix(in srgb, var(--color-on-primary) 18%, transparent)'
                            : !isDark
                              ? 'color-mix(in srgb, var(--color-bg) 80%, transparent)'
                              : 'color-mix(in srgb, var(--color-text) 10%, transparent)',
                          borderColor: isNavbarTransparent
                            ? 'color-mix(in srgb, var(--color-on-primary) 30%, transparent)'
                            : 'var(--color-border)',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          color: isNavbarTransparent
                            ? 'var(--color-on-primary)'
                            : 'var(--color-text)',
                          backdropFilter: isNavbarTransparent ? 'blur(4px)' : undefined,
                        }}
                      >
                        {isNavMenuOpen ? (
                          <X className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Menu className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>

                      {isNavMenuOpen && (
                        <div
                          className={`absolute end-0 top-full mt-2.5 min-w-[200px] max-w-[calc(100vw-2rem)] rounded-2xl border p-2 shadow-xl backdrop-blur-md z-50 ${
                            !isDark
                              ? 'border-[var(--color-border)] text-[var(--color-text)] shadow-black/10'
                              : 'border-white/10 text-white shadow-black/40'
                          }`}
                          style={{
                            backgroundColor:
                              !isDark
                                ? 'color-mix(in srgb, var(--color-bg) 95%, transparent)'
                                : 'color-mix(in srgb, var(--color-bg) 92%, black)',
                          }}
                        >
                          <ul className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                              <li key={link.id}>
                                <a
                                  href={`#${link.targetId}`}
                                  onClick={() => setIsNavMenuOpen(false)}
                                  aria-current={activeId === link.targetId ? 'location' : undefined}
                                  className={`flex items-center px-3.5 py-2 text-sm font-medium transition-colors rounded-xl ${
                                    activeId === link.targetId
                                      ? (!isDark
                                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                                          : 'bg-white/15 text-white font-semibold')
                                      : (!isDark
                                          ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-primary)]'
                                          : 'text-white/85 hover:bg-white/10 hover:text-white')
                                  }`}
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-20 cq-md:bottom-6 left-6 z-50 flex flex-col items-start gap-3">
            {showWhatsappButton && (
              <a
                href={waDigits ? `https://wa.me/${waDigits}` : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!waDigits}
                onClick={(e) => {
                  if (!waDigits) {
                    e.preventDefault()
                    return
                  }
                  trackPortfolioEvent(profile.username, 'whatsapp_click')
                }}
                className={`h-11 w-11 flex items-center justify-center rounded-full text-white shadow-lg transition-transform ${waDigits ? 'hover:scale-110' : 'cursor-not-allowed opacity-60'}`}
                style={{ backgroundColor: 'var(--color-primary)' }}
                title={waDigits ? 'Chat on WhatsApp' : (lang === 'ar' ? 'أضف رقم واتساب لتفعيل الزر' : 'Add a WhatsApp number to enable this button')}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
            {showScrollToTopButton && (
              <button
                onClick={scrollToTop}
                className="h-11 w-11 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-110 transition-all"
                title="Back to top"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>

          <main>
            {/* HERO SECTION */}
            {visibleSections.find((s:any) => s.sectionType === 'hero') && (() => {
              const heroSection = visibleSections.find((s:any) => s.sectionType === 'hero')
              const heroContent = heroSection?.content || {}
              const bgImage = sanitizeUrl(heroContent.backgroundImage)
              const overlayOpacity = heroContent.overlayOpacity !== undefined ? Number(heroContent.overlayOpacity) : 0.5

              const bgPosition = normalizeImagePosition(heroContent.backgroundPosition)

              // Reuse the portfolio's existing social links and icons. Footer
              // links win (that is what the footer renders); profile-level
              // contact links are the fallback for legacy profiles.
              const footerLinks = visibleSections.find((s: any) => s.sectionType === 'footer')?.content?.links
              const socialSource = Array.isArray(footerLinks) && footerLinks.length > 0 ? footerLinks : (contactLinks || [])
              const socialHref = (link: any) => {
                const raw = String(link?.url || link?.value || '').trim()
                if (!raw) return ''
                if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
                const platform = String(link?.platform || link?.label || '').toLowerCase()
                if (platform.includes('whatsapp')) {
                  const digits = normalizeWhatsappNumber(raw)
                  return digits ? `https://wa.me/${digits}` : ''
                }
                if (platform.includes('phone')) {
                  const phone = raw.replace(/[^\d+]/g, '')
                  return phone ? `tel:${phone}` : ''
                }
                if (raw.includes('@') && !raw.includes('/')) return `mailto:${raw}`
                return `https://${raw}`
              }
              const heroSocialLinks = (socialSource as any[])
                .map((link) => ({ link, href: socialHref(link) }))
                .filter((item) => item.href)
              const heroSocialIcon = (platform: string) => {
                const p = platform.toLowerCase()
                if (p.includes('email') || p.includes('mail') || p.includes('phone')) {
                  return getContactIcon(p)
                }
                return getSocialIcon(p)
              }

              return (
                <section 
                  id="hero" 
                  className="relative flex items-center justify-center min-h-[50vh] cq-md:min-h-[50vh] cq-md:min-h-[50svh] overflow-hidden pt-12 pb-8 cq-md:pt-20 cq-md:pb-24 cq-md:-mb-14 z-10"
                  style={{ 
                    backgroundImage: bgImage
                      ? `url("${bgImage}")`
                      : 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 85%, var(--color-on-primary)) 0%, color-mix(in srgb, var(--color-primary) 70%, var(--color-bg)) 100%)',
                    backgroundSize: bgImage ? 'cover' : 'auto',
                    backgroundPosition: bgImage ? `${bgPosition.x}% ${bgPosition.y}%` : 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: preview ? (previewHeight ? `${Math.round(previewHeight * 0.5)}px` : '50%') : '50svh',
                  }}
                >
                  {bgImage && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-bg) 70%, black)',
                        opacity: overlayOpacity,
                      }}
                    />
                  )}

                  {/* LIVING HERO BACKGROUND */}
                  {/* Layer 2: 3 Animated Mesh Blobs */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
                    style={{ opacity: bgImage ? 0.25 : 0.45 }}
                    aria-hidden="true"
                  >
                    <div
                      className="hero-blob hero-blob-1 absolute -top-[15%] -start-[10%] w-[380px] h-[380px] cq-md:w-[620px] cq-md:h-[620px] rounded-full filter blur-[70px] cq-md:blur-[95px] will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary-light, var(--color-primary)) 75%, var(--color-on-primary)) 0%, transparent 70%)',
                      }}
                    />
                    <div
                      className="hero-blob hero-blob-2 absolute -bottom-[20%] -end-[10%] w-[420px] h-[420px] cq-md:w-[680px] cq-md:h-[680px] rounded-full filter blur-[80px] cq-md:blur-[105px] will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 65%, var(--color-bg)) 0%, transparent 70%)',
                      }}
                    />
                    <div
                      className="hero-blob hero-blob-3 absolute top-[30%] start-[25%] w-[320px] h-[320px] cq-md:w-[520px] cq-md:h-[520px] rounded-full filter blur-[65px] cq-md:blur-[85px] will-change-transform"
                      style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 50%, var(--color-on-primary)) 0%, transparent 70%)',
                      }}
                    />
                  </div>

                  {/* Layer 3: Subtle tactile dot-grid texture */}
                  <div
                    className="absolute inset-0 pointer-events-none select-none z-0"
                    style={{
                      backgroundImage: 'radial-gradient(color-mix(in srgb, var(--color-on-primary) 40%, transparent) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                      opacity: 0.06,
                    }}
                    aria-hidden="true"
                  />

                  <div
                    className="w-full max-w-[1200px] mx-auto px-5 cq-sm:px-12 z-10 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 relative"
                  >
                    {/* MOBILE HERO (< md): Centered stacked column (photo -> name -> title -> CTAs -> socials) */}
                    <div
                      dir="ltr"
                      className="cq-md:hidden w-full flex flex-col items-center text-center"
                    >
                      {profile.avatarUrl ? (
                        <div className="w-[150px] cq-sm:w-[160px] aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-2xl mb-5 hover:scale-105 transition-transform duration-500 bg-white shrink-0">
                          <img
                            src={portfolioImageUrl(sanitizeUrl(profile.avatarUrl), 400)}
                            alt={displayName}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
                          />
                        </div>
                      ) : (
                        <div className="w-[150px] cq-sm:w-[160px] aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-2xl mb-5 hover:scale-105 transition-transform duration-500 bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-4xl cq-lg:text-5xl font-black select-none shrink-0">
                          {initial}
                        </div>
                      )}
                      <div
                        className="flex w-full flex-col items-center"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <h1 className="w-full text-[28px] cq-sm:text-3xl font-bold text-white mb-2 cq-sm:mb-2.5 text-center leading-snug whitespace-pre-line break-words" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
                          {displayName}
                        </h1>
                        {(title || t(heroContent.subtitle)) ? (
                          <p className="text-[15px] cq-sm:text-base text-white/90 max-w-xl leading-relaxed mb-6 font-normal text-center break-words">
                            {title || t(heroContent.subtitle)}
                          </p>
                        ) : null}
                        <div className="flex w-full flex-col items-stretch gap-3 cq-sm:max-w-[420px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <a 
                            href="#projects" 
                            className="w-full px-5 py-2.5 cq-sm:px-6 cq-sm:py-3 rounded-xl text-white font-bold text-sm shadow-medium hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
  style={{
    background: 'var(--color-gradient)',
  }}
                          >
                            <ArrowRight className="h-3.5 w-3.5 cq-sm:h-4 cq-sm:w-4 rtl:rotate-180" />
                            <span>{lang === 'ar' ? 'شاهد أعمالي' : 'View My Work'}</span>
                          </a>
                          <a 
                            href="#contact" 
                            className="w-full px-5 py-2.5 cq-sm:px-6 cq-sm:py-3 rounded-xl border border-white/40 bg-white/10 text-white font-bold text-sm hover:bg-white/20 hover:-translate-y-0.5 transition-all cursor-pointer min-h-[48px] inline-flex items-center justify-center"
                          >
                            <span>{lang === 'ar' ? 'تواصل معي' : 'Contact Me'}</span>
                          </a>
                        </div>
                        {heroSocialLinks.length > 0 && (
                          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            {heroSocialLinks.map(({ link, href }: any, idx: number) => {
                              const platform = link.platform || link.label || 'globe'
                              const label = t(link.label) || link.platform || (lang === 'ar' ? 'رابط' : 'Link')
                              return (
                                <a
                                  key={idx}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={label}
                                  title={label}
                                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                  {heroSocialIcon(platform)}
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DESKTOP HERO (>= md): Centered vertical stack */}
                    <div
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      className="hidden cq-md:flex w-full max-w-3xl mx-auto flex-col items-center text-center my-auto"
                    >
                      {/* 1. Circular photo ~180-200px (theme background ring + soft shadow) */}
                      {profile.avatarUrl ? (
                        <div
                          className="w-[180px] h-[180px] cq-lg:w-[200px] cq-lg:h-[200px] rounded-full overflow-hidden shadow-2xl mb-6 shrink-0 ring-4 ring-[var(--color-bg)] hover:scale-105 transition-transform duration-500"
                          style={{
                            backgroundColor: 'var(--color-bg)',
                          }}
                        >
                          <img
                            src={portfolioImageUrl(sanitizeUrl(profile.avatarUrl), 800)}
                            alt={displayName}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            className="w-full h-full object-cover rounded-full"
                            style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }}
                          />
                        </div>
                      ) : null}

                      {/* 2. Name (h1, large, bold, centered) */}
                      <h1
                        className="w-full text-4xl cq-lg:text-5xl font-bold mb-3 cq-lg:mb-4 text-center leading-snug whitespace-pre-line break-words text-[var(--color-on-primary)]"
                        style={{
                          textShadow: '0 2px 10px color-mix(in srgb, var(--color-primary) 50%, black)',
                        }}
                      >
                        {displayName}
                      </h1>

                      {/* 3. Job title / Subtitle below, lighter weight, centered */}
                      {(title || t(heroContent.subtitle)) ? (
                        <p
                          className="text-base cq-lg:text-xl font-normal leading-relaxed mb-4 cq-lg:mb-6 max-w-xl text-center break-words"
                          style={{
                            color: 'color-mix(in srgb, var(--color-on-primary) 92%, transparent)',
                          }}
                        >
                          {title || t(heroContent.subtitle)}
                        </p>
                      ) : null}

                      {/* Optional description */}
                      {t(heroContent.description) && (
                        <p
                          className="text-xs cq-lg:text-sm leading-relaxed mb-6 max-w-xl text-center break-words"
                          style={{
                            color: 'color-mix(in srgb, var(--color-on-primary) 80%, transparent)',
                          }}
                        >
                          {t(heroContent.description)}
                        </p>
                      )}

                      {/* 4. Buttons row: primary solid + secondary outline/glass, centered */}
                      <div className={`flex flex-wrap items-center justify-center gap-3.5 cq-lg:gap-4 ${heroSocialLinks.length > 0 ? 'mb-6' : ''}`}>
                        <a 
                          href="#projects" 
                          className="px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                          style={{
                            backgroundColor: 'var(--color-on-primary)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                          <span>{lang === 'ar' ? 'شاهد أعمالي' : 'View My Work'}</span>
                        </a>
                        <a 
                          href="#contact" 
                          className="px-6 py-2.5 rounded-xl font-bold text-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer min-h-[44px] inline-flex items-center justify-center backdrop-blur-xs"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-on-primary) 12%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--color-on-primary) 35%, transparent)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: 'var(--color-on-primary)',
                          }}
                        >
                          <span>{lang === 'ar' ? 'تواصل معي' : 'Contact Me'}</span>
                        </a>
                      </div>

                      {/* 5. Social icons row below buttons */}
                      {heroSocialLinks.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {heroSocialLinks.map(({ link, href }: any, idx: number) => {
                            const platform = link.platform || link.label || 'globe'
                            const label = t(link.label) || link.platform || (lang === 'ar' ? 'رابط' : 'Link')
                            return (
                              <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                title={label}
                                className="flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-on-primary)]"
                                style={{
                                  backgroundColor: 'var(--color-on-primary)',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                {heroSocialIcon(platform)}
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )
            })()}

            {/* OTHER SECTIONS */}
            {renderedSections.map((s: any, renderIndex: number) => {
              return renderSection(s, renderIndex)
            })}
          </main>

          {/* Brand strip fallback — only when the footer section is hidden, so
              the strip always renders (the footer normally renders it with the
              hero background). */}
          {!visibleSections.some((s: any) => s.sectionType === 'footer') && (
            <div
              className="w-full border-t py-5 px-4"
              style={{
                background: appearance.footerBg || 'var(--color-bg)',
                color: appearance.footerText || 'var(--color-text)',
                borderTopColor: 'var(--color-border)',
                fontFamily: lang === 'ar'
                  ? "'Cairo', system-ui, -apple-system, sans-serif"
                  : 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-2 text-xs cq-sm:flex-row cq-sm:justify-between">
                <p className="text-xs" style={{ color: appearance.footerText || 'var(--color-muted)' }}>
                  © {new Date().getFullYear()} · {displayName}
                </p>
                <p className="text-xs" style={{ color: appearance.footerText || 'var(--color-muted)' }}>
                  {lang === 'ar' ? 'بُني بواسطة' : 'Developed with'}{' '}
                  <a
                    href="https://portfolio-hub.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                    style={{
                      color: appearance.footerText || 'var(--color-text)',
                      textDecorationColor: 'color-mix(in srgb, var(--color-text) 40%, transparent)',
                    }}
                  >
                    PortfolioHub
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Mobile-only bottom navigation bar */}
          <PortfolioBottomNav tabs={navTabs} extraSections={extraSections} lang={lang} />
          {/* Spacer: keeps content clear of the fixed bar on mobile */}
          <div
            className="cq-md:hidden"
            style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  )
}
