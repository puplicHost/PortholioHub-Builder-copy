/**
 * Shared presentation helpers for project cards and project-page items.
 *
 * Card visuals live in the parent ProjectPage's `content` JSON:
 *   { itemCards: [{ cardVisual, fileType, imageFit, linkLabel, links }] }
 * Project items themselves are relational rows and are re-created on save, so
 * their presentation is stored positionally next to the page. Legacy rows
 * have no metadata and fall back to the original image behaviour.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ProjectCardVisual = 'image' | 'file-icon' | 'none'

export type ProjectFileType =
  | 'pdf'
  | 'sheet'
  | 'doc'
  | 'slides'
  | 'folder'
  | 'photo'
  | 'script'
  | 'code'
  | 'generic'

export const PROJECT_FILE_TYPES: ProjectFileType[] = [
  'pdf',
  'sheet',
  'doc',
  'slides',
  'folder',
  'photo',
  'script',
  'code',
  'generic',
]

export const PROJECT_ITEM_CARDS_KEY = 'itemCards'

export type ProjectItemCardLink = {
  label?: string
  url?: string
  iconType?: string
}

export type ProjectItemCardMeta = {
  cardVisual?: ProjectCardVisual
  fileType?: ProjectFileType
  imageFit?: 'cover' | 'contain'
  linkLabel?: string
  links?: ProjectItemCardLink[]
}

export function normalizeProjectCardVisual(value: unknown): ProjectCardVisual {
  return value === 'file-icon' || value === 'none' ? value : 'image'
}

export function normalizeProjectFileType(value: unknown): ProjectFileType {
  return typeof value === 'string' && (PROJECT_FILE_TYPES as string[]).includes(value)
    ? (value as ProjectFileType)
    : 'generic'
}

export function normalizeProjectImageFit(value: unknown): 'cover' | 'contain' {
  return value === 'contain' ? 'contain' : 'cover'
}

// Home project card metadata (stored on the page's content JSON).
export function projectCardVisual(page: any): ProjectCardVisual {
  return normalizeProjectCardVisual(page?.content?.cardVisual)
}

export function projectFileType(page: any): ProjectFileType {
  return normalizeProjectFileType(page?.content?.fileType)
}

export function projectImageFit(page: any): 'cover' | 'contain' {
  return normalizeProjectImageFit(page?.content?.imageFit)
}

// Document-specific colour tones for file icon tiles. Existing types keep the
// original tones; new slide/script types reuse the same 12% tint pattern.
export function getFileTypeStyle(fileType: string): { bg: string; text: string } {
  switch (normalizeProjectFileType(fileType)) {
    case 'pdf':
      return { bg: 'color-mix(in srgb, #ef4444 12%, transparent)', text: '#ef4444' }
    case 'sheet':
      return { bg: 'color-mix(in srgb, #10b981 12%, transparent)', text: '#10b981' }
    case 'doc':
      return { bg: 'color-mix(in srgb, #3b82f6 12%, transparent)', text: '#3b82f6' }
    case 'slides':
      return { bg: 'color-mix(in srgb, #f97316 12%, transparent)', text: '#f97316' }
    case 'folder':
      return { bg: 'color-mix(in srgb, #f59e0b 12%, transparent)', text: '#f59e0b' }
    case 'photo':
      return { bg: 'color-mix(in srgb, #8b5cf6 12%, transparent)', text: '#8b5cf6' }
    case 'script':
    case 'code':
      return { bg: 'color-mix(in srgb, #06b6d4 12%, transparent)', text: '#06b6d4' }
    default:
      return { bg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', text: 'var(--color-primary)' }
  }
}

export function projectFileAction(fileType: string, lang: 'en' | 'ar'): string {
  const labels: Record<string, { en: string; ar: string }> = {
    pdf: { en: 'Download PDF', ar: 'تحميل PDF' },
    sheet: { en: 'Open Sheet', ar: 'فتح الجدول' },
    doc: { en: 'Open Doc', ar: 'فتح المستند' },
    slides: { en: 'Open Slides', ar: 'فتح العرض' },
    folder: { en: 'Open Folder', ar: 'فتح المجلد' },
    photo: { en: 'View Image', ar: 'عرض الصورة' },
    script: { en: 'Open Code', ar: 'فتح الكود' },
    code: { en: 'Open Code', ar: 'فتح الكود' },
    generic: { en: 'Open File', ar: 'فتح الملف' },
  }
  return labels[normalizeProjectFileType(fileType)]?.[lang] || labels.generic[lang]
}

// Responsive dynamic grid column classes based on card count.
export function getDynamicGridCols(count: number): string {
  if (count <= 1) return 'max-w-xl mx-auto grid-cols-1'
  if (count === 2) return 'max-w-4xl mx-auto grid-cols-1 cq-sm:grid-cols-2'
  return 'grid-cols-1 cq-sm:grid-cols-2 cq-lg:grid-cols-3'
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeLink(value: unknown): ProjectItemCardLink | null {
  if (!isPlainObject(value)) return null
  const label = typeof value.label === 'string' ? value.label.trim().slice(0, 120) : ''
  const url = typeof value.url === 'string' ? value.url.trim().slice(0, 1000) : ''
  const iconType = typeof value.iconType === 'string' ? value.iconType.trim().slice(0, 40) : ''
  if (!label && !url) return null
  return {
    ...(label ? { label } : {}),
    ...(url ? { url } : {}),
    ...(iconType ? { iconType } : {}),
  }
}

function sanitizeMeta(value: unknown): ProjectItemCardMeta {
  if (!isPlainObject(value)) return {}
  const meta: ProjectItemCardMeta = {}
  if (value.cardVisual === 'image' || value.cardVisual === 'file-icon' || value.cardVisual === 'none') {
    meta.cardVisual = value.cardVisual
  }
  if (typeof value.fileType === 'string' && (PROJECT_FILE_TYPES as string[]).includes(value.fileType)) {
    meta.fileType = value.fileType as ProjectFileType
  }
  if (value.imageFit === 'cover' || value.imageFit === 'contain') {
    meta.imageFit = value.imageFit
  }
  if (typeof value.linkLabel === 'string') {
    const label = value.linkLabel.trim().slice(0, 120)
    if (label) meta.linkLabel = label
  }
  if (Array.isArray(value.links)) {
    const links = value.links.map(sanitizeLink).filter((link): link is ProjectItemCardLink => link !== null).slice(0, 8)
    if (links.length > 0) meta.links = links
  }
  return meta
}

export function readProjectItemCards(content: unknown): ProjectItemCardMeta[] {
  if (!isPlainObject(content)) return []
  const raw = content[PROJECT_ITEM_CARDS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.map(sanitizeMeta)
}

export function readProjectItemCardMeta(content: unknown, index: number): ProjectItemCardMeta {
  return readProjectItemCards(content)[index] || {}
}

export function withProjectItemCardMeta(
  content: unknown,
  index: number,
  patch: ProjectItemCardMeta,
): Record<string, unknown> {
  const base = isPlainObject(content) ? { ...content } : {}
  const cards = readProjectItemCards(base).slice()
  while (cards.length <= index) cards.push({})
  cards[index] = sanitizeMeta({ ...cards[index], ...patch })
  return { ...base, [PROJECT_ITEM_CARDS_KEY]: cards }
}

export function spliceProjectItemCards(
  content: unknown,
  start: number,
  deleteCount: number,
  insert: ProjectItemCardMeta[] = [],
): Record<string, unknown> {
  const base = isPlainObject(content) ? { ...content } : {}
  const cards = readProjectItemCards(base).slice()
  cards.splice(start, Math.max(0, deleteCount), ...insert.map(sanitizeMeta))
  return { ...base, [PROJECT_ITEM_CARDS_KEY]: cards }
}

/**
 * Button label for a project-page item. When no explicit label is saved, file
 * cards default by file type (Download PDF / Open Sheet / …); every other card
 * keeps the original "View" label.
 */
export function projectItemLinkLabel(meta: ProjectItemCardMeta, lang: 'en' | 'ar'): string {
  if (meta.linkLabel) return meta.linkLabel
  if (normalizeProjectCardVisual(meta.cardVisual) === 'file-icon') {
    return projectFileAction(meta.fileType || 'generic', lang)
  }
  return lang === 'ar' ? 'عرض' : 'View'
}
