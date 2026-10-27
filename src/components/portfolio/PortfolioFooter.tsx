'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import type { MouseEvent } from 'react'
import { ArrowRight, ArrowUp, Briefcase, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { normalizeWhatsappNumber } from '@/lib/whatsapp'

/**
 * Footer labels for sections that have no editable heading. Shared by every
 * footer (portfolio + project page) so link labels never leak raw section ids.
 */
export const SECTION_LABELS: Record<string, { en: string; ar: string }> = {
  hero: { en: 'Home', ar: 'الرئيسية' },
  about: { en: 'About', ar: 'نبذة' },
  projects: { en: 'Projects', ar: 'الأعمال' },
  skills: { en: 'Skills', ar: 'المهارات' },
  experience: { en: 'Experience', ar: 'الخبرة' },
  education: { en: 'Education', ar: 'التعليم' },
  services: { en: 'Services', ar: 'الخدمات' },
  clients: { en: 'Clients', ar: 'العملاء' },
  testimonials: { en: 'Testimonials', ar: 'التقييمات' },
  contact: { en: 'Contact', ar: 'تواصل' },
  custom: { en: 'More', ar: 'المزيد' },
}

// Word-safe string truncation that avoids cutting words in half.
export function wordSafeTruncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || ''
  const trimmed = text.slice(0, maxLen)
  const lastSpace = trimmed.lastIndexOf(' ')
  return lastSpace > 0 ? trimmed.slice(0, lastSpace) + '…' : trimmed + '…'
}

export function getContactIcon(label: string, className = 'h-5 w-5') {
  const l = label.toLowerCase()
  if (l.includes('email') || l.includes('mail')) return <Mail className={className} aria-hidden="true" />
  if (l.includes('whatsapp') || l.includes('phone')) return <Phone className={className} aria-hidden="true" />
  if (l.includes('linkedin')) return <Briefcase className={className} aria-hidden="true" />
  return <Globe className={className} aria-hidden="true" />
}

