/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { ArrowLeft, ExternalLink, Play } from 'lucide-react'
import styles from './editorial.module.css'
import { getPortfolioLang, pickLang } from '@/lib/portfolio-language'
import { sanitizeUrl } from '@/lib/urls'
import { portfolioImageUrl } from '@/lib/cloudinary'
import { resolveEditorialAppearanceVars } from '@/lib/editorial-appearance'
import { ProjectFileIcon } from '@/components/portfolio/ProjectCard'
import {
  normalizeProjectCardVisual,
  normalizeProjectFileType,
  projectItemLinkLabel,
  readProjectItemCards,
} from '@/lib/project-card-visuals'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
})

function itemHref(
  username: string,
  item: any,
  persistedPageSlugs: ReadonlySet<string>,
): string {
  const raw = typeof item?.externalUrl === 'string' ? item.externalUrl.trim() : ''
  if (!raw) return ''
  if (item.type === 'page_link') {
    if (!/^[a-z0-9-]+$/i.test(raw)) return ''
    if (
      (raw.startsWith('new-') || raw.startsWith('project-new-')) &&
      !persistedPageSlugs.has(raw)
    ) return ''
    return `/u/${username}/projects/${encodeURIComponent(raw)}`
  }
  const r2 = raw.match(/^\/api\/files\/r2\/([a-zA-Z0-9_-]+)$/)
  if (r2) return `/portfolio/viewer/${encodeURIComponent(r2[1])}`
  return sanitizeUrl(raw)
}

function videoSrc(value: unknown): string {
  const raw = typeof value === 'string' ? value : ''
  return /^\/api\/files\/r2\//.test(raw) ? raw : ''
}

/** Editorial-specific project detail presentation. Content comes from the
 * same ProjectPage rows/items as the Classic detail page. */
