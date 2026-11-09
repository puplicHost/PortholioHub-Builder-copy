import { sanitizeUrl } from '@/lib/urls'

export type ProjectCardDestination = {
  kind: 'page' | 'external'
  href: string
}

type ProjectLike = {
  linkType?: string | null
  linkedPageSlug?: string | null
  externalLink?: string | null
  content?: unknown
}

function contentValue(project: ProjectLike, key: string): unknown {
  const c = project?.content
  if (!c || typeof c !== 'object' || Array.isArray(c)) return undefined
  return (c as Record<string, unknown>)[key]
}

function isRealSlug(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !value.startsWith('new-') && !value.startsWith('project-new-')
}

/**
 * Resolve the main destination of a home-page project card. Shared by both
 * templates (and covered by unit tests) so the Builder, Classic and Editorial
 * cannot disagree about a card whose link lives partly in `content` JSON.
 *
 * `pages` is the public profile's project-page list. When supplied, a page
 * destination also requires the target to still exist and be published, which
 * prevents binary dead links after deletion.
 */
export function resolveProjectCardDestination(
  project: ProjectLike | null | undefined,
  options: {
    username?: string | null
    isFree?: boolean
    pages?: Array<{ id?: string | null; slug?: string | null; isPublished?: boolean | null }> | null
  } = {},
): ProjectCardDestination | null {
  if (!project) return null
  // Treat empty-string link types as missing so the content mirror/legacy
  // slug can still resolve a valid internal page.
  const rawType = project.linkType || contentValue(project, 'linkType')
  const rawSlug = project.linkedPageSlug ?? contentValue(project, 'linkedPageSlug')

  // Preserve explicit user intent. A legacy row without a linkType may still
  // resolve from the slug, but an explicit "none" must never resurrect a stale
  // linkedPageSlug as a page link.
  const normalizedType = typeof rawType === 'string' ? rawType.toLowerCase() : rawType
  const effectiveType =
    normalizedType === 'page' ||
    normalizedType === 'projectpage' ||
    normalizedType === 'page_link' ||
    normalizedType === 'pagelink' ||
    normalizedType === 'internal'
      ? 'page'
      : normalizedType === 'external'
        ? 'external'
        : rawType == null
          ? rawSlug
            ? 'page'
            : 'none'
          : 'none'

  if (effectiveType === 'page') {
    if (options.isFree) return null
    if (typeof rawSlug !== 'string' || !rawSlug.trim()) return null
    // Accept both the canonical slug and a legacy/stored page id. Normalize a
    // leading /projects/ path too, without redirecting to a different page.
    const candidate = rawSlug.trim().replace(/^\/projects\//, '')
    const target = options.pages?.find(
      (page) => page?.slug === candidate || page?.id === candidate,
    )
    if (options.pages && (!target || target.isPublished === false)) return null
    const slug = target?.slug || candidate
    // A target that exists in `pages` is a persisted page. Its slug is valid
    // even when it starts with `new-` (for example the server-generated
    // `new-project-page`). Apply the temporary-id guard only when no persisted
    // row backs the value.
    if (!target && !isRealSlug(slug)) return null
    if (!options.username) return null
    return { kind: 'page', href: `/u/${options.username}/projects/${slug}` }
  }

  if (effectiveType === 'external') {
    const href = typeof project.externalLink === 'string' ? sanitizeUrl(project.externalLink) : ''
    if (!href || !/^https?:\/\//i.test(href)) return null
    return { kind: 'external', href }
  }

  return null
}
