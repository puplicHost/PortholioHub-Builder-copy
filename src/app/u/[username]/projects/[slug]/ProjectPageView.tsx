'use client'

import Link from 'next/link'
import type { CSSProperties, MouseEvent } from 'react'
import type { Prisma } from '@prisma/client'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { sanitizeUrl } from '@/lib/urls'
import { getPortfolioLang, pickLang } from '@/lib/portfolio-language'
import { isSectionVisible } from '@/lib/section-visibility'
import { PortfolioFooter } from '@/components/portfolio/PortfolioFooter'
import { ProjectCardBody, ProjectCardMedia, ProjectFileIcon } from '@/components/portfolio/ProjectCard'
import {
  getDynamicGridCols,
  normalizeProjectCardVisual,
  normalizeProjectFileType,
  normalizeProjectImageFit,
  projectItemLinkLabel,
  readProjectItemCards,
  type ProjectItemCardMeta,
} from '@/lib/project-card-visuals'

/** The subset of the owner profile rendered by a project detail page. */
export type ProjectPageProfile = {
  username: string
  displayName?: string | null
  bio?: string | null
  location?: string | null
  contactLinks?: any[] | null
  localized?: {
    displayName?: { ar?: string | null; en?: string | null } | null
    professionalTitle?: { ar?: string | null; en?: string | null } | null
    bio?: { ar?: string | null; en?: string | null } | null
    location?: { ar?: string | null; en?: string | null } | null
  } | null
  pages?: Array<{
    slug?: string | null
    sections?: any[] | null
  }> | null
  appearance?: {
    colorMode?: 'light' | 'dark' | null
    defaultColorMode?: 'light' | 'dark' | 'light-with-toggle' | 'dark-with-toggle' | null
    primaryColor?: string | null
    bgColorLight?: string | null
    bgColorDark?: string | null
    cardBackground?: string | null
    cardBackgroundDark?: string | null
    textColorLight?: string | null
    textColorDark?: string | null
    mutedText?: string | null
    mutedTextDark?: string | null
    borderColor?: string | null
    borderColorDark?: string | null
    outlineColor?: string | null
    font?: string | null
    logoUrl?: string | null
    footerBg?: string | null
    footerText?: string | null
    actionButtons?: {
      showScrollToTop?: boolean
      whatsappNumber?: string | null
    } | null
  } | null
}

type ProjectPageWithItems = Prisma.ProjectPageGetPayload<{ include: { items: true } }>

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2))
}

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

function itemHref(username: string, item: any): string {
  const raw = typeof item.externalUrl === 'string' ? item.externalUrl.trim() : ''
  if (!raw) return ''
  if (item.type === 'page_link') {
    // Page links store the target slug, not a URL.
    if (raw.startsWith('new-') || raw.startsWith('project-new-')) return ''
    if (!/^[a-z0-9-]+$/i.test(raw)) return ''
    return `/u/${username}/projects/${encodeURIComponent(raw)}`
  }
  return sanitizeUrl(raw)
}

function extraLinks(meta: ProjectItemCardMeta) {
  return (meta.links || []).filter((link) => Boolean(sanitizeUrl(link.url)))
}

/**
 * Public project page and builder preview. Both render this component so the
 * header, cards, and footer can never drift apart.
 *
 * `preview` only disables navigation (links stay inert) and switches the
 * minimum height to the preview container; content is identical.
 */
