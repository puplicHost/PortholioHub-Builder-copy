/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { trackPortfolioEvent } from '@/components/portfolio/TrackBeacon'
import { normalizeWhatsappNumber } from '@/lib/whatsapp'
import { TestimonialsSlider } from '@/components/portfolio/TestimonialsSlider'
import { PortfolioBottomNav, type PortfolioNavTab } from '@/components/portfolio/PortfolioBottomNav'
import { Moon, Sun, Globe, Mail, Phone, ExternalLink, ArrowRight, ArrowUp, Code, Layout, Palette, Database, PenTool, CheckCircle, Briefcase, User as UserIcon, MessageCircle, Trophy, Star, Users, Heart, Zap, Target, Award, Clock, TrendingUp, Layers, Rocket, MapPin, FileText } from 'lucide-react'

// Helper to lighten/darken a hex color
function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  trophy: Trophy, star: Star, users: Users, briefcase: Briefcase,
  heart: Heart, zap: Zap, target: Target, award: Award,
  clock: Clock, trendingup: TrendingUp, globe: Globe, code: Code,
  layers: Layers, checkcircle: CheckCircle, rocket: Rocket,
  mail: Mail, phone: Phone, externalink: ExternalLink, arrowright: ArrowRight,
  layout: Layout, palette: Palette, database: Database, pen: PenTool,
  user: UserIcon, message: MessageCircle,
}

function getIcon(name?: string, className?: string) {
  if (!name) return null
  const Icon = ICON_MAP[name.toLowerCase()]
  return Icon ? <Icon className={className} aria-hidden="true" /> : null
}

