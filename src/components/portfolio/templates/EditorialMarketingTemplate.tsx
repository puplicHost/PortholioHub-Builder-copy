'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import {
  ArrowRight,
  ArrowUp,
  ExternalLink,
  FileText,
  Menu,
  Play,
  X,
} from 'lucide-react'
import styles from './editorial.module.css'
import { isSectionVisible } from '@/lib/section-visibility'
import { getPortfolioLang, pickLang, type LocalizedValue } from '@/lib/portfolio-language'
import { sanitizeUrl } from '@/lib/urls'
import { portfolioImageUrl } from '@/lib/cloudinary'
import { resolveProjectCardDestination } from '@/lib/project-card-links'
import { resolveEditorialAppearanceVars } from '@/lib/editorial-appearance'
import { normalizeWhatsappNumber } from '@/lib/whatsapp'
import { formatExperienceRange } from '@/lib/experience-dates'
import { PORTFOLIO_ICON_MAP } from '@/lib/portfolio-icons'
import { getSocialIcon, getContactIcon } from '@/components/portfolio/PortfolioFooter'
import { ProjectFileIcon } from '@/components/portfolio/ProjectCard'
import { trackPortfolioEvent } from '@/components/portfolio/TrackBeacon'
import {
  getFileTypeStyle,
  projectCardVisual,
  projectFileType,
  projectImageFit,
  aspectRatioValue,
} from '@/lib/project-card-visuals'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Serif identity for the editorial design. next/font tree-shakes only the
// Latin subset actually used; Arabic glyphs fall back to the system serif
// stack declared in the CSS module (consistent with app-wide font rules).
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
})

export type EditorialMarketingTemplateProps = {
  profile: any
  isFree?: boolean
  preview?: boolean
  onThemeChange?: (mode: 'light' | 'dark') => void
}

type Lang = 'ar' | 'en'

// UI chrome labels only. Every content value (names, bios, titles, links…)
// comes from the profile data below — nothing is invented here.
const copy: Record<Lang, {
  navOpen: string
  navClose: string
  workTitle: string
  workIntro: string
  aboutTitle: string
  brandsTitle: string
  skillsTitle: string
  servicesTitle: string
  experienceTitle: string
  educationTitle: string
  testimonialsTitle: string
  galleryTitle: string
  filesTitle: string
  contactTitle: string
  viewWorkCta: string
  contactCta: string
  viewCaseStudy: string
  viewProject: string
  backToTop: string
  quickLinks: string
  rightsReserved: string
  developedBy: string
}> = {
  ar: {
    navOpen: 'افتح القائمة',
    navClose: 'أغلق القائمة',
    workTitle: 'أعمال مختارة',
    workIntro: 'دراسات حالة من أحدث الأعمال.',
    aboutTitle: 'من أنا',
    brandsTitle: 'علامات عملت معها',
    skillsTitle: 'المهارات',
    servicesTitle: 'الخدمات',
    experienceTitle: 'الخبرات',
    educationTitle: 'التعليم',
    testimonialsTitle: 'شهادات',
    galleryTitle: 'معرض الصور',
    filesTitle: 'ملفات',
    contactTitle: 'تواصل',
    viewWorkCta: 'استعرض الأعمال',
    contactCta: 'تواصل معي',
    viewCaseStudy: 'عرض دراسة الحالة',
    viewProject: 'عرض المشروع',
    backToTop: 'عودة للأعلى',
    quickLinks: 'روابط سريعة',
    rightsReserved: 'جميع الحقوق محفوظة',
    developedBy: 'تم التطوير بواسطة',
  },
  en: {
    navOpen: 'Open menu',
    navClose: 'Close menu',
    workTitle: 'Featured work',
    workIntro: 'Case studies from recent work.',
    aboutTitle: 'About',
    brandsTitle: 'Brands I have worked with',
    skillsTitle: 'Skills',
    servicesTitle: 'Services',
    experienceTitle: 'Experience',
    educationTitle: 'Education',
    testimonialsTitle: 'Testimonials',
    galleryTitle: 'Gallery',
    filesTitle: 'Files',
    contactTitle: 'Contact',
    viewWorkCta: 'View featured work',
    contactCta: 'Get in touch',
    viewCaseStudy: 'View case study',
    viewProject: 'View Project',
    backToTop: 'Back to top',
    quickLinks: 'Quick links',
    rightsReserved: 'All rights reserved',
    developedBy: 'Developed by',
  },
}

const SECTION_LABELS: Record<string, { en: string; ar: string }> = {
  hero: { en: 'Home', ar: 'الرئيسية' },
  about: { en: 'About', ar: 'نبذة' },
  projects: { en: 'Work', ar: 'الأعمال' },
  skills: { en: 'Skills', ar: 'المهارات' },
  experience: { en: 'Experience', ar: 'الخبرة' },
  education: { en: 'Education', ar: 'التعليم' },
  services: { en: 'Services', ar: 'الخدمات' },
  clients: { en: 'Clients', ar: 'العملاء' },
  testimonials: { en: 'Testimonials', ar: 'التقييمات' },
  gallery: { en: 'Gallery', ar: 'المعرض' },
  files: { en: 'Files', ar: 'الملفات' },
  contact: { en: 'Contact', ar: 'تواصل' },
}

/** Section icon name → real lucide component via the shared map; unknown names render nothing. */
function sectionIcon(name: unknown, className = 'h-5 w-5') {
  if (typeof name !== 'string' || !name.trim()) return null
  const key = name.toLowerCase().trim()
  const clean = key.replace(/[^a-z0-9]/g, '')
  const Cmp = PORTFOLIO_ICON_MAP[clean] || PORTFOLIO_ICON_MAP[key]
  return Cmp ? <Cmp className={className} aria-hidden="true" /> : null
}

/** Returns a browser-safe URL, or null to render as plain text. */
function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const clean = sanitizeUrl(value)
  if (!clean || clean === '#') return null
  return clean
}

/** Splits "Sara Ahmed Adel" → ["Sara", "Ahmed Adel"] for the two-tone brand. */
function splitName(name: string): [string, string] {
  const trimmed = (name || '').trim()
  const i = trimmed.indexOf(' ')
  if (i <= 0) return [trimmed, '']
  return [trimmed.slice(0, i), trimmed.slice(i + 1)]
}