export function ProjectPageView({
  profile,
  projectPage,
  preview = false,
}: {
  profile: ProjectPageProfile
  projectPage: ProjectPageWithItems
  preview?: boolean
}) {
  const appearance = profile.appearance || {}
  const lang = getPortfolioLang(appearance) === 'ar' ? 'ar' : 'en'
  const defaultColorMode = appearance.defaultColorMode || appearance.colorMode || 'light'
  const theme = defaultColorMode.startsWith('dark') ? 'dark' : 'light'

  const primary = appearance.primaryColor || '#38BDF8'
  const primaryLight = adjustColor(primary, 40)
  const bgLight = appearance.bgColorLight || '#F0F9FF'
  const bgDark = appearance.bgColorDark || '#111827'
  const currentBg = theme === 'dark' ? bgDark : bgLight
  const currentText = theme === 'dark'
    ? (appearance.textColorDark || '#E5E7EB')
    : (appearance.textColorLight || '#0F172A')
  const currentMuted = theme === 'dark'
    ? (appearance.mutedTextDark || '#858688')
    : (appearance.mutedText || '#64748B')
  const currentCard = theme === 'dark'
    ? (appearance.cardBackgroundDark || '#374151')
    : (appearance.cardBackground || '#FFFFFF')
  const currentBorder = theme === 'dark'
    ? (appearance.borderColorDark || '#4B5563')
    : (appearance.borderColor || '#BAE6FD')
  const currentOutline = appearance.outlineColor || primary
  const fontFam = appearance.font || 'Inter'
  const displayName = pickLang(profile.localized?.displayName, lang) || profile.displayName || profile.username
  const role = pickLang(profile.localized?.professionalTitle, lang)
  const bio = pickLang(profile.localized?.bio, lang)
  const localizedLocation = pickLang(profile.localized?.location, lang)
  const initial = displayName.substring(0, 2).toUpperCase()
  const projects = projectPage.items || []
  const itemCards = readProjectItemCards(projectPage.content)
  const displayMode = projectPage.displayMode || 'grid'

  const homePage = (profile.pages || []).find((p) => p.slug === 'home') || (profile.pages || [])[0]
  const sections = (homePage?.sections || []).filter(isSectionVisible)
  const footerContent = sections.find((section: any) => section.sectionType === 'footer')?.content || {}
  const t = (value: unknown) => pickLang(value as never, lang)

  const style = {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-on-primary': isLightColor(primary) ? '#0F172A' : '#FFFFFF',
    '--color-bg': currentBg,
    '--color-bg-alt': currentCard,
    '--color-text': currentText,
    '--color-text-muted': currentMuted,
    '--color-muted': currentMuted,
    '--color-card': currentCard,
    '--color-card-border': currentBorder,
    '--color-border': currentBorder,
    '--border-color': currentBorder,
    '--color-outline': currentOutline,
    '--outline-color': currentOutline,
    fontFamily: `"${fontFam}", system-ui, sans-serif`,
  } as CSSProperties

  const backHref = preview ? '#' : `/u/${profile.username}`
  const preventPreviewNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (preview) event.preventDefault()
  }

  const renderItemLinks = (item: any, meta: ProjectItemCardMeta) => {
    const href = itemHref(profile.username, item)
    const extras = extraLinks(meta)
    if (!href && extras.length === 0) return null

    const visual = normalizeProjectCardVisual(meta.cardVisual)
    return (
      <>
        {href ? (
          <a
            href={preview ? '#' : href}
            onClick={preventPreviewNavigation}
            target={item.type === 'page_link' || preview ? undefined : '_blank'}
            rel={item.type === 'page_link' || preview ? undefined : 'noreferrer'}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
          >
            {visual === 'file-icon' ? (
              <ProjectFileIcon fileType={normalizeProjectFileType(meta.fileType)} className="h-4 w-4 shrink-0" />
            ) : (
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="break-words">{projectItemLinkLabel(meta, lang)}</span>
          </a>
        ) : null}
        {extras.map((link, index) => {
          const url = sanitizeUrl(link.url)
          if (!url) return null
          return (
            <a
              key={`${url}-${index}`}
              href={preview ? '#' : url}
              onClick={preventPreviewNavigation}
              target={preview ? undefined : '_blank'}
              rel={preview ? undefined : 'noreferrer'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
            >
              {link.iconType ? (
                <ProjectFileIcon fileType={link.iconType} className="h-4 w-4 shrink-0" />
              ) : (
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span className="break-words">{link.label || url}</span>
            </a>
          )
        })}
      </>
    )
  }

  return (
    <div
      className={`${preview ? 'min-h-full' : 'min-h-screen no-cq'} flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={style}
    >
      {/* Compact navbar — brand only. The old visitor theme toggle was
          removed so the page always uses the owner's saved color mode. */}
      <nav
        className="sticky top-0 z-40 shrink-0 py-3"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center px-6 cq-sm:px-12">
          <Link
            href={backHref}
            onClick={preventPreviewNavigation}
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:rounded"
            aria-label={displayName}
          >
            {appearance.logoUrl ? (
              <img src={sanitizeUrl(appearance.logoUrl)} alt={displayName} className="h-9 w-auto object-contain" />
            ) : (
              <span className="text-2xl font-black tracking-tight text-[var(--color-primary)]">{initial}</span>
            )}
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Header — back button + title + optional description only. Legacy
            coverImage data is intentionally ignored (kept in storage). */}
        <header className={`mx-auto max-w-[1200px] px-6 cq-sm:px-12 ${projectPage.showBackButton !== false ? 'pt-5' : 'pt-8'} pb-6 cq-sm:pb-8`}>
          {projectPage.showBackButton !== false && (
            <Link
              href={backHref}
              onClick={preventPreviewNavigation}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {projectPage.backButtonLabel || 'Back to Portfolio'}
            </Link>
          )}
          <h1 className={`${projectPage.showBackButton !== false ? 'mt-4' : ''} break-words text-2xl font-bold tracking-tight text-[var(--color-text)] cq-sm:text-3xl`}>
            {projectPage.title}
          </h1>
          {projectPage.description ? (
            <p className="mt-2 max-w-3xl break-words text-base leading-relaxed text-[var(--color-text-muted)] cq-sm:text-lg">
              {projectPage.description}
            </p>
          ) : null}
        </header>

        <div className="mx-auto max-w-[1200px] px-6 pb-16 cq-sm:px-12">
          {displayMode === 'list' ? (
            <div className="flex flex-col gap-6">
              {projects.map((item, index) => {
                const meta = itemCards[index] || {}
                const requestedVisual = normalizeProjectCardVisual(meta.cardVisual)
                // Image cards with nothing to show collapse instead of leaving
                // a large empty placeholder area.
                const visual = requestedVisual === 'image' && !sanitizeUrl(item.imageUrl)
                  ? 'none'
                  : requestedVisual
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all duration-300 hover:shadow-xl cq-sm:flex-row"
                  >
                    <ProjectCardMedia
                      visual={visual}
                      fileType={normalizeProjectFileType(meta.fileType)}
                      imageUrl={item.imageUrl}
                      imageFit={normalizeProjectImageFit(meta.imageFit)}
                      title={item.title}
                      variant="list"
                    />
                    <ProjectCardBody
                      title={item.title || (lang === 'ar' ? 'عنصر' : 'Project Item')}
                      description={item.textContent}
                      links={renderItemLinks(item, meta)}
                      variant="list"
                    />
                  </div>
                )
              })}
              {projects.length === 0 && (
                <p className="py-8 text-center font-medium text-[var(--color-text-muted)]">
                  {lang === 'ar' ? 'لا توجد عناصر في هذه الصفحة بعد.' : 'No projects on this page yet.'}
                </p>
              )}
            </div>
          ) : (
            <div className={`grid gap-4 cq-sm:gap-8 ${getDynamicGridCols(projects.length)}`}>
              {projects.map((item, index) => {
                const meta = itemCards[index] || {}
                const requestedVisual = normalizeProjectCardVisual(meta.cardVisual)
                const visual = requestedVisual === 'image' && !sanitizeUrl(item.imageUrl)
                  ? 'none'
                  : requestedVisual
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    <ProjectCardMedia
                      visual={visual}
                      fileType={normalizeProjectFileType(meta.fileType)}
                      imageUrl={item.imageUrl}
                      imageFit={normalizeProjectImageFit(meta.imageFit)}
                      title={item.title}
                      variant="grid"
                    />
                    <ProjectCardBody
                      title={item.title || (lang === 'ar' ? 'عنصر' : 'Project Item')}
                      description={item.textContent}
                      links={renderItemLinks(item, meta)}
                      variant="grid"
                    />
                  </div>
                )
              })}
              {projects.length === 0 && (
                <p className="col-span-full py-8 text-center font-medium text-[var(--color-text-muted)]">
                  {lang === 'ar' ? 'لا توجد عناصر في هذه الصفحة بعد.' : 'No projects on this page yet.'}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Shared website footer. Quick Links point back at the main portfolio
          sections instead of in-page anchors. */}
      <PortfolioFooter
        profile={profile}
        sections={sections}
        footerContent={footerContent}
        lang={lang}
        t={t}
        displayName={displayName}
        role={role}
        bio={bio}
        localizedLocation={localizedLocation}
        contactLinks={profile.contactLinks || []}
        whatsappNumber={appearance.actionButtons?.whatsappNumber || ''}
        linkPrefix={`/u/${profile.username}`}
        showScrollToTop={appearance.actionButtons?.showScrollToTop !== false}
        onScrollToTop={() => {
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onLinkClick={preview ? preventPreviewNavigation : undefined}
      />
    </div>
  )
}