export function ClassicTemplate({ profile, isFree = false }: { profile: any; isFree?: boolean }) {
  const appearance = profile.appearance || {}
  const localized = profile.localized || {}
  const contactLinks = profile.contactLinks || []
  
  const defaultLangMode = appearance.defaultLanguage || 'en'
  const defaultColorMode = appearance.colorMode || 'light'

  const [lang, setLang] = useState<'ar' | 'en'>(defaultLangMode === 'ar' ? 'ar' : 'en')
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultColorMode)
  // Sync when the incoming defaults change (render-phase adjustment instead
  // of setState-in-effect: same end state, no cascading render pass).
  const [prevDefaults, setPrevDefaults] = useState({ lang: defaultLangMode, theme: defaultColorMode })
  if (prevDefaults.lang !== defaultLangMode || prevDefaults.theme !== defaultColorMode) {
    setPrevDefaults({ lang: defaultLangMode, theme: defaultColorMode })
    setLang(defaultLangMode === 'ar' ? 'ar' : 'en')
    setTheme(defaultColorMode)
  }
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeId, setActiveId] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const actionButtons = appearance.actionButtons || {}
  const showScrollToTop = actionButtons.showScrollToTop !== false
  const whatsappNumber = actionButtons.whatsappNumber || ''
  const waDigits = normalizeWhatsappNumber(whatsappNumber)
  const showWhatsapp = actionButtons.showWhatsapp !== false && !!waDigits

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            if (entry.target.classList.contains('skill-bar')) {
              const width = entry.target.getAttribute('data-width')
              if (width) (entry.target as HTMLElement).style.width = width
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.fade-up, .skill-bar').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  
  const displayName = localized.displayName?.[lang] || profile.displayName || profile.username
  const title = localized.professionalTitle?.[lang] || ''
  const bio = localized.bio?.[lang] || ''
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
  const primary = appearance.primaryColor || '#60a5fa'
  const primaryLight = adjustColor(primary, 40)
  
  const bgLight = appearance.bgColorLight || '#f9fafb'
  const bgDark = appearance.bgColorDark || '#111827'
  
  const currentBg = theme === 'dark' ? bgDark : bgLight
  const currentText = theme === 'dark' 
    ? (appearance.textColorDark || '#f3f4f6') 
    : (appearance.textColorLight || '#1f2937')
  const currentCard = theme === 'dark' ? adjustColor(bgDark, 15) : adjustColor(bgLight, -5)
  const currentBorder = appearance.borderColor || (theme === 'dark' ? '#374151' : '#e5e7eb')
  const currentOutline = appearance.outlineColor || primary
  
  const fontFam = appearance.font || 'Inter'
  const fontLink = `https://fonts.googleapis.com/css2?family=${fontFam.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`

  // Dynamically inject Google Font
  useEffect(() => {
    const existingLink = document.getElementById('dynamic-font-link') as HTMLLinkElement
    if (existingLink) {
      existingLink.href = fontLink
    } else {
      const link = document.createElement('link')
      link.id = 'dynamic-font-link'
      link.rel = 'stylesheet'
      link.href = fontLink
      document.head.appendChild(link)
    }
  }, [fontLink])

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

  const isSectionVisible = (s: any) => {
    if (s.visible === false) return false
    if (s.visible === true) return true
    if (s.settings) {
      try {
        const parsed = typeof s.settings === 'string' ? JSON.parse(s.settings) : s.settings
        if (parsed?.isVisible === false || parsed?.isVisible === 'false') return false
        if (parsed?.isVisible === true || parsed?.isVisible === 'true') return true
      } catch {
        // ignore parse error
      }
    }
    return true
  }
  const visibleSections = sections.filter(isSectionVisible)

  // Scroll-spy: highlight the nav link for the section currently in view.
  const navSectionIds = visibleSections.map((s: any) =>
    s.sectionType === 'footer' ? 'contact' : s.sectionType === 'contact' ? 'contact-info' : s.sectionType
  )
  const navSectionIdsKey = navSectionIds.join(',')
  useEffect(() => {
    const els = navSectionIdsKey
      .split(',')
      .map((id) => (id ? document.getElementById(id) : null))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const update = () => {
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 120) current = el.id
      }
      setActiveId(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [navSectionIdsKey])

  // Mobile bottom navigation: always Home + Contact (the footer always
  // renders), plus About / Projects only when those sections are published.
  const navTabs: PortfolioNavTab[] = [
    { id: 'hero', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: 'home' },
    ...(visibleSections.some((s: any) => s.sectionType === 'about')
      ? [{ id: 'about', label: lang === 'ar' ? 'عني' : 'About', icon: 'about' as const }]
      : []),
    ...(visibleSections.some((s: any) => s.sectionType === 'projects')
      ? [{ id: 'projects', label: lang === 'ar' ? 'أعمالي' : 'Projects', icon: 'projects' as const }]
      : []),
    { id: 'contact', label: lang === 'ar' ? 'تواصل' : 'Contact', icon: 'contact' },
  ]

  const getContactIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('email') || l.includes('mail')) return <Mail className="h-5 w-5" />
    if (l.includes('whatsapp') || l.includes('phone')) return <Phone className="h-5 w-5" />
    if (l.includes('linkedin')) return <Briefcase className="h-5 w-5" />
    return <Globe className="h-5 w-5" />
  }

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase()
    const svgProps = { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 24 24" }
    if (p === 'linkedin') return (
      <svg {...svgProps}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    )
    if (p === 'facebook') return (
      <svg {...svgProps}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    )
    if (p === 'instagram') return (
      <svg {...svgProps}><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
    )
    if (p === 'twitter' || p === 'x') return (
      <svg {...svgProps}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    )
    if (p === 'github') return (
      <svg {...svgProps}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
    )
    if (p === 'whatsapp') return (
      <svg {...svgProps}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    )
    if (p === 'youtube') return (
      <svg {...svgProps}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    )
    if (p === 'tiktok') return (
      <svg {...svgProps}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    )
    return <Globe className="h-5 w-5" />
  }

  const renderSection = (section: any, index: number) => {
    const c = section.content || {}
    const sectionBg = index % 2 === 1 ? 'var(--color-bg)' : 'var(--color-card)'
    const sectionIcon = c.icon

    switch (section.sectionType) {
      case 'about':
        const aboutStats = c.stats || []
        const bioVal = c.biography?.[lang] !== undefined ? c.biography[lang] : c.text?.[lang]
        const biography = bioVal !== undefined ? bioVal : (lang === 'ar' ? 'لا يوجد نص' : 'No about text provided.')
        const aboutBg = theme === 'dark' ? 'var(--color-card)' : '#FAF7F2'
        const aboutImage = profile.avatarUrl || c.imageUrl
        return (
          <section id="about" key={section.id} className="py-8 sm:py-16" style={{ backgroundColor: aboutBg }}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              
              {/* MOBILE VIEW (< md): image + text same row; margin below pushes cards below the fold */}
              <div className="md:hidden grid grid-cols-12 gap-3 items-start mb-12" dir="ltr">
                {aboutImage ? (
                  <div className="col-span-5">
                    <div className="overflow-hidden rounded-2xl shadow-sm border border-[var(--color-border)]/40 bg-[var(--color-bg)] aspect-[3/4]">
                      <img
                        src={aboutImage}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
                <div className={`${aboutImage ? 'col-span-7' : 'col-span-12'} flex flex-col justify-start text-left`}>
                  {biography.split(/\n+/).map((para: string, i: number) => (
                    <p key={i} className="text-[var(--color-text)]/80 leading-[1.9] text-sm font-normal whitespace-pre-wrap text-pretty">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* DESKTOP VIEW (>= md): heading + text left, stat cards right */}
              <div className="hidden md:block">
                <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <UserIcon className="text-[var(--color-primary)]" />}
                  {c.title?.[lang] || (lang === 'ar' ? 'نبذة عني' : 'About Me')}
                </h2>
                {aboutStats.length > 0 ? (
                  <div className="grid grid-cols-5 gap-8 items-start" dir="ltr">
                    <div className="col-span-3 text-[var(--color-text-muted)] leading-[1.75] whitespace-pre-wrap text-lg break-words text-left">
                      {biography}
                    </div>
                    <div className="col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {aboutStats.map((stat: any, i: number) => (
                        <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 bg-[var(--color-bg)] rounded-[10px] p-6 text-center border border-[var(--color-border)] hover:-translate-y-1 transition-all duration-500 shadow-sm">
                          <div className="flex justify-center mb-3">
                            {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]') || <Trophy className="w-7 h-7 text-[var(--color-primary)]" />}
                          </div>
                          <div className="text-3xl font-bold text-[var(--color-primary)] mb-2">{stat.value}</div>
                          <div className="text-sm text-[var(--color-text-muted)] font-medium">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[var(--color-text-muted)] leading-[1.75] whitespace-pre-wrap text-lg break-words">
                    {biography}
                  </div>
                )}
              </div>

              {aboutStats.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-8 sm:mt-10 md:hidden">
                  {aboutStats.map((stat: any, i: number) => (
                    <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 bg-[var(--color-bg)] rounded-[10px] p-6 text-center border border-[var(--color-border)] hover:-translate-y-1 transition-all duration-500 shadow-sm">
                      <div className="flex justify-center mb-3">
                        {getIcon(stat.icon, 'w-7 h-7 text-[var(--color-primary)]') || <Trophy className="w-7 h-7 text-[var(--color-primary)]" />}
                      </div>
                      <div className="text-3xl font-bold text-[var(--color-primary)] mb-2">{stat.value}</div>
                      <div className="text-sm text-[var(--color-text-muted)] font-medium">{stat.label}</div>
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
        let categories: { title: string; icon: React.ReactNode; items: { name: string; percentage: number }[] }[] = []

        if (skillGroups.length > 0) {
          categories = skillGroups.map((g: any) => ({
            title: g.name || 'Skills',
            icon: <Code className="text-[var(--color-primary)]" />,
            items: (g.skills || [])
              .filter((s: any) => s && s.name && s.name.trim() !== '')
              .map((s: any) => ({ name: s.name, percentage: s.percentage || 75 }))
          })).filter((cat: any) => cat.items.length > 0)
        } else if (fallbackSkills.length > 0) {
          const valid = fallbackSkills.filter((s: string) => s && typeof s === 'string' && s.trim() !== '')
          if (valid.length > 0) {
            categories = [
              { title: lang === 'ar' ? 'مهارات تقنية' : 'Technical Skills', icon: <Code className="text-[var(--color-primary)]" />, items: valid.slice(0, Math.ceil(valid.length/2)).map((s: string) => ({ name: s, percentage: 75 })) },
              { title: lang === 'ar' ? 'مهارات أخرى' : 'Other Skills', icon: <PenTool className="text-[var(--color-primary)]" />, items: valid.slice(Math.ceil(valid.length/2)).map((s: string) => ({ name: s, percentage: 75 })) }
            ].filter((cat: any) => cat.items.length > 0)
          }
        }

        // If user has not added any skills, do NOT render any default skills — omit section entirely
        if (categories.length === 0) {
          return null
        }

        return (
          <section id="skills" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Layout className="text-[var(--color-primary)]" />}
                {c.heading?.[lang] || c.title?.[lang] || (lang === 'ar' ? 'المهارات' : 'Skills & Expertise')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
                {categories.map((cat, i) => (
                  <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group relative overflow-hidden rounded-[15px] border border-[var(--color-border)] p-4 sm:p-[30px] bg-[var(--color-card)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <span className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))' }} />
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                      <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm [&>*]:!text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                        {cat.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl break-words font-bold tracking-tight text-[var(--color-text)] leading-tight">
                          {cat.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)]">
                          {cat.items.length} {cat.items.length === 1 ? (lang === 'ar' ? 'مهارة' : 'skill') : (lang === 'ar' ? 'مهارات' : 'skills')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {cat.items.map((skill: { name: string; percentage: number }, j: number) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:-translate-y-0.5 transition-all"
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-primary)' }} />
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      case 'experience':
        const expItems = c.items || []
        const expDisplayMode = c.displayMode || 'timeline'
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const formatExpDate = (dateStr: string) => {
          if (!dateStr) return ''
          const [year, month] = dateStr.split('-')
          return `${monthNames[parseInt(month, 10) - 1]} ${year}`
        }
        const calcDuration = (start: string, end: string, isCurrent: boolean) => {
          if (!start) return ''
          const startDate = new Date(start + '-01')
          const endDate = isCurrent ? new Date() : end ? new Date(end + '-01') : null
          if (!endDate) return ''
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
          if (months < 1) return lang === 'ar' ? 'أقل من شهر' : 'Less than a month'
          const yrs = Math.floor(months / 12)
          const mos = months % 12
          if (yrs === 0) return `${mos} ${lang === 'ar' ? 'أشهر' : 'mos'}`
          if (mos === 0) return `${yrs} ${lang === 'ar' ? 'سنوات' : 'yrs'}`
          return `${yrs} ${lang === 'ar' ? 'سنوات' : 'yrs'} ${lang === 'ar' ? 'و' : ''} ${mos} ${lang === 'ar' ? 'أشهر' : 'mos'}`
        }
        const renderExpItem = (item: any) => {
          const endLabel = item.isCurrent
            ? (lang === 'ar' ? 'الحالي' : 'Present')
            : formatExpDate(item.endDate)
          const dateLabel = item.startDate
            ? `${formatExpDate(item.startDate)}${endLabel ? ` - ${endLabel}` : ''}`
            : ''
          const duration = item.startDate ? calcDuration(item.startDate, item.endDate, item.isCurrent) : ''
          const bullets = (item.description || '').split('\n').filter((l: string) => l.trim())
          return (
            <div key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-3">
                {item.companyLogo ? (
                  <img src={item.companyLogo} alt={item.companyName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {getIcon(item.icon, 'w-5 h-5 text-white') || <Briefcase className="w-5 h-5 text-white" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg break-words font-bold text-[var(--color-text)]">{item.jobTitle || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title')}</h3>
                    {item.employmentType && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-full" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                        {item.employmentType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium break-words" style={{ color: 'var(--color-primary)' }}>
                    {item.companyName || (lang === 'ar' ? 'اسم الشركة' : 'Company Name')}
                  </p>
                </div>
              </div>
                              {(item.location || item.workMode) && (
                                <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] font-medium mb-3 flex-wrap">
                                  {item.location && (
                    <span className="flex items-start gap-1 max-w-full">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-[2px]" />
                      <span className="break-words min-w-0 flex-1">{item.location}</span>
                    </span>
                  )}
                  {item.workMode && (
                    <span className="break-words max-w-full">{item.workMode}</span>
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
          <section id="experience" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-4 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Briefcase className="text-[var(--color-primary)]" />}
                {c.heading?.[lang] || (lang === 'ar' ? 'الخبرات العملية' : 'Work Experience')}
              </h2>
              {c.description?.[lang] && (
                <p className="text-[var(--color-text-muted)] leading-relaxed break-words mb-12 max-w-2xl text-lg">{c.description[lang]}</p>
              )}
              {expItems.length > 0 ? (
                expDisplayMode === 'timeline' ? (
                  <div className="relative ps-8 md:ps-12">
                    <div className="absolute start-3 md:start-5 top-1 bottom-1 w-[3px] rounded-full" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-primary) 12%, var(--color-primary) 88%, transparent)' }} />
                    <div className="space-y-10">
                      {expItems.map((item: any, ei: number) => {
                        const endLabel = item.isCurrent
                          ? (lang === 'ar' ? 'الحالي' : 'Present')
                          : formatExpDate(item.endDate)
                        const dateLabel = item.startDate
                          ? `${formatExpDate(item.startDate)}${endLabel ? ` - ${endLabel}` : ''}`
                          : ''
                        const duration = item.startDate ? calcDuration(item.startDate, item.endDate, item.isCurrent) : ''
                        const bullets = (item.description || '').split('\n').filter((l: string) => l.trim())
                        return (
                          <div key={item.id} style={{ transitionDelay: `${Math.min(ei * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 relative transition-all duration-500">
                            <div
                              className={`absolute -start-5 md:-start-7 top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[var(--color-bg)] ring-2 ring-[var(--color-primary)]/20 ${
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
                                  <img src={item.companyLogo} alt={item.companyName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                                    {getIcon(item.icon, 'w-5 h-5 text-white') || <Briefcase className="w-5 h-5 text-white" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg break-words font-bold text-[var(--color-text)]">{item.jobTitle || (lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title')}</h3>
                                    {item.employmentType && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-full" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                                        {item.employmentType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium break-words" style={{ color: 'var(--color-primary)' }}>
                                    {item.companyName || (lang === 'ar' ? 'اسم الشركة' : 'Company Name')}
                                  </p>
                                </div>
                              </div>
                              {(dateLabel || item.location || item.workMode) && (
                                <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] font-medium mb-3 flex-wrap">
                                  {dateLabel && (
                                    <span className="flex items-start gap-1 max-w-full">
                                      <Clock className="w-3.5 h-3.5 shrink-0 mt-[2px]" />
                                      <span className="break-words min-w-0 flex-1">{dateLabel}{duration && ` · ${duration}`}</span>
                                    </span>
                                  )}
                                  {item.location && (
                                    <span className="flex items-start gap-1 max-w-full">
                                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-[2px]" />
                                      <span className="break-words min-w-0 flex-1">{item.location}</span>
                                    </span>
                                  )}
                                  {item.workMode && (
                                    <span className="break-words max-w-full">{item.workMode}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      case 'services':
        const serviceItems = c.services || []
        return (
          <section id="services" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-16">
                <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-4 text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Briefcase className="text-[var(--color-primary)]" />}
                  {c.heading?.[lang] || c.title?.[lang] || (lang === 'ar' ? 'الخدمات' : 'Services')}
                </h2>
                {(c.description?.[lang]) && (
                  <p className="text-[var(--color-text-muted)] leading-relaxed break-words text-lg max-w-2xl">
                    {c.description[lang]}
                  </p>
                )}
              </div>
              {serviceItems.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                  {serviceItems.map((service: any, i: number) => (
                    <div key={i} style={{ transitionDelay: `${Math.min(i * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group relative overflow-hidden rounded-xl border border-[var(--color-border)] p-4 sm:p-7 bg-[var(--color-card)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <span className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))' }} />
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 shadow-sm [&>*]:!text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                        {getIcon(service.icon, 'w-5 h-5 text-white') || <Code className="w-5 h-5 text-white" />}
                      </div>
                      <h3 className="text-base sm:text-xl break-words font-bold mb-2 sm:mb-3 text-[var(--color-text)] tracking-tight">{service.title}</h3>
                      {service.description ? (
                        <p className="text-[var(--color-text-muted)] text-[13px] sm:text-[15px] leading-relaxed break-words mb-4 sm:mb-5 line-clamp-3">{service.description}</p>
                      ) : null}
                      {service.features && service.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {service.features.slice(0, 4).map((feature: string, fi: number) => (
                            <span key={fi} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-1 text-[11px] sm:text-xs font-semibold break-words" style={{ color: 'var(--color-primary)' }}>
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              {feature}
                            </span>
                          ))}
                          {service.features.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)]">
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
          <section id="testimonials" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <div className="mb-12 text-center">
                <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-4 text-[var(--color-text)] flex items-center justify-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <MessageCircle className="text-[var(--color-primary)]" />}
                  {c.title?.[lang] || (lang === 'ar' ? 'آراء العملاء' : 'Testimonials')}
                </h2>
                {(c.subtitle?.[lang] || c.description?.[lang]) && (
                  <p className="text-[var(--color-text-muted)] leading-relaxed break-words text-lg max-w-2xl mx-auto">
                    {c.subtitle?.[lang] || c.description?.[lang]}
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
      case 'projects':
        const projects = profile.projectPages || []
        const displayMode = c.displayMode || 'grid'
        return (
          <section id="projects" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Palette className="text-[var(--color-primary)]" />}
                {c.title?.[lang] || (lang === 'ar' ? 'المشاريع' : 'Featured Projects')}
              </h2>
              {displayMode === 'list' ? (
                <div className="flex flex-col gap-6">
                  {projects.map((proj: any) => (
                    <div key={proj.id} className="group flex flex-col sm:flex-row rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                      {proj.coverImage ? (
                        <div className="w-full sm:w-[300px] h-[200px] sm:h-auto shrink-0 overflow-hidden bg-[var(--color-bg)]">
                          <img src={proj.coverImage} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full sm:w-[300px] h-[200px] sm:h-auto shrink-0 bg-[var(--color-bg)] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--color-border)]">
                          <Code className="h-12 w-12 text-[var(--color-border)]" />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1 min-w-0">
                        <h3 className="text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-3">{proj.title}</h3>
                        {proj.description && <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4">{proj.description}</p>}
                        {proj.tags && proj.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {proj.tags.map((tag: string, i: number) => (
                              <span key={i} className="text-xs font-medium truncate max-w-full text-[var(--color-text)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                          {(() => {
                            const linkType = proj.linkType || (proj.content as any)?.linkType || 'none'
                            const linkedSlug = proj.linkedPageSlug || (proj.content as any)?.linkedPageSlug
                            const isTempSlug = !linkedSlug || String(linkedSlug).startsWith('new-') || String(linkedSlug).startsWith('project-new-')
                            // FREE users never route to internal project pages — external URLs only.
                            if (linkType === 'page' && !isTempSlug && !isFree) {
                              return (
                                <Link
                                  href={`/u/${profile.username}/projects/${linkedSlug}`}
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {proj.linkLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </Link>
                              )
                            }
                            if (linkType === 'external' && proj.externalLink) {
                              return (
                                <a
                                  href={proj.externalLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {proj.linkLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </a>
                              )
                            }
                            return null
                          })()}
                          {proj.items?.map((item: any, i: number) => {
                            const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
                            const itemSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
                            const itemLabel = item.linkLabel || item.title
                            const isItemTempSlug = !itemSlug || String(itemSlug).startsWith('new-') || String(itemSlug).startsWith('project-new-')
                            // FREE users never route to internal project pages — external URLs only.
                            if (itemLinkType === 'page' && !isItemTempSlug && !isFree) {
                              return (
                                <Link
                                  key={i}
                                  href={`/u/${profile.username}/projects/${itemSlug}`}
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {itemLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </Link>
                              )
                            }
                            if (itemLinkType === 'external' && item.externalUrl) {
                              return (
                                <a
                                  key={i}
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {itemLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </a>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-[var(--color-text-muted)] text-center font-medium">{lang === 'ar' ? 'لا توجد مشاريع مضافة' : 'No projects added yet.'}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                  {projects.map((proj: any, pi: number) => (
                    <div key={proj.id} style={{ transitionDelay: `${Math.min(pi * 70, 350)}ms` }} className="fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 group rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                      {proj.coverImage ? (
                        <div className="h-[120px] sm:h-[200px] w-full overflow-hidden bg-[var(--color-bg)] shrink-0">
                          <img src={proj.coverImage} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="h-[120px] sm:h-[200px] w-full bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)]">
                          <Code className="h-8 w-8 sm:h-12 sm:w-12 text-[var(--color-border)]" />
                        </div>
                      )}
                        <div className="p-4 sm:p-6 flex flex-col flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-2 sm:mb-3">{proj.title}</h3>
                          {proj.description && <p className="text-[var(--color-text-muted)] text-[13px] sm:text-[15px] leading-relaxed break-words mb-3 sm:mb-4 line-clamp-3">{proj.description}</p>}
                          {proj.tags && proj.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {proj.tags.map((tag: string, i: number) => (
                                <span key={i} className="text-xs font-medium truncate max-w-full text-[var(--color-text)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full hover:-translate-y-0.5 transition-transform">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                          {(() => {
                            const linkType = proj.linkType || (proj.content as any)?.linkType || 'none'
                            const linkedSlug = proj.linkedPageSlug || (proj.content as any)?.linkedPageSlug
                            const isTempSlug = !linkedSlug || String(linkedSlug).startsWith('new-') || String(linkedSlug).startsWith('project-new-')
                            // FREE users never route to internal project pages — external URLs only.
                            if (linkType === 'page' && !isTempSlug && !isFree) {
                              return (
                                <Link
                                  href={`/u/${profile.username}/projects/${linkedSlug}`}
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {proj.linkLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </Link>
                              )
                            }
                            if (linkType === 'external' && proj.externalLink) {
                              return (
                                <a
                                  href={proj.externalLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {proj.linkLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </a>
                              )
                            }
                            return null
                          })()}
                          {proj.items?.map((item: any, i: number) => {
                            const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
                            const itemSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
                            const itemLabel = item.linkLabel || item.title
                            const isItemTempSlug = !itemSlug || String(itemSlug).startsWith('new-') || String(itemSlug).startsWith('project-new-')
                            // FREE users never route to internal project pages — external URLs only.
                            if (itemLinkType === 'page' && !isItemTempSlug && !isFree) {
                              return (
                                <Link
                                  key={i}
                                  href={`/u/${profile.username}/projects/${itemSlug}`}
                                  className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {itemLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                </Link>
                              )
                            }
                              if (itemLinkType === 'external' && item.externalUrl) {
                                return (
                                  <a
                                    key={i}
                                    href={item.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {itemLabel || (lang === 'ar' ? 'عرض المشروع' : 'View Project')}
                                  </a>
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-[var(--color-text-muted)] col-span-full font-medium">{lang === 'ar' ? 'لا توجد مشاريع مضافة' : 'No projects added yet.'}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )
      case 'gallery': {
        const galleryItems = Array.isArray(c.items) ? c.items : []
        if (galleryItems.length === 0) return null
        return (
          <section id="gallery" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Layout className="text-[var(--color-primary)]" />}
                {c.title?.[lang] || (lang === 'ar' ? 'معرض الأعمال' : 'Gallery')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryItems.map((item: any, i: number) => {
                  const src = item.imageUrl || item.url || ''
                  if (!src) return null
                  return (
                    <figure key={item.id || i} className="group rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
                      <img src={src} alt={item.caption || ''} loading="lazy" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                      {item.caption ? (
                        <figcaption className="px-4 py-3 text-sm text-[var(--color-text-muted)] break-words">{item.caption}</figcaption>
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
          <section id="files" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <FileText className="h-7 w-7 text-[var(--color-primary)]" />}
                {c.title?.[lang] || (lang === 'ar' ? 'ملفات للتحميل' : 'Downloads')}
              </h2>
              <div className="flex flex-col gap-3 max-w-[800px]">
                {fileItems.map((file: any, i: number) => {
                  const href = file.url || file.externalUrl
                  return (
                    <a
                      key={file.id || i}
                      href={href}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-sm font-medium text-[var(--color-text)] break-words">
                        {file.label || file.title || href}
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
        if (contactLinks.length === 0 && !c.title?.[lang] && !c.headline?.[lang]) return null
        return (
          <section id="contact-info" key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Mail className="h-7 w-7 text-[var(--color-primary)]" />}
                {c.title?.[lang] || c.headline?.[lang] || (lang === 'ar' ? 'تواصل معي' : 'Contact')}
              </h2>
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
                      className="flex items-center gap-4 rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="h-10 w-10 shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
                        {getSocialIcon(platform) || getContactIcon(platform)}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text)] break-words">
                        {link.label || link.value || href}
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
        if (!c.title?.[lang] && paragraphs.length === 0) return null
        return (
          <section id={`custom-${section.id}`} key={section.id} className="py-12 md:py-[100px]" style={{ backgroundColor: sectionBg }}>
            <div className="max-w-[1200px] mx-auto px-6 sm:px-12 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0">
              {c.title?.[lang] ? (
                <h2 className="text-2xl md:text-3xl break-words font-bold tracking-tight mb-12 text-[var(--color-text)] flex items-center gap-3">
                  {getIcon(sectionIcon, 'text-[var(--color-primary)]') || <Layout className="text-[var(--color-primary)]" />}
                  {c.title[lang]}
                </h2>
              ) : null}
              <div className="max-w-[800px] space-y-4 text-[var(--color-text-muted)] leading-[1.75] text-lg break-words">
                {paragraphs.map((p: string, i: number) => (
                  <p key={i} className="whitespace-pre-wrap">{p}</p>
                ))}
              </div>
            </div>
          </section>
        )
      }
      case 'footer': {
        const footerSocialLinks = (c.links && c.links.length > 0) ? c.links : (contactLinks || [])
        // Localized fallback labels so unlabeled sections never render as raw
        // English section ids (e.g. "projects") inside an Arabic footer.
        const footerSectionLabels: Record<string, { en: string; ar: string }> = {
          hero: { en: 'Home', ar: 'الرئيسية' },
          about: { en: 'About', ar: 'نبذة' },
          projects: { en: 'Projects', ar: 'الأعمال' },
          skills: { en: 'Skills', ar: 'المهارات' },
          experience: { en: 'Experience', ar: 'الخبرة' },
          services: { en: 'Services', ar: 'الخدمات' },
          testimonials: { en: 'Testimonials', ar: 'التقييمات' },
          contact: { en: 'Contact', ar: 'تواصل' },
          custom: { en: 'More', ar: 'المزيد' },
        }

        // ── Column 1 · Identity — real profile data only ────────────────
        const heroSection = visibleSections.find((s: any) => s.sectionType === 'hero')
        const heroSubtitle = heroSection?.content?.subtitle?.[lang] || ''
        const aboutSection = visibleSections.find((s: any) => s.sectionType === 'about')
        const aboutC = aboutSection?.content || {}
        const aboutBioRaw = aboutC.biography?.[lang] ?? aboutC.text?.[lang] ?? ''
        const bioShort = typeof aboutBioRaw === 'string'
          ? aboutBioRaw.replace(/\s+/g, ' ').trim().slice(0, 120)
          : ''
        const role = title || heroSubtitle
        const shortBio = bioShort || bio || (typeof profile.bio === 'string' ? profile.bio : '')

        // ── Column 2 · Quick Links — only sections that exist on the page ──
        const quickLinks: { label: string; href: string }[] = visibleSections
          .filter((s: any) => s.sectionType !== 'footer')
          .map((s: any) => {
            const customLabel = s.content?.title?.[lang]
            const fallback = footerSectionLabels[s.sectionType]
            return {
              label: customLabel || (fallback ? fallback[lang] : s.sectionType),
              href: s.sectionType === 'hero' ? '#hero' : `#${s.sectionType}`,
            }
          })
        // The contact section is folded into the footer (#contact), so the
        // Contact anchor always points at the footer itself.
        if (!quickLinks.some((l) => l.href === '#contact')) {
          quickLinks.push({ label: footerSectionLabels.contact[lang], href: '#contact' })
        }

        // ── Column 3 · Get In Touch — email / whatsapp / location ─────────
        const contactArr = Array.isArray(c.links) && c.links.length > 0 ? c.links : (contactLinks || [])
        const findContact = (keys: string[]) =>
          contactArr.find((l: any) => {
            const t = String(l.type || l.platform || l.label || '').toLowerCase()
            return keys.some((k) => t.includes(k))
          })
        const emailRaw = findContact(['email', 'mail'])
        const waRaw = findContact(['whatsapp'])
        const emailVal = emailRaw ? String(emailRaw.value || emailRaw.url || emailRaw.label || '') : ''
        const waVal = waRaw ? String(waRaw.value || waRaw.url || '') : String(whatsappNumber || '')
        const emailHref = emailVal
          ? (emailVal.includes('@') && !emailVal.startsWith('mailto:') ? `mailto:${emailVal}` : emailVal)
          : ''
        const waHref = waVal
          ? (waVal.startsWith('http') ? waVal : `https://wa.me/${normalizeWhatsappNumber(waVal)}`)
          : ''
        const locVal = localized.location?.[lang] || profile.location || ''

        // Saved footer headline/subheading — the exact fields the builder edits.
        const heading = c.headline?.[lang] || ''
        const subheading = c.subheading?.[lang] || ''
        const ctaHref = emailHref || waHref || '#contact'

        const GOLD = '#D4A017'
        const year = new Date().getFullYear()
        const cairoLink = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap'
        return (
          <React.Fragment key={section.id}>
            <link rel="stylesheet" href={cairoLink} />
            <footer
              id="contact"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="border-t border-white/15 pt-12 pb-8 sm:pt-16"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                color: '#ffffff',
                fontFamily: lang === 'ar'
                  ? "'Cairo', system-ui, -apple-system, sans-serif"
                  : 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              <div className="mx-auto max-w-[1200px] px-6 sm:px-12">
                {/* ── Three columns ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-[1.5fr_1fr_1.3fr] md:gap-12 md:text-start">

                  {/* Column 1 · Identity */}
                  <div>
                    <p className="break-words text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {displayName}
                    </p>
                    {role && (
                      <p className="mt-1.5 text-sm font-medium break-words" style={{ color: GOLD }}>
                        {role}
                      </p>
                    )}
                    {shortBio && (
                      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/75 break-words md:mx-0">
                        {shortBio}
                      </p>
                    )}
                    {footerSocialLinks.length > 0 && (
                      <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                        {footerSocialLinks.map((link: any, idx: number) => {
                          const platform = link.platform || link.label || 'globe'
                          const label = link.label || link.platform || (lang === 'ar' ? 'رابط' : 'Link')
                          const rawUrl = link.url || ''
                          const href = rawUrl.startsWith('http') || rawUrl.startsWith('mailto:') || rawUrl.startsWith('tel:')
                            ? rawUrl
                            : rawUrl.includes('@')
                              ? `mailto:${rawUrl}`
                              : `https://${rawUrl}`
                          return (
                            <a
                              key={idx}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={label}
                              title={label}
                              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                            >
                              {getSocialIcon(platform) || getContactIcon(platform)}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 2 · Quick links */}
                  {quickLinks.length > 0 && (
                    <nav aria-label={lang === 'ar' ? 'روابط سريعة' : 'Quick links'}>
                      <h3
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: GOLD }}
                      >
                        {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                      </h3>
                      <ul className="mt-4 space-y-1">
                        {quickLinks.map((n: { label: string; href: string }) => (
                          <li key={n.href}>
                            <a
                              href={n.href}
                              className="group inline-flex min-h-[36px] items-center text-sm font-medium text-white/80 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                            >
                              <span className="relative">
                                {n.label}
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-[#D4A017] transition-all duration-200 group-hover:w-full"
                                />
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  )}

                  {/* Column 3 · Contact — driven by saved footer headline/subheading */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                      {heading || (lang === 'ar' ? 'تواصل معي' : 'Get In Touch')}
                    </h3>
                    {subheading && (
                      <p className="mt-3 text-sm leading-relaxed text-white/75 break-words">
                        {subheading}
                      </p>
                    )}
                    <ul className="mt-4 space-y-3 flex flex-col items-center md:items-start">
                      {emailHref && (
                        <li>
                          <a
                            href={emailHref}
                            className="inline-flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                          >
                            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="break-all">{emailVal.replace(/^mailto:/, '')}</span>
                          </a>
                        </li>
                      )}
                      {waHref && (
                        <li>
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                          >
                            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                          </a>
                        </li>
                      )}
                      {locVal && (
                        <li className="inline-flex items-center gap-2.5 text-sm text-white/80">
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="break-words">{locVal}</span>
                        </li>
                      )}
                    </ul>
                    {(emailHref || waHref) && (
                      <a
                        href={ctaHref}
                        className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-[#1a1a1a] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                        style={{ background: GOLD }}
                      >
                        {lang === 'ar' ? 'تواصل معي' : 'Get in touch'}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Bottom bar — always credits the owner + PortfolioHub ── */}
                <div className="mt-12 border-t border-white/15 pt-5">
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
                    <p className="text-xs text-white/80">
                      © {year} · {displayName}
                    </p>
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-5">
                      <p className="text-xs text-white/80">
                        © {year} · {lang === 'ar' ? 'بُني بواسطة' : 'Developed with'}{' '}
                        <a
                          href="https://portfolio-hub.online"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-white underline decoration-white/40 underline-offset-2 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white/90"
                        >
                          PortfolioHub
                        </a>
                      </p>
                      {showScrollToTop && (
                        <button
                          type="button"
                          onClick={scrollToTop}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-white/80 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                          {lang === 'ar' ? 'للأعلى' : 'Back to top'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </React.Fragment>
        )
      }
      default:
        return null
    }
  }

  const initial = displayName.substring(0, 2).toUpperCase()

  return (
    <>
      <link rel="stylesheet" href={fontLink} />
      <style dangerouslySetInnerHTML={{__html: `
        html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .fade-up { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
      `}} />
      
      <div className="min-h-screen w-full transition-colors duration-300" style={style}>
        <div className="w-full min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Navigation Bar */}
          <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'py-2.5 sm:py-3 shadow-md' : 'py-3 sm:py-5'}`} style={{ backgroundColor: isScrolled ? (theme === 'light' ? 'var(--color-bg)' : 'color-mix(in srgb, var(--color-bg) 90%, transparent)') : 'transparent', backdropFilter: isScrolled ? 'blur(10px)' : 'none', borderBottom: isScrolled ? '1px solid var(--color-border)' : 'none' }}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-12">
              {/* MOBILE (unchanged): bottom nav handles links; language pill stays right-aligned */}
              <div className="md:hidden flex items-center justify-end">
                {defaultLangMode === 'both' && (
                  <div className={`flex items-center rounded-full border p-0.5 text-[11px] font-bold ${isScrolled && theme === 'light' ? 'border-[var(--color-border)] bg-[var(--color-card)]' : 'border-white/20 bg-white/5'}`}>
                    <button
                      type="button"
                      onClick={() => setLang('ar')}
                      className={`rounded-full px-2.5 py-1 transition-colors cursor-pointer ${lang === 'ar' ? 'bg-[#2563eb] text-white' : (isScrolled && theme === 'light' ? 'text-[var(--color-text-muted)]' : 'text-slate-300')}`}
                    >
                      AR
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`rounded-full px-2.5 py-1 transition-colors cursor-pointer ${lang === 'en' ? 'bg-[#2563eb] text-white' : (theme === 'light' ? 'text-[var(--color-text-muted)]' : 'text-slate-300')}`}
                    >
                      EN
                    </button>
                  </div>
                )}
              </div>

              {/* DESKTOP (md+): 3-column split — name | links | contact */}
              <div className="hidden md:grid w-full items-center gap-6" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
                <a
                  href="#hero"
                  className={`justify-self-start truncate max-w-[240px] text-lg font-bold tracking-tight transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${isScrolled && theme === 'light' ? 'text-[var(--color-text)] hover:text-[var(--color-primary)]' : 'text-white hover:text-white/80'}`}
                >
                  {displayName}
                </a>

                <ul className="justify-self-center flex items-center gap-5 lg:gap-8 font-medium">
                  {visibleSections.map((s: any) => {
                    if (s.sectionType === 'hero') return null
                    if (s.sectionType === 'skills') {
                      const groups = s.content?.groups || []
                      const fallback = s.content?.skills || []
                      const hasAnySkills = groups.some((g: any) => (g.skills || []).some((sk: any) => sk.name && sk.name.trim())) || fallback.some((f: any) => typeof f === 'string' && f.trim())
                      if (!hasAnySkills) return null
                    }
                    const label = s.sectionType === 'footer'
                      ? (lang === 'ar' ? 'تواصل معي' : 'Contact')
                      : (s.content?.title?.[lang] || s.sectionType)
                    const targetId = s.sectionType === 'footer'
                      ? 'contact'
                      : s.sectionType === 'contact'
                        ? 'contact-info'
                        : s.sectionType
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${targetId}`}
                          aria-current={activeId === targetId ? 'location' : undefined}
                          className={`capitalize transition-colors relative group font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                            activeId === targetId
                              ? (isScrolled && theme === 'light' ? 'text-[var(--color-primary)]' : 'text-white')
                              : (isScrolled && theme === 'light' ? 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]' : 'text-white/90 hover:text-white')
                          }`}
                        >
                          {label}
                          <span className={`absolute -bottom-1 start-0 h-0.5 transition-all duration-300 group-hover:w-full ${activeId === targetId ? 'w-full' : 'w-0'} ${isScrolled && theme === 'light' ? 'bg-[var(--color-primary)]' : 'bg-white'}`}></span>
                        </a>
                      </li>
                    )
                  })}
                </ul>

                <div className="justify-self-end flex items-center gap-3">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 active:scale-[0.97] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)]"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {lang === 'ar' ? 'تواصل معي' : 'Contact Me'}
                  </a>
                  {defaultLangMode === 'both' && (
                    <button
                      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                      className="h-9 px-3 inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 shadow-sm hover:scale-110 active:scale-95 transition-transform text-white text-xs font-bold uppercase cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title="Switch language"
                    >
                      {lang === 'en' ? 'AR' : 'EN'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-20 md:bottom-6 left-6 z-50 flex flex-col items-start gap-3">
            {showWhatsapp && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackPortfolioEvent(profile.username, 'whatsapp_click')}
                className="h-11 w-11 flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
                title="Chat on WhatsApp"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
            {showScrollToTop && (
              <button
                onClick={scrollToTop}
                className={`h-11 w-11 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-110 transition-all ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
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
              const bgImage = heroContent.backgroundImage
              const overlayOpacity = heroContent.overlayOpacity !== undefined ? Number(heroContent.overlayOpacity) : 0.5

              return (
                <section 
                  id="hero" 
                  className="relative flex items-center justify-center min-h-[50vh] md:min-h-[62vh] overflow-hidden"
                  style={{ 
                    background: bgImage
                      ? `url("${bgImage}") center/cover no-repeat`
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                    paddingTop: '80px',
                    paddingBottom: '35px'
                  }}
                >
                  {bgImage && (
                    <div
                      className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                      style={{ opacity: overlayOpacity }}
                    />
                  )}
                  <div className="max-w-[1200px] mx-auto px-5 sm:px-12 flex flex-col items-center text-center z-10 fade-up opacity-0 translate-y-5 transition-all duration-700 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 relative">
                    {/* Avatar image — desktop only (hidden on mobile) */}
                    {profile.avatarUrl ? (
                      <div className="hidden md:block w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-6 hover:scale-105 transition-transform duration-500 bg-white shrink-0">
                        <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="hidden md:flex w-36 h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-6 hover:scale-105 transition-transform duration-500 bg-white/20 backdrop-blur-md items-center justify-center text-white text-4xl lg:text-5xl font-black select-none shrink-0">
                        {initial}
                      </div>
                    )}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2.5 sm:mb-4 text-center leading-snug whitespace-pre-line" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
                      {displayName}
                    </h1>
                    <p className="text-sm sm:text-sm md:text-base text-white/90 max-w-xl leading-relaxed mb-5 sm:mb-7 font-normal text-center">
                      {title || heroContent.subtitle?.[lang]}
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-4" dir="rtl">
                      <a 
                        href="#projects" 
                        className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white text-[var(--color-primary)] font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                      >
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 rtl:rotate-180" />
                        <span>{lang === 'ar' ? 'شاهد أعمالي' : 'View My Work'}</span>
                      </a>
                      <a 
                        href="#contact" 
                        className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 border-white text-white font-bold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all cursor-pointer min-h-[44px] inline-flex items-center"
                      >
                        <span>{lang === 'ar' ? 'تواصل معي' : 'Contact Me'}</span>
                      </a>
                    </div>
                  </div>
                </section>
              )
            })()}

            {/* OTHER SECTIONS */}
            {visibleSections.map((s: any, i: number) => {
              if (s.sectionType === 'hero') return null
              return renderSection(s, i)
            })}
          </main>

          {/* Brand strip fallback — only when the footer section is hidden, so
              the strip always renders (the footer normally renders it with the
              hero background). */}
          {!visibleSections.some((s: any) => s.sectionType === 'footer') && (
            <div
              className="w-full border-t border-white/15 py-5 px-4 text-white/80"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                fontFamily: lang === 'ar'
                  ? "'Cairo', system-ui, -apple-system, sans-serif"
                  : 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-2 text-xs sm:flex-row sm:justify-between">
                <p className="text-xs text-white/80">
                  © {new Date().getFullYear()} · {displayName}
                </p>
                <p className="text-xs text-white/80">
                  © {new Date().getFullYear()} · {lang === 'ar' ? 'بُني بواسطة' : 'Developed with'}{' '}
                  <a
                    href="https://portfolio-hub.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline decoration-white/40 underline-offset-2 transition-colors hover:text-[#D4A017] focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white/90"
                  >
                    PortfolioHub
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Mobile-only bottom navigation bar */}
          <PortfolioBottomNav tabs={navTabs} />
          {/* Spacer: keeps content clear of the fixed bar on mobile */}
          <div
            className="md:hidden"
            style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  )
}