export function getSocialIcon(platform: string, className = 'h-5 w-5') {
  const p = platform.toLowerCase()
  const svgProps = { className, fill: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': true as const }
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
  return <Globe className={className} aria-hidden="true" />
}

export type PortfolioFooterProps = {
  profile: any
  /** Visible portfolio sections (footer excluded from Quick Links internally). */
  sections: any[]
  /** The footer section content (links, headline, description). */
  footerContent?: any
  lang: 'ar' | 'en'
  t: (value: unknown) => string
  displayName: string
  role?: string
  bio?: string
  localizedLocation?: string
  contactLinks?: any[]
  whatsappNumber?: string
  /** '' keeps in-page anchors; a path prefixes them (project page/public). */
  linkPrefix?: string
  showScrollToTop?: boolean
  onScrollToTop?: () => void
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  id?: string
}

export function PortfolioFooter({
  profile,
  sections,
  footerContent,
  lang,
  t,
  displayName,
  role,
  bio,
  localizedLocation,
  contactLinks,
  whatsappNumber,
  linkPrefix = '',
  showScrollToTop = false,
  onScrollToTop,
  onLinkClick,
  id = 'contact',
}: PortfolioFooterProps) {
  const c = footerContent || {}
  const footerSocialLinks = (c.links && c.links.length > 0) ? c.links : (contactLinks || [])

  // ── Column 1 · Identity — real profile data only ────────────────
  const heroSection = sections.find((s: any) => s.sectionType === 'hero')
  const heroSubtitle = t(heroSection?.content?.subtitle)
  const aboutSection = sections.find((s: any) => s.sectionType === 'about')
  const aboutC = aboutSection?.content || {}
  const aboutBioRaw = t(aboutC.biography) || t(aboutC.text)
  const bioShort = typeof aboutBioRaw === 'string'
    ? wordSafeTruncate(aboutBioRaw.replace(/\s+/g, ' ').trim(), 140)
    : ''
  const effectiveRole = role || heroSubtitle
  const rawBio = typeof bio === 'string' ? bio : (typeof profile.bio === 'string' ? profile.bio : '')
  const shortBio = bioShort || (rawBio ? wordSafeTruncate(rawBio.replace(/\s+/g, ' ').trim(), 140) : '')

  // ── Column 2 · Quick Links — only sections that exist on the page ──
  const anchorFor = (s: any) =>
    s.sectionType === 'hero'
      ? '#hero'
      : s.sectionType === 'custom'
        ? `#custom-${s.id}`
        : `#${s.sectionType}`
  const resolveHref = (href: string) => (linkPrefix ? `${linkPrefix}${href}` : href)

  const quickLinks: { label: string; href: string }[] = sections
    .filter((s: any) => s.sectionType !== 'footer')
    .map((s: any) => {
      const customLabel = t(s.content?.title)
      const fallback = SECTION_LABELS[s.sectionType]
      return {
        label: customLabel || (fallback ? fallback[lang] : s.sectionType),
        href: resolveHref(anchorFor(s)),
      }
    })
  const contactHref = resolveHref('#contact')
  if (!quickLinks.some((l) => l.href === contactHref)) {
    quickLinks.push({ label: SECTION_LABELS.contact[lang], href: contactHref })
  }

  // ── Column 3 · Get In Touch — email / whatsapp / location ─────────
  const contactArr = Array.isArray(c.links) && c.links.length > 0 ? c.links : (contactLinks || [])
  const findContact = (keys: string[]) =>
    contactArr.find((l: any) => {
      const kind = String(l.type || l.platform || l.label || '').toLowerCase()
      return keys.some((k) => kind.includes(k))
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
  const locVal = localizedLocation || profile.location || ''
  const hasContactCol = Boolean(emailHref || waHref || locVal)

  // Saved footer headline/subheading — the exact fields the builder edits.
  const heading = t(c.headline)
  const subheading = t(c.subheading)
  const footerDescription = t(c.description)
  const ctaHref = emailHref || waHref || contactHref

  // Footer follows the active theme: the page surface (light or dark) with
  // theme-aware text and hairlines, so it always matches the portfolio rather
  // than sitting on a fixed coloured band. Explicit `footerBg` / `footerText`
  // values from older profiles still win when present.
  const appearance = profile.appearance || {}
  const footerBg = appearance.footerBg || 'var(--color-bg)'
  const footerOverride = appearance.footerText || ''
  const footerText = footerOverride || 'var(--color-text)'
  const footerMuted = footerOverride || 'var(--color-muted)'
  const footerBorder = footerOverride
    ? `color-mix(in srgb, ${footerOverride} 22%, transparent)`
    : 'var(--color-border)'
  const footerSocialBorder = footerOverride
    ? `color-mix(in srgb, ${footerOverride} 30%, transparent)`
    : 'color-mix(in srgb, var(--color-text) 22%, transparent)'
  const footerSocialBg = footerOverride
    ? `color-mix(in srgb, ${footerOverride} 10%, transparent)`
    : 'color-mix(in srgb, var(--color-text) 7%, transparent)'
  const year = new Date().getFullYear()
  const cairoLink = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap'

  return (
    <React.Fragment>
      <link rel="stylesheet" href={cairoLink} />
      <footer
        id={id}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        data-testid="portfolio-footer"
        className="border-t pt-12 pb-8 cq-sm:pt-16"
        style={{
          background: footerBg,
          color: footerText,
          borderTopColor: footerBorder,
          fontFamily: lang === 'ar'
            ? "'Cairo', system-ui, -apple-system, sans-serif"
            : 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6 cq-sm:px-12">
          {/* ── Columns (2 or 3 depending on whether contact info exists) ── */}
          <div className={`grid grid-cols-1 gap-10 text-center ${hasContactCol ? 'cq-md:grid-cols-[1.5fr_1fr_1.3fr]' : 'cq-md:grid-cols-[1.5fr_1fr]'} cq-md:gap-12 cq-md:text-start`}>

            {/* Column 1 · Identity */}
            <div>
              <p className="break-words text-xl font-bold tracking-tight cq-sm:text-2xl" style={{ color: footerText }}>
                {displayName}
              </p>
              {effectiveRole && (
                <p className="mt-1.5 text-sm font-medium break-words" style={{ color: footerText }}>
                  {effectiveRole}
                </p>
              )}
              {shortBio && (
                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed break-words cq-md:mx-0" style={{ color: footerMuted }}>
                  {shortBio}
                </p>
              )}
              {footerDescription && (
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed break-words cq-md:mx-0" style={{ color: footerMuted }}>
                  {footerDescription}
                </p>
              )}
              {footerSocialLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-3 cq-md:justify-start">
                  {footerSocialLinks.map((link: any, idx: number) => {
                    const platform = link.platform || link.label || 'globe'
                    const label = t(link.label) || link.platform || (lang === 'ar' ? 'رابط' : 'Link')
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
                        onClick={onLinkClick}
                        aria-label={label}
                        title={label}
                        className="flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                        style={{ borderColor: footerSocialBorder, background: footerSocialBg, color: footerText }}
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
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: footerText }}>
                  {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                </h3>
                <ul className="mt-4 space-y-1">
                  {quickLinks.map((n) => (
                    <li key={n.href}>
                      <a
                        href={n.href}
                        onClick={onLinkClick}
                        className="group inline-flex min-h-[36px] items-center text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                        style={{ color: footerMuted }}
                      >
                        <span className="relative">
                          {n.label}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-0.5 start-0 h-px w-0 transition-all duration-200 group-hover:w-full"
                            style={{ background: footerText }}
                          />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* Column 3 · Contact — only rendered if email, wa/phone or location is present */}
            {hasContactCol && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: footerText }}>
                  {heading || (lang === 'ar' ? 'تواصل معي' : 'Get In Touch')}
                </h3>
                {subheading && (
                  <p className="mt-3 text-sm leading-relaxed break-words" style={{ color: footerMuted }}>
                    {subheading}
                  </p>
                )}
                <ul className="mt-4 space-y-3 flex flex-col items-center cq-md:items-start">
                  {emailHref && (
                    <li>
                      <a
                        href={emailHref}
                        onClick={onLinkClick}
                        className="inline-flex items-center gap-2.5 text-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                        style={{ color: footerMuted }}
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
                        onClick={onLinkClick}
                        className="inline-flex items-center gap-2.5 text-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                        style={{ color: footerMuted }}
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    </li>
                  )}
                  {locVal && (
                    <li className="inline-flex items-center gap-2.5 text-sm" style={{ color: footerMuted }}>
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="break-words">{locVal}</span>
                    </li>
                  )}
                </ul>
                {(emailHref || waHref) && (
                  <a
                    href={ctaHref}
                    onClick={onLinkClick}
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                  >
                    {lang === 'ar' ? 'تواصل معي' : 'Get in touch'}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Bottom bar — always credits the owner + PortfolioHub ── */}
          <div className="mt-12 border-t pt-5" style={{ borderTopColor: footerBorder }}>
            <div className="flex flex-col items-center gap-3 cq-sm:flex-row cq-sm:justify-between cq-sm:gap-4">
              <p className="text-xs" style={{ color: footerMuted }}>
                © {year} · {displayName}
              </p>
              <div className="flex flex-col items-center gap-2 cq-sm:flex-row cq-sm:gap-5">
                <p className="text-xs" style={{ color: footerMuted }}>
                  {lang === 'ar' ? 'بُني بواسطة' : 'Developed with'}{' '}
                  <a
                    href="https://portfolio-hub.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onLinkClick}
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                    style={{ color: footerText, textDecorationColor: footerSocialBorder }}
                  >
                    PortfolioHub
                  </a>
                </p>
                {showScrollToTop && onScrollToTop && (
                  <button
                    type="button"
                    onClick={onScrollToTop}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]"
                    style={{ color: footerMuted }}
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