export function EditorialProjectDetail({
  profile,
  projectPage,
  preview = false,
}: {
  profile: any
  projectPage: any
  preview?: boolean
}) {
  const appearance = (profile?.appearance || {}) as Record<string, unknown>
  const persistedPageSlugs = new Set<string>(
    (Array.isArray(profile?.projectPages) ? profile.projectPages : [])
      .map((page: any) => (typeof page?.slug === 'string' ? page.slug : ''))
      .filter((slug: string): slug is string => Boolean(slug)),
  )
  const lang = getPortfolioLang(appearance) === 'ar' ? 'ar' : 'en'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const t = (value: unknown) => pickLang(value as never, lang)
  const displayName = t(profile?.localized?.displayName) || profile?.displayName || profile?.username || ''
  const items = Array.isArray(projectPage?.items) ? projectPage.items : []
  const meta = readProjectItemCards(projectPage?.content)
  const mode = projectPage?.displayMode === 'list' ? 'list' : 'grid'
  const guard = (e: React.MouseEvent) => {
    if (preview) e.preventDefault()
  }

  return (
    <div className={`${styles['emk']} ${playfair.variable}`} style={resolveEditorialAppearanceVars(appearance)} dir={dir} lang={lang}>
      <header className={styles['emk__detail-header']}>
        <div className={`${styles['emk__container']} ${styles['emk__detail-nav']}`}>
          <Link href={preview ? '#' : `/u/${profile?.username}`} onClick={guard} className={styles['emk__brand']}>
            {displayName}
          </Link>
          <Link href={preview ? '#' : `/u/${profile?.username}`} onClick={guard} className={styles['emk__detail-back']}>
            <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden="true" />
            {projectPage?.backButtonLabel || (lang === 'ar' ? 'العودة للبورتفوليو' : 'Back to Portfolio')}
          </Link>
        </div>
      </header>

      <main className={styles['emk__detail-main']}>
        <div className={styles['emk__container']}>
          <p className={styles['emk__eyebrow']}>{lang === 'ar' ? 'دراسة حالة' : 'Case study'}</p>
          <h1 className={styles['emk__detail-title']}>{projectPage?.title || ''}</h1>
          {projectPage?.description ? (
            <p className={styles['emk__detail-lead']}>{projectPage.description}</p>
          ) : null}
          {Array.isArray(projectPage?.tags) && projectPage.tags.length > 0 ? (
            <div className={styles['emk__project-badges']}>
              {projectPage.tags.slice(0, 6).map((tag: string) => (
                <span key={tag} className={styles['emk__project-badge']}>{tag}</span>
              ))}
            </div>
          ) : null}

          <div className={mode === 'list' ? styles['emk__detail-list'] : styles['emk__detail-grid']}>
            {items.map((item: any, index: number) => {
              const itemMeta = meta[index] || {}
              const visual = normalizeProjectCardVisual(itemMeta.cardVisual)
              const image = item?.imageUrl ? portfolioImageUrl(sanitizeUrl(item.imageUrl), 1000) : null
              const video = videoSrc(itemMeta.videoUrl || projectPage?.content?.videoUrl)
              const href = visual === 'video'
                ? ''
                : itemHref(profile?.username || '', item, persistedPageSlugs)
              const extras = (itemMeta.links || []).filter((link: any) => sanitizeUrl(link.url))
              const fallbackHref = safeFileHref(item?.externalUrl)
              const mainHref = href || fallbackHref

              return (
                <article key={item?.id || index} className={styles['emk__detail-card']}>
                  {image ? (
                    <div className={styles['emk__detail-media']}>
                      <img src={image} alt={t(item?.title) || ''} loading="lazy" decoding="async" />
                    </div>
                  ) : visual === 'file-icon' ? (
                    <div className={styles['emk__detail-media']}>
                      <ProjectFileIcon fileType={normalizeProjectFileType(itemMeta.fileType)} className="h-10 w-10" />
                    </div>
                  ) : visual === 'video' ? (
                    <div className={styles['emk__detail-media']}>
                      {video ? (
                        <video src={video} controls preload="metadata" className="h-full w-full object-contain">
                          {t(item?.title)}
                        </video>
                      ) : (
                        <Play className="h-8 w-8 opacity-40" aria-hidden="true" />
                      )}
                    </div>
                  ) : null}
                  <div className={styles['emk__detail-card-body']}>
                    <h2>{t(item?.title) || item?.label || ''}</h2>
                    {item?.description ? <p>{t(item.description)}</p> : null}
                    {mainHref ? (
                      <a
                        href={mainHref}
                        target={mainHref.startsWith('/') ? undefined : '_blank'}
                        rel={mainHref.startsWith('/') ? undefined : 'noreferrer'}
                        onClick={guard}
                        className={styles['emk__project-link']}
                      >
                        {projectItemLinkLabel(itemMeta, lang)}
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                    {extras.map((link: any, i: number) => {
                      const url = sanitizeUrl(link.url)
                      if (!url) return null
                      return (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" onClick={guard} className={styles['emk__project-link']}>
                          {link.label || url}
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </main>

      <footer className={styles['emk__detail-footer']}>
        <div className={`${styles['emk__container']} ${styles['emk__footer-bar']}`}>
          <p>© {new Date().getFullYear()} {displayName}</p>
          <p className={styles['emk__footer-credit']}>
            {lang === 'ar' ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
            <a href="https://portfolio-hub.online" target="_blank" rel="noopener noreferrer">Portfolio Hub</a>
          </p>
          <Link href={preview ? '#' : `/u/${profile?.username}`} onClick={guard} className={styles['emk__footer-top']}>
            {lang === 'ar' ? 'العودة للبورتفوليو' : 'Back to portfolio'}
          </Link>
        </div>
      </footer>
    </div>
  )
}

function safeFileHref(value: unknown): string {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw) return ''
  const r2 = raw.match(/^\/api\/files\/r2\/([a-zA-Z0-9_-]+)$/)
  if (r2) return `/portfolio/viewer/${encodeURIComponent(r2[1])}`
  return /^https?:\/\//i.test(raw) ? raw : ''
}
