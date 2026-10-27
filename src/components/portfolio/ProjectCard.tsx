'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReactNode } from 'react'
import { Code, File, FileCode, FileText, FolderOpen, Image as ImageIcon, Presentation, Table2 } from 'lucide-react'
import { portfolioImageUrl } from '@/lib/cloudinary'
import { sanitizeUrl } from '@/lib/urls'
import {
  getFileTypeStyle,
  normalizeProjectFileType,
  type ProjectCardVisual,
  type ProjectFileType,
} from '@/lib/project-card-visuals'

/** Same icon mapping used by home-card file tiles and project-page items. */
export function ProjectFileIcon({ fileType, className }: { fileType: string; className?: string }) {
  const type: ProjectFileType = normalizeProjectFileType(fileType)
  if (type === 'pdf' || type === 'doc') return <FileText className={className} aria-hidden="true" />
  if (type === 'sheet') return <Table2 className={className} aria-hidden="true" />
  if (type === 'slides') return <Presentation className={className} aria-hidden="true" />
  if (type === 'folder') return <FolderOpen className={className} aria-hidden="true" />
  if (type === 'photo') return <ImageIcon className={className} aria-hidden="true" />
  if (type === 'script' || type === 'code') return <FileCode className={className} aria-hidden="true" />
  return <File className={className} aria-hidden="true" />
}

/**
 * Card media header shared by home project cards and project-page items.
 * `variant` mirrors the home grid/list layouts: compact file tiles, image with
 * cover/contain fit, and no wrapper at all for the "none" visual.
 */
export function ProjectCardMedia({
  visual = 'image',
  fileType = 'generic',
  imageUrl,
  imageFit = 'cover',
  title,
  variant = 'grid',
}: {
  visual?: ProjectCardVisual
  fileType?: ProjectFileType | string
  imageUrl?: string | null
  imageFit?: 'cover' | 'contain'
  title?: string | null
  variant?: 'grid' | 'list'
}) {
  if (visual === 'none') return null

  const wrapperClass =
    variant === 'list'
      ? 'w-full cq-sm:w-[300px] h-[200px] cq-sm:h-auto shrink-0 overflow-hidden bg-[var(--color-bg)] border-b cq-sm:border-b-0 cq-sm:border-e border-[var(--color-border)]'
      : 'h-[120px] cq-sm:h-[200px] w-full shrink-0 overflow-hidden bg-[var(--color-bg)] border-b border-[var(--color-border)]'

  if (visual === 'file-icon') {
    const style = getFileTypeStyle(fileType)
    const iconWrapperClass =
      variant === 'list'
        ? 'w-full cq-sm:w-28 h-24 cq-sm:h-auto shrink-0 flex items-center justify-center bg-[var(--color-bg)] border-b cq-sm:border-b-0 cq-sm:border-e border-[var(--color-border)]'
        : 'h-20 cq-sm:h-24 w-full shrink-0 flex items-center justify-center bg-[var(--color-bg)] border-b border-[var(--color-border)]'
    return (
      <div className={iconWrapperClass}>
        <span
          className="flex h-11 w-11 cq-sm:h-12 cq-sm:w-12 items-center justify-center rounded-xl shadow-xs"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <ProjectFileIcon fileType={fileType} className="h-6 w-6" />
        </span>
      </div>
    )
  }

  if (imageUrl) {
    const src = portfolioImageUrl(sanitizeUrl(imageUrl), 600)
    if (src) {
      return (
        <div className={wrapperClass}>
          <img
            src={src}
            alt={title || ''}
            loading="lazy"
            decoding="async"
            className={
              imageFit === 'contain'
                ? 'w-full h-full object-contain p-2 bg-[color-mix(in_srgb,var(--color-card)_90%,var(--color-border))] hover:scale-105 transition-transform duration-500'
                : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
            }
          />
        </div>
      )
    }
  }

  // Legacy fallback: an image card with no image keeps the original placeholder.
  return (
    <div className={`${wrapperClass} flex items-center justify-center`}>
      <Code className="h-8 w-8 cq-sm:h-12 cq-sm:w-12 text-[var(--color-border)]" aria-hidden="true" />
    </div>
  )
}

/** Card body shared by home project cards and project-page items. */
export function ProjectCardBody({
  title,
  description,
  tags,
  links,
  variant = 'grid',
}: {
  title: ReactNode
  description?: string | null
  tags?: string[]
  links?: ReactNode
  variant?: 'grid' | 'list'
}) {
  return (
    <div className={variant === 'list' ? 'p-6 flex flex-col flex-1 min-w-0' : 'p-4 cq-sm:p-6 flex flex-col flex-1 min-w-0'}>
      <h3
        className={
          variant === 'list'
            ? 'text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-3'
            : 'text-base cq-sm:text-xl break-words font-bold tracking-tight text-[var(--color-text)] mb-2 cq-sm:mb-3'
        }
      >
        {title}
      </h3>
      {description ? (
        <p
          className={
            variant === 'list'
              ? 'text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4'
              : 'text-[var(--color-text-muted)] text-[13px] cq-sm:text-[15px] leading-relaxed break-words mb-3 cq-sm:mb-4 line-clamp-3'
          }
        >
          {description}
        </p>
      ) : null}
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-medium truncate max-w-full text-[var(--color-text)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {links ? (
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--color-border)]">
          {links}
        </div>
      ) : null}
    </div>
  )
}