/** Contact link → href for the saved type (allow-list mirrors the schema). */
function contactHref(link: any): string | null {
  const type = typeof link?.type === 'string' ? link.type.toLowerCase() : ''
  const value = typeof link?.value === 'string' ? link.value : ''
  if (type === 'email') return value ? `mailto:${value}` : safeUrl(link?.url)
  if (type === 'phone') return value ? `tel:${value.replace(/[^\d+]/g, '')}` : safeUrl(link?.url)
  if (type === 'whatsapp') {
    const num = normalizeWhatsappNumber(value)
    if (num) {
      const url = safeUrl(`https://wa.me/${num.replace(/[^\d]/g, '')}`)
      if (url) return url
    }
    return safeUrl(link?.url)
  }
  const url = safeUrl(value) || safeUrl(link?.url)
  return url
}

/** Poster-first inline video step — same pattern as the shared project card. */
function EditorialVideoPreview({ src, title }: { src: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Play className="h-10 w-10 opacity-40" aria-hidden="true" />
      </div>
    )
  }
  if (playing) {
    return (
      <video src={src} controls autoPlay playsInline preload="metadata" className="h-full w-full bg-black object-contain">
        {title}
      </video>
    )
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={title} className={styles['emk__video-btn']}>
      <span className={styles['emk__video-play']} aria-hidden="true">
        <Play className="h-6 w-6" />
      </span>
      <span className={styles['emk__video-caption']}>{title}</span>
    </button>
  )
}

/**
 * Editorial Marketing template (Pro-only presentation option).
 *
 * Strictly presentation-only: all content derives from the SAME public
 * profile DTO the Classic template renders — home-page sections (schema
 * `portfolio-schemas` shapes), published project pages, and profile contact
 * links. Optional sections disappear when the customer has no content.
 * Invalid/missing data degrades to plain text — never to fabricated content.
 */
export function EditorialMarketingTemplate({
  profile,
  isFree = false,
  preview = false,
  onThemeChange: _onThemeChange,
}: EditorialMarketingTemplateProps) {
  // Retained for the shared component contract; the editorial design is
  // customer-palette-agnostic and has no visitor theme toggle.
  void isFree
  void _onThemeChange

  const appearance = (profile?.appearance || {}) as Record<string, unknown>
  const appearanceVars = useMemo(() => resolveEditorialAppearanceVars(appearance), [appearance])
  const actionButtons = (appearance.actionButtons || {}) as Record<string, unknown>
  const whatsappDigits = typeof actionButtons.whatsappNumber === 'string'
    ? normalizeWhatsappNumber(actionButtons.whatsappNumber)
    : ''
  const showWhatsapp = actionButtons.showWhatsapp !== false && Boolean(whatsappDigits)
  const showScrollTop = actionButtons.showScrollToTop !== false
  const avatarPosition = (() => {
    const value = appearance.avatarPosition as { x?: unknown; y?: unknown } | undefined
    const x = typeof value?.x === 'number' && Number.isFinite(value.x) ? Math.min(100, Math.max(0, value.x)) : 50
    const y = typeof value?.y === 'number' && Number.isFinite(value.y) ? Math.min(100, Math.max(0, value.y)) : 50
    return `${x}% ${y}%`
  })()
  const localized = (profile?.localized || {}) as any
  const langMode = getPortfolioLang(appearance)
  const lang: Lang = langMode === 'ar' ? 'ar' : 'en'
  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr'
  const L = copy[lang]
  const pick = (value: unknown): string => pickLang((value ?? null) as LocalizedValue, lang)

  /* ---------------------------- sections -------------------------------- */
  const sections = useMemo(() => {
    const pages = Array.isArray(profile?.pages) ? profile.pages : []
    const home = pages.find((p: any) => p?.slug === 'home') || pages[0]
    const raw: any[] = Array.isArray(home?.sections) ? home.sections : []
    return raw
      .filter(isSectionVisible)
      .sort((a, b) => (a?.sectionOrder ?? 0) - (b?.sectionOrder ?? 0))
  }, [profile])

  const byType = (type: string) => sections.find((s) => s?.sectionType === type)

  /* ---------------------------- identity -------------------------------- */
  const username: string = typeof profile?.username === 'string' ? profile.username : ''
  const displayName = String(pick(localized?.displayName) || profile?.displayName || profile?.username || '')
  const profileTitle = String(pick(localized?.professionalTitle) || profile?.professionalTitle || '')
  const profileBio = String(pick(localized?.bio) || profile?.bio || '')
  const profileLocation = String(pick(localized?.location) || profile?.location || '')
  const [brandA, brandB] = splitName(displayName)
  const avatarRaw = safeUrl(profile?.avatarUrl)
  const avatarSrc = avatarRaw ? portfolioImageUrl(avatarRaw, 640) : null

  const heroSection = byType('hero')
  const heroContent = (heroSection?.content || {}) as Record<string, any>
  const [heroFirst, heroRest] = splitName(pick(heroContent.name) || pick(heroContent.title) || displayName)
  const heroTitle = pick(heroContent.jobTitle) || profileTitle
  const heroIntro = pick(heroContent.description) || profileBio
  const heroBackground = safeUrl(heroContent.backgroundImage)
  const heroOverlay = typeof heroContent.overlayOpacity === 'number'
    ? Math.min(1, Math.max(0, heroContent.overlayOpacity))
    : 0.55
  const heroBackgroundPosition = (() => {
    const value = heroContent.backgroundPosition as { x?: unknown; y?: unknown } | undefined
    const x = typeof value?.x === 'number' ? Math.min(100, Math.max(0, value.x)) : 50
    const y = typeof value?.y === 'number' ? Math.min(100, Math.max(0, value.y)) : 50
    return `${x}% ${y}%`
  })()

  /* ----------------------------- clients -------------------------------- */
  const clientSection = byType('clients')
  const clientContent = (clientSection?.content || {}) as Record<string, any>
  const logoShape = clientContent.logoShape === 'square' || clientContent.logoShape === 'rounded'
    ? clientContent.logoShape
    : 'circle'
  const logoSize = clientContent.logoSize === 'sm' || clientContent.logoSize === 'lg' ? clientContent.logoSize : 'md'
  const logoClass = [
    styles['emk__logo-card'],
    styles[`emk__logo-card--${logoShape}`],
    styles[`emk__logo-card--${logoSize}`],
    clientContent.grayscale === false ? styles['emk__logo-card--color'] : '',
  ].filter(Boolean).join(' ')
  const brands = (Array.isArray(clientContent.items) ? clientContent.items : [])
    .map((item: any, i: number) => {
      const rawLogo = safeUrl(item?.logoUrl)
      const href = safeUrl(item?.url)
      return {
        key: item?.id ?? i,
        name: pick(item?.name) || String(item?.name ?? ''),
        logo: rawLogo ? portfolioImageUrl(rawLogo, 240) : null,
        href,
      }
    })
    .filter((b) => b.name || b.logo)

  /* ---------------------------- projects -------------------------------- */
  const projectsSection = byType('projects')
  const projectsContent = (projectsSection?.content || {}) as Record<string, any>
  const projectCards = (Array.isArray(profile?.projectPages) ? profile.projectPages : [])
    .filter((p: any) => p?.showInProjects !== false)
    .map((project: any) => {
      // Shared resolver keeps page/external semantics identical to Classic.
      const destination = resolveProjectCardDestination(project, {
        username,
        isFree,
        pages: profile?.projectPages,
      })
      const href = destination?.href ?? null
      const isPage = destination?.kind === 'page'
      const mainLabel =
        (typeof project.linkLabel === 'string' && project.linkLabel.trim()) ||
        (href ? L.viewProject : '')

      const extras = (Array.isArray(project.items) ? project.items : [])
        .map((item: any, i: number) => ({
          key: item?.id ?? i,
          label: String(item?.title || item?.label || item?.linkLabel || '').trim(),
          href: safeUrl(item?.externalUrl || item?.url),
        }))
        .filter((l: any) => l.label && l.href && /^https?:\/\//i.test(l.href as string))

      const visual = projectCardVisual(project)
      let media: Record<string, any> | null = null
      if (visual === 'file-icon') {
        const fileType = projectFileType(project)
        media = { kind: 'file', fileType, tone: getFileTypeStyle(fileType) }
      } else if (visual === 'video') {
        // Inline playback stays behind the same-origin R2 route check that
        // the shared video card uses; anything else renders as a plain tile.
        const raw = typeof project.content?.videoUrl === 'string' ? project.content.videoUrl : ''
        const src = /^\/api\/files\/r2\//.test(raw) ? raw : ''
        media = { kind: 'video', src, aspect: project.content?.videoAspect, title: project.title }
      } else if (visual !== 'none') {
        const raw = safeUrl(project.coverImage)
        const src = raw ? portfolioImageUrl(raw, 900) : null
        if (src) {
          media = { kind: 'image', src, fit: projectImageFit(project), aspect: project.content?.imageAspect }
        }
      }

      return {
        key: project.id,
        title: String(project.title || ''),
        description: typeof project.description === 'string' ? project.description : '',
        tags: Array.isArray(project.tags) ? project.tags.map(String).filter(Boolean) : [],
        media,
        href,
        isPage,
        mainLabel,
        extras,
      }
    })
    .filter((p: Record<string, any>) => p.title || p.media)

  /* ------------------------------ about --------------------------------- */
  const aboutSection = byType('about')
  const aboutContent = (aboutSection?.content || {}) as Record<string, any>
  const aboutHeading = pick(aboutContent.title) || L.aboutTitle
  const aboutText = pick(aboutContent.biography) || pick(aboutContent.text)
  const stats = (Array.isArray(aboutContent.stats) ? aboutContent.stats : [])
    .map((s: any, i: number) => ({
      key: i,
      value: typeof s?.value === 'string' ? s.value : '',
      label: typeof s?.label === 'string' ? s.label : pick(s?.label),
      icon: sectionIcon(s?.icon),
    }))
    .filter((s) => s.value || s.label)

  /* ------------------------------ skills -------------------------------- */
  const skillsSection = byType('skills')
  const skillsContent = (skillsSection?.content || {}) as Record<string, any>
  const skillsMode: 'chips' | 'bars' | 'both' =
    skillsContent.displayMode === 'bars' || skillsContent.displayMode === 'both'
      ? skillsContent.displayMode
      : 'chips'
  const skillGroups = (Array.isArray(skillsContent.groups) ? skillsContent.groups : [])
    .map((g: any, gi: number) => ({
      key: gi,
      title: pick(g?.title) || pick(g?.name),
      skills: (Array.isArray(g?.skills) ? g.skills : [])
        .map((s: any) => ({
          name: pick(s?.name) || String(s?.name ?? ''),
          pct: typeof s?.percentage === 'number' && Number.isFinite(s.percentage)
            ? Math.round(s.percentage)
            : null,
        }))
        .filter((s: any) => s.name),
    }))
    .filter((g) => g.title || g.skills.length > 0)
  const flatSkills = (Array.isArray(skillsContent.skills) ? skillsContent.skills : [])
    .map((s: unknown) => (typeof s === 'string' ? s : ''))
    .filter(Boolean)

  /* ----------------------------- services ------------------------------- */
  const servicesSection = byType('services')
  const servicesContent = (servicesSection?.content || {}) as Record<string, any>
  const builderServices = (Array.isArray(servicesContent.services) ? servicesContent.services : [])
    .map((s: any, i: number) => ({
      key: i,
      icon: sectionIcon(s?.icon),
      title: (typeof s?.title === 'string' ? s.title : pick(s?.title)) || '',
      description: (typeof s?.description === 'string' ? s.description : pick(s?.description)) || '',
      features: (Array.isArray(s?.features) ? s.features : []).map((f: unknown) => pick(f)).filter(Boolean),
    }))
    .filter((s) => s.title || s.description)
  const legacyServices = (Array.isArray(servicesContent.items) ? servicesContent.items : [])
    .map((s: any, i: number) => ({
      key: `legacy-${i}`,
      icon: null,
      title: (typeof s?.title === 'string' ? s.title : pick(s?.title)) || '',
      description: (typeof s?.description === 'string' ? s.description : pick(s?.description)) || '',
      features: [] as string[],
      price: typeof s?.price === 'string' ? s.price : '',
    }))
    .filter((s) => s.title || s.description)
  const services = [...builderServices, ...legacyServices]

  /* --------------------------- experience ------------------------------- */
  const experienceSection = byType('experience')
  const experienceContent = (experienceSection?.content || {}) as Record<string, any>
  const experienceMode = ['timeline', 'grid', 'list'].includes(experienceContent.displayMode)
    ? experienceContent.displayMode
    : 'timeline'
  const experienceLayoutClass = experienceMode === 'grid'
    ? styles['emk__timeline--grid']
    : experienceMode === 'list'
      ? styles['emk__timeline--list']
      : ''
  const experienceItems = (Array.isArray(experienceContent.items) ? experienceContent.items : [])
    .map((item: any, i: number) => {
      const isCurrent = Boolean(item?.isCurrent ?? item?.current)
      return {
        key: item?.id ?? i,
        period: formatExperienceRange(item?.startDate, item?.endDate, isCurrent, lang),
        jobTitle: (typeof item?.jobTitle === 'string' ? item.jobTitle : pick(item?.jobTitle)) || '',
        org: [
          (typeof item?.company === 'string' ? item.company : pick(item?.company)) ||
          (typeof item?.companyName === 'string' ? item.companyName : pick(item?.companyName)) || '',
          (typeof item?.location === 'string' ? item.location : pick(item?.location)) || '',
        ].filter(Boolean).join(' · '),
        description: (typeof item?.description === 'string' ? item.description : pick(item?.description)) || '',
      }
    })
    .filter((e) => e.jobTitle || e.org || e.description)

  /* ---------------------------- education ------------------------------- */
  const educationSection = byType('education')
  const educationContent = (educationSection?.content || {}) as Record<string, any>
  const educationItems = (Array.isArray(educationContent.items) ? educationContent.items : [])
    .map((item: any, i: number) => ({
      key: item?.id ?? i,
      date: (typeof item?.date === 'string' ? item.date : pick(item?.date)) || '',
      title: (typeof item?.title === 'string' ? item.title : pick(item?.title)) || '',
      institution: (typeof item?.institution === 'string' ? item.institution : pick(item?.institution)) || '',
      description: (typeof item?.description === 'string' ? item.description : pick(item?.description)) || '',
      image: (() => {
        const raw = safeUrl(item?.image)
        return raw ? portfolioImageUrl(raw, 900) : null
      })(),
    }))
    .filter((e) => e.title || e.institution)

  /* --------------------------- testimonials ----------------------------- */
  const testimonialsSection = byType('testimonials')
  const testimonialsContent = (testimonialsSection?.content || {}) as Record<string, any>
  const testimonialItems = (Array.isArray(testimonialsContent.items) ? testimonialsContent.items : [])
    .map((item: any, i: number) => {
      const rawPhoto = safeUrl(item?.photoUrl)
      const rating = typeof item?.rating === 'number' ? item.rating : null
      return {
        key: item?.id ?? i,
        name: (typeof item?.name === 'string' ? item.name : pick(item?.name)) ||
          (typeof item?.author === 'string' ? item.author : ''),
        role: (typeof item?.title === 'string' ? item.title : pick(item?.title)) ||
          (typeof item?.role === 'string' ? item.role : ''),
        text: pick(item?.text) || (typeof item?.body === 'string' ? item.body : ''),
        photo: rawPhoto ? portfolioImageUrl(rawPhoto, 96) : null,
        rating: rating !== null ? Math.max(0, Math.min(5, Math.round(rating))) : null,
      }
    })
    .filter((t) => t.name || t.text || t.role)

  /* ------------------------------ gallery ------------------------------- */
  const gallerySection = byType('gallery')
  const galleryContent = (gallerySection?.content || {}) as Record<string, any>
  const galleryItems = (Array.isArray(galleryContent.items) ? galleryContent.items : [])
    .map((item: any, i: number) => {
      const raw = safeUrl(item?.imageUrl) || safeUrl(item?.url)
      return {
        key: item?.id ?? i,
        src: raw ? portfolioImageUrl(raw, 900) : null,
        caption: (typeof item?.caption === 'string' ? item.caption : pick(item?.caption)) || '',
      }
    })
    .filter((g) => g.src)

  /* ------------------------------- files -------------------------------- */
  const filesSection = byType('files')
  const filesContent = (filesSection?.content || {}) as Record<string, any>
  const fileItems = (Array.isArray(filesContent.items) ? filesContent.items : [])
    .map((item: any, i: number) => ({
      key: item?.id ?? i,
      label: (typeof item?.label === 'string' ? item.label : pick(item?.label)) || '',
      href: safeUrl(item?.externalUrl) || safeUrl(item?.url),
    }))
    .filter((f) => f.label || f.href)

  /* --------------------------- custom pages ----------------------------- */
  const customSections = sections.filter((s) => s?.sectionType === 'custom')

  /* ------------------------------ contact ------------------------------- */
  const contactSection = byType('contact')
  const contactContent = (contactSection?.content || {}) as Record<string, any>
  const contactLinkRows: any[] = Array.isArray(contactContent.links) && contactContent.links.length > 0
    ? contactContent.links
    : (Array.isArray(profile?.contactLinks) ? profile.contactLinks : [])
  const contactItems = contactLinkRows
    .map((link: any, i: number) => {
      const href = contactHref(link)
      const label = (typeof link?.label === 'string' && link.label.trim()) ? link.label : pick(link?.label)
      const type = String(link?.type || link?.platform || '')
      return {
        key: link?.id ?? i,
        href,
        label: label || type,
        display: typeof link?.value === 'string' ? link.value : '',
        icon: getContactIcon(type || label, 'h-5 w-5 shrink-0'),
        external: !/^(mailto:|tel:)/.test(href || ''),
      }
    })
    .filter((c) => c.href && (c.display || c.label))

  /* --------------------------------------------------------------
   * Which optional sections actually render. A section that exists
   * but carries no data for this template's layout stays invisible.
   * -------------------------------------------------------------- */
  const presence = {
    clients: Boolean(clientSection) && brands.length > 0,
    projects: Boolean(projectsSection) && projectCards.length > 0,
    about: Boolean(aboutSection) && (aboutText.length > 0 || stats.length > 0),
    skills: Boolean(skillsSection) && (skillGroups.length > 0 || flatSkills.length > 0),
    services: Boolean(servicesSection) && services.length > 0,
    experience: Boolean(experienceSection) && experienceItems.length > 0,
    education: Boolean(educationSection) && educationItems.length > 0,
    testimonials: Boolean(testimonialsSection) && testimonialItems.length > 0,
    gallery: Boolean(gallerySection) && galleryItems.length > 0,
    files: Boolean(filesSection) && fileItems.length > 0,
    contact: Boolean(contactSection) && contactItems.length > 0,
  }

  /* ------------------------------ footer -------------------------------- */
  const footerSection = byType('footer')
  const footerContent = (footerSection?.content || {}) as Record<string, any>
  const footerHeadline = pick(footerContent.headline) || pick(footerContent.title) || displayName
  const footerLead =
    pick(footerContent.subheading) ||
    (footerContent.description ? pick(footerContent.description) : '')
  const footerSocialRows: any[] = Array.isArray(footerContent.links) && footerContent.links.length > 0
    ? footerContent.links
    : (Array.isArray(profile?.contactLinks) ? profile.contactLinks : [])
  const footerSocial = footerSocialRows
    .map((link: any, i: number) => {
      const href = contactHref(link)
      const platform = String(link?.platform || link?.type || '')
      const label = (typeof link?.label === 'string' && link.label.trim()) ? link.label : pick(link?.label)
      return {
        key: link?.id ?? i,
        href,
        label: platform || label,
        icon: href
          ? (/^(email|phone|whatsapp|website)$/i.test(platform) || /email|phone|whatsapp/i.test(label))
            ? getContactIcon(platform || label, 'h-5 w-5')
            : getSocialIcon(platform, 'h-5 w-5')
          : null,
      }
    })
    .filter((s) => s.href && s.icon)
    .slice(0, 8)

  const quickLinks = (['projects', 'about', 'skills', 'services', 'gallery', 'files', 'contact'] as const)
    .filter((k) => presence[k])
    .map((k) => ({ href: k === 'contact' ? '#contact-info' : `#${k}`, label: SECTION_LABELS[k][lang] }))

  const sectionOrderOf = (type: string, fallback = 500) =>
    sections.find((s) => s?.sectionType === type)?.sectionOrder ?? fallback

  /* ------------------------------ chrome -------------------------------- */
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Hero CTAs: respect saved targets when provided; neutral anchors otherwise.
  const savedCtas = (Array.isArray(heroContent.cta) ? heroContent.cta : [])
    .map((c: any, i: number) => ({
      key: i,
      label: typeof c?.label === 'string' ? c.label : '',
      href: safeUrl(c?.target) || '',
    }))
    .filter((c) => c.label && c.href)
  const heroCtas = savedCtas.length > 0
    ? savedCtas
    : ([
        presence.projects ? { key: 'work', label: L.viewWorkCta, href: '#projects' } : null,
        presence.contact ? { key: 'contact', label: L.contactCta, href: '#contact-info' } : null,
      ].filter(Boolean) as { key: string; label: string; href: string }[])

  const year = useMemo(() => new Date().getFullYear(), [])

  const backToTop = () => {
    if (typeof document !== 'undefined') {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div id="top" className={`${styles['emk']} ${playfair.variable}`} style={appearanceVars} dir={dir} lang={lang}>
      {/* ───────────────────────────── header ─────────────────────────── */}
      <header className={`${styles['emk__header']} ${scrolled ? styles['emk__header--scrolled'] : ''}`}>
        <div className={`${styles['emk__container']} ${styles['emk__header-inner']}`}>
          <Link href={username ? `/u/${username}` : '#'} className={styles['emk__brand']}>
            {brandA}
            {brandB ? <em> {brandB}</em> : null}
          </Link>
          <nav aria-label={quickLinks.map((l) => l.label).join(' · ') || 'Navigation'}>
            <div className={styles['emk__nav']}>
              {quickLinks.map((l) => (
                <Link key={l.href} href={l.href} className={styles['emk__nav-link']}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
          <button
            type="button"
            className={styles['emk__toggle']}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? L.navClose : L.navOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        <div className={`${styles['emk__drawer']} ${menuOpen ? styles['emk__drawer--open'] : ''}`}>
          {quickLinks.map((l) => (
            <a key={l.href} href={l.href} className={styles['emk__drawer-item']} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </div>
      </header>

      {/* ────────────────────────────── hero ─────────────────────────── */}
      <section
        id="hero"
        className={styles['emk__hero']}
        style={heroBackground ? {
          backgroundImage: `url("${heroBackground}")`,
          backgroundSize: 'cover',
          backgroundPosition: heroBackgroundPosition,
        } : undefined}
      >
        {heroBackground ? (
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: '#1b1512', opacity: heroOverlay }}
          />
        ) : null}
        <div className={`${styles['emk__container']} ${styles['emk__hero-grid']}`} style={{ position: 'relative', zIndex: 1 }}>
          <div>
            {heroTitle ? <p className={styles['emk__eyebrow']}>{heroTitle}</p> : null}
            <h1 className={styles['emk__name']}>
              {heroFirst}
              {heroRest ? <em> {heroRest}</em> : null}
            </h1>
            {heroIntro ? <p className={styles['emk__intro']}>{heroIntro}</p> : null}
            {heroCtas.length > 0 && (
              <div className={styles['emk__cta']}>
                {heroCtas.map((c, i) => (
                  <a
                    key={c.key}
                    href={c.href}
                    onClick={(e) => { if (preview) e.preventDefault() }}
                    className={`${styles['emk__btn']} ${i === 0 ? styles['emk__btn--primary'] : styles['emk__btn--ghost']}`}
                    {...(c.href.startsWith('#') ? {} : { target: '_blank', rel: 'noreferrer' })}
                  >
                    {c.label}
                    {c.href.startsWith('#') ? (
                      <ArrowRight size={16} className="rtl:-scale-x-100" aria-hidden="true" />
                    ) : (
                      <ExternalLink size={16} aria-hidden="true" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
          {avatarSrc && (
            <div className={styles['emk__portrait-wrap']}>
              <figure className={styles['emk__portrait']}>
                <img src={avatarSrc} alt={displayName || heroFirst} loading="eager" decoding="async" style={{ objectPosition: avatarPosition }} />
                <figcaption className={styles['emk__portrait-cap']}>
                  <strong>{heroTitle || profileLocation || displayName}</strong>
                  {heroTitle && profileLocation ? <span>{profileLocation}</span> : null}
                </figcaption>
              </figure>
            </div>
          )}
        </div>
      </section>

      <main style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ──────────────────────────── clients ───────────────────────── */}
        {presence.clients && (
          <section id="clients" style={{ order: sectionOrderOf('clients') }} className={`${styles['emk__section']} ${styles['emk__section--alt']}`}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(clientContent.title) || L.brandsTitle} intro={pick(clientContent.description) || undefined} />
              <div className={styles['emk__logo-grid']}>
                {brands.map((b) => {
                  const inner = b.logo
                    ? <img src={b.logo} alt={b.name} loading="lazy" decoding="async" />
                    : <span className={styles['emk__logo-name']}>{b.name}</span>
                  return b.href ? (
                    <a
                      key={String(b.key)}
                      href={b.href}
                      target="_blank"
                      rel="noreferrer"
                      className={logoClass}
                      title={b.name}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={String(b.key)} className={logoClass} title={b.name}>
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ──────────────────────────── work ──────────────────────────── */}
        {presence.projects && (
          <section id="projects" style={{ order: sectionOrderOf('projects') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead
                title={pick(projectsContent.title) || L.workTitle}
                intro={pick(projectsContent.description) || pick(projectsContent.subtitle) || L.workIntro}
              />
              <div className={`${styles['emk__project-grid']} ${projectsContent.displayMode === 'list' ? styles['emk__project-grid--list'] : ''}`}>
                {projectCards.map((p: Record<string, any>, i: number) => {
                  const aspect = p.media && p.media.kind !== 'file'
                    ? aspectRatioValue(p.media.aspect) ?? null
                    : null
                  return (
                    <article key={p.key ?? i} className={styles['emk__project-card']}>
                      {p.media && (
                        <div
                          className={styles['emk__project-media']}
                          style={aspect ? { aspectRatio: aspect } : undefined}
                        >
                          {p.media.kind === 'image' ? (
                            <img
                              src={p.media.src}
                              alt={p.title}
                              loading="lazy"
                              decoding="async"
                              style={p.media.fit === 'contain' ? { objectFit: 'contain' as const } : undefined}
                            />
                          ) : null}
                          {p.media.kind === 'video' ? (
                            <EditorialVideoPreview src={p.media.src} title={String(p.media.title || '')} />
                          ) : null}
                          {p.media.kind === 'file' ? (
                            <div
                              className={styles['emk__file-tile']}
                              style={{ backgroundColor: p.media.tone.bg, color: p.media.tone.text }}
                            >
                              <ProjectFileIcon fileType={p.media.fileType} className="h-9 w-9" />
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div className={styles['emk__project-body']}>
                        {p.tags.length > 0 ? (
                          <p className={styles['emk__project-tag']}>{p.tags[0]}</p>
                        ) : null}
                        <h3 className={styles['emk__project-title']}>{p.title}</h3>
                        {p.description ? <p className={styles['emk__project-desc']}>{p.description}</p> : null}
                        {p.tags.length > 1 && (
                          <div className={styles['emk__project-badges']}>
                            {p.tags.slice(1, 4).map((t: string) => (
                              <span key={t} className={styles['emk__project-badge']}>{t}</span>
                            ))}
                          </div>
                        )}
                        {p.href ? (
                          p.isPage ? (
                            <Link href={p.href} onClick={(e) => { if (preview) e.preventDefault() }} aria-label={`${p.mainLabel}: ${p.title}`}
                              className={styles['emk__project-link']}>
                              {p.mainLabel}
                              <ArrowRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
                            </Link>
                          ) : (
                            <a href={p.href} target="_blank" rel="noreferrer" onClick={(e) => { if (preview) e.preventDefault() }} aria-label={`${p.mainLabel}: ${p.title}`}
                              className={styles['emk__project-link']}>
                              {p.mainLabel}
                              <ExternalLink size={15} aria-hidden="true" />
                            </a>
                          )
                        ) : null}
                        {p.extras.length > 0 && (
                          <div className={styles['emk__project-extras']}>
                            {p.extras.map((l: Record<string, any>) => (
                              <a
                                key={String(l.key)}
                                href={l.href}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => { if (preview) e.preventDefault() }}
                                className={styles['emk__project-badge']}
                              >
                                {l.label}
                                <ExternalLink size={12} aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ──────────────────────────── about ─────────────────────────── */}
        {presence.about && (
          <section id="about" style={{ order: sectionOrderOf('about') }} className={`${styles['emk__section']} ${styles['emk__section--alt']}`}>
            <div className={styles['emk__container']}>
              <div className={styles['emk__about-grid']}>
                <div>
                  <SectionHead title={aboutHeading} />
                  {aboutText ? <p className={styles['emk__about-text']}>{aboutText}</p> : null}
                </div>
                {stats.length > 0 && (
                  <div className={styles['emk__stats']}>
                    {stats.map((s) => (
                      <div key={s.key} className={styles['emk__stat-card']}>
                        {s.icon}
                        <p className={styles['emk__stat-number']}>{s.value}</p>
                        <p className={styles['emk__stat-label']}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ──────────────────────────── skills ────────────────────────── */}
        {presence.skills && (
          <section id="skills" style={{ order: sectionOrderOf('skills') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(skillsContent.title) || pick(skillsContent.heading) || L.skillsTitle} intro={pick(skillsContent.description) || undefined} />
              {skillGroups.length > 0 ? (
                <div className={styles['emk__grid-2']}>
                  {skillGroups.map((g) => (
                    <div key={g.key} className={styles['emk__skill-card']}>
                      <h3 className={styles['emk__skill-title']}>{g.title || L.skillsTitle}</h3>
                      {skillsMode !== 'bars' && (
                        <div className={styles['emk__skill-list']}>
                          {g.skills.map((s: any, i: number) => (
                            <span key={i} className={styles['emk__skill-pill']}>
                              {s.name}
                              {s.pct !== null ? ` · ${s.pct}%` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {skillsMode !== 'chips' && g.skills.some((s: any) => s.pct !== null) && (
                        <div className={styles['emk__skill-bar']}>
                          {g.skills.filter((s: any) => s.pct !== null).map((s: any, i: number) => (
                            <div key={`bar-${i}`}>
                              <div className="flex items-center justify-between text-[11px] text-[var(--emk-ink-muted)]">
                                <span>{s.name}</span>
                                <span>{s.pct}%</span>
                              </div>
                              <div className={styles['emk__skill-bar-track']}>
                                <div className={styles['emk__skill-bar-fill']} style={{ width: `${s.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles['emk__skill-list']}>
                  {flatSkills.map((s, i) => (
                    <span key={i} className={styles['emk__skill-pill']}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ──────────────────────────── services ──────────────────────── */}
        {presence.services && (
          <section id="services" style={{ order: sectionOrderOf('services') }} className={`${styles['emk__section']} ${styles['emk__section--alt']}`}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(servicesContent.title) || L.servicesTitle} intro={pick(servicesContent.description) || undefined} />
              <div className={styles['emk__grid-2']}>
                {services.map((s) => (
                  <div key={String(s.key)} className={styles['emk__service-card']}>
                    {s.icon}
                    <h3 className={styles['emk__service-title']}>{s.title}</h3>
                    {s.description ? <p className={styles['emk__service-desc']}>{s.description}</p> : null}
                    {s.features.length > 0 && (
                      <ul>
                        {s.features.map((f: string, i: number) => (
                          <li key={i} className={styles['emk__service-feature']}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────────── experience ─────────────────────── */}
        {presence.experience && (
          <section id="experience" style={{ order: sectionOrderOf('experience') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead
                title={pick(experienceContent.title) || pick(experienceContent.heading) || L.experienceTitle}
                intro={pick(experienceContent.description) || undefined}
              />
              <div className={`${styles['emk__timeline']} ${experienceLayoutClass}`}>
                {experienceItems.map((e) => (
                  <article key={String(e.key)} className={styles['emk__entry']}>
                    {e.period ? <p className={styles['emk__entry-period']}>{e.period}</p> : null}
                    <h3 className={styles['emk__entry-title']}>{e.jobTitle}</h3>
                    {e.org ? <p className={styles['emk__entry-org']}>{e.org}</p> : null}
                    {e.description ? <p className={styles['emk__entry-desc']}>{e.description}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────────── education ──────────────────────── */}
        {presence.education && (
          <section id="education" style={{ order: sectionOrderOf('education') }} className={`${styles['emk__section']} ${styles['emk__section--alt']}`}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(educationContent.title) || L.educationTitle} intro={pick(educationContent.description) || undefined} />
              <div className={styles['emk__timeline']}>
                {educationItems.map((e) => (
                  <article key={String(e.key)} className={styles['emk__entry']}>
                    {e.date ? <p className={styles['emk__entry-period']}>{e.date}</p> : null}
                    <h3 className={styles['emk__entry-title']}>{e.title}</h3>
                    {e.institution ? <p className={styles['emk__entry-org']}>{e.institution}</p> : null}
                    {e.description ? <p className={styles['emk__entry-desc']}>{e.description}</p> : null}
                    {e.image ? (
                      <img
                        src={e.image}
                        alt={e.title}
                        loading="lazy"
                        decoding="async"
                        className={styles['emk__entry-media']}
                      />
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────────────────────── testimonials ─────────────────────── */}
        {presence.testimonials && (
          <section id="testimonials" style={{ order: sectionOrderOf('testimonials') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(testimonialsContent.title) || L.testimonialsTitle} intro={pick(testimonialsContent.subtitle) || pick(testimonialsContent.description) || undefined} />
              <div className={styles['emk__grid-2']}>
                {testimonialItems.map((t) => (
                  <figure key={String(t.key)} className={styles['emk__quote-card']}>
                    {t.text ? <blockquote className={styles['emk__quote-body']}>{t.text}</blockquote> : null}
                    <figcaption className={styles['emk__quote-meta']}>
                      {t.photo && (
                        <img src={t.photo} alt={t.name} loading="lazy" decoding="async" className={styles['emk__quote-photo']} />
                      )}
                      <div>
                        {t.name ? <p className={styles['emk__quote-author']}>{t.name}</p> : null}
                        {t.role ? <p className={styles['emk__quote-role']}>{t.role}</p> : null}
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─────────────────────────── gallery ────────────────────────── */}
        {presence.gallery && (
          <section id="gallery" style={{ order: sectionOrderOf('gallery') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(galleryContent.title) || L.galleryTitle} intro={pick(galleryContent.description) || undefined} />
              <div className={styles['emk__gallery-grid']}>
                {galleryItems.map((g) => (
                  <figure key={String(g.key)} className={styles['emk__gallery-item']}>
                    <img src={g.src as string} alt={g.caption} loading="lazy" decoding="async" />
                    {g.caption ? <figcaption className={styles['emk__gallery-cap']}>{g.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────────────────────────── files ────────────────────────── */}
        {presence.files && (
          <section id="files" style={{ order: sectionOrderOf('files') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead title={pick(filesContent.title) || L.filesTitle} intro={pick(filesContent.description) || undefined} />
              <div className={styles['emk__file-list']}>
                {fileItems.map((f) => {
                  const inner = (
                    <>
                      <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className={styles['emk__file-name']}>{f.label || f.href}</span>
                    </>
                  )
                  return f.href ? (
                    <a
                      key={String(f.key)}
                      href={f.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles['emk__file-card']}
                      aria-label={f.label || f.href}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={String(f.key)} className={styles['emk__file-card']}>
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ───────────────────────── custom pages ─────────────────────── */}
        {customSections.map((section) => {
          const c = (section.content || {}) as Record<string, any>
          const cards = (Array.isArray(c.cards) ? c.cards : [])
            .filter((card: any) => card?.title || card?.description)
          const paragraphs = (Array.isArray(c.paragraphs) ? c.paragraphs : []).map(String).filter(Boolean)
          if (!pick(c.title) && cards.length === 0 && paragraphs.length === 0) return null
          return (
            <section
              key={section.id}
              id={`custom-${section.id}`}
              style={{ order: section.sectionOrder ?? 900 }}
              className={`${styles['emk__section']} ${styles['emk__section--alt']}`}
            >
              <div className={styles['emk__container']}>
                <SectionHead title={pick(c.title) || ''} intro={pick(c.description) || undefined} />
                {cards.length > 0 ? (
                  <div className={styles['emk__grid-2']}>
                    {cards.map((card: any, i: number) => {
                      const imgRaw = safeUrl(card?.image)
                      const img = imgRaw ? portfolioImageUrl(imgRaw, 480) : null
                      const href = safeUrl(card?.linkUrl)
                      const inner = (
                        <>
                          {img && (
                            <img
                              src={img}
                              alt={pick(card?.title) || ''}
                              loading="lazy"
                              decoding="async"
                              className={styles['emk__custom-image']}
                            />
                          )}
                          <h3 className={styles['emk__service-title']}>{pick(card?.title)}</h3>
                          {card?.description ? <p className={styles['emk__service-desc']}>{pick(card.description)}</p> : null}
                        </>
                      )
                      return href ? (
                        <a
                          key={card?.id ?? i}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className={styles['emk__service-card']}
                        >
                          {inner}
                          {pick(card?.linkLabel) ? (
                            <span className={styles['emk__project-link']}>
                              {pick(card.linkLabel)}
                              <ArrowRight size={15} className="rtl:-scale-x-100" aria-hidden="true" />
                            </span>
                          ) : null}
                        </a>
                      ) : (
                        <div key={card?.id ?? i} className={styles['emk__service-card']}>{inner}</div>
                      )
                    })}
                  </div>
                ) : paragraphs.length > 0 ? (
                  <div className={styles['emk__about-text']}>
                    {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                ) : null}
              </div>
            </section>
          )
        })}

        {/* ──────────────────────────── contact ───────────────────────── */}
        {presence.contact && (
          <section id="contact-info" style={{ order: sectionOrderOf('contact') }} className={styles['emk__section']}>
            <div className={styles['emk__container']}>
              <SectionHead
                title={pick(contactContent.headline) || pick(contactContent.title) || L.contactTitle}
                intro={pick(contactContent.description) || pick(contactContent.subheading) || undefined}
              />
              <div className={styles['emk__contact-list']}>
                {contactItems.map((c, i) => (
                  <a
                    key={c.key ?? i}
                    href={c.href as string}
                    title={c.display || c.label}
                    className={styles['emk__contact-card']}
                    {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {c.icon}
                    <span className={styles['emk__contact-text']}>
                      <span className={styles['emk__contact-label']}>{c.label}</span>
                      <span className={styles['emk__contact-value']}>{c.display || c.label}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ───────────────────────────── footer ────────────────────────── */}
      <footer id="contact" className={styles['emk__footer']}>
        <div className={styles['emk__container']}>
          <div className={styles['emk__footer-grid']}>
            <div>
              <p className={styles['emk__footer-title']}>{footerHeadline}</p>
              {footerLead ? <p className={styles['emk__footer-lead']}>{footerLead}</p> : null}
              {profileLocation ? <p className={styles['emk__footer-lead']}>{profileLocation}</p> : null}
              {footerSocial.length > 0 && (
                <div className={styles['emk__footer-social']}>
                  {footerSocial.map((s) => (
                    <a
                      key={String(s.key)}
                      href={s.href as string}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      className={styles['emk__footer-social-link']}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {quickLinks.length > 0 && (
              <nav aria-label={L.quickLinks}>
                <p className={styles['emk__footer-heading']}>{L.quickLinks}</p>
                <ul>
                  {quickLinks.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={styles['emk__footer-link']}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {contactItems.length > 0 && (
              <div>
                <p className={styles['emk__footer-heading']}>{L.contactTitle}</p>
                <ul>
                  {contactItems.slice(0, 4).map((c) => (
                    <li key={c.key ?? c.display}>
                      <a
                        href={c.href as string}
                        className={styles['emk__footer-link']}
                        title={c.display || c.label}
                      >
                        {c.display || c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className={styles['emk__footer-bar']}>
            <p>© {year} {displayName}. {L.rightsReserved}</p>
            <p className={styles['emk__footer-credit']}>
              {L.developedBy}{' '}
              <a href="https://portfolio-hub.online" target="_blank" rel="noopener noreferrer">
                Portfolio Hub
              </a>
            </p>
            <button type="button" className={styles['emk__footer-top']} onClick={backToTop}>
              {L.backToTop}
              <ArrowUp size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>

      {(showWhatsapp || showScrollTop) && (
        <div className={styles['emk__actions']}>
          {showWhatsapp ? (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              className={styles['emk__action-btn']}
              aria-label="WhatsApp"
              title="WhatsApp"
              onClick={() => trackPortfolioEvent(profile?.username, 'whatsapp_click')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          ) : null}
          {showScrollTop ? (
            <button
              type="button"
              className={styles['emk__action-btn']}
              aria-label={L.backToTop}
              title={L.backToTop}
              onClick={backToTop}
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function SectionHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className={styles['emk__section-head']}>
      {title ? <h2 className={styles['emk__section-title']}>{title}</h2> : null}
      {intro ? <p className={styles['emk__section-intro']}>{intro}</p> : null}
    </div>
  )
}

export default EditorialMarketingTemplate
