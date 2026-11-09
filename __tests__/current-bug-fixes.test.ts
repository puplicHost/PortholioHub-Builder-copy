import { describe, expect, it } from 'vitest'
import { resolvePreviewTemplateId } from '@/lib/templates'
import { resolveProjectCardDestination } from '@/lib/project-card-links'

describe('Builder template preview state (Issue C)', () => {
  it('uses the preview override without changing the saved template', () => {
    const saved = { template: 'classic' }
    expect(resolvePreviewTemplateId(saved, 'editorial-marketing')).toBe('editorial-marketing')
    expect(resolvePreviewTemplateId(saved, null)).toBe('classic')
    expect(saved.template).toBe('classic')
  })

  it('switches back and forth repeatedly', () => {
    const saved = { template: 'classic' }
    const sequence = ['editorial-marketing', 'classic', 'editorial-marketing', null] as const
    expect(sequence.map((value) => resolvePreviewTemplateId(saved, value))).toEqual([
      'editorial-marketing', 'classic', 'editorial-marketing', 'classic',
    ])
  })
})

describe('project card destinations (Issues A/G)', () => {
  const pages = [
    { id: 'page-id-1', slug: 'case-study', isPublished: true },
    { slug: 'hidden-page', isPublished: false },
  ]

  it('resolves internal project pages from top-level or content JSON', () => {
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'case-study' }, { username: 'u', pages }))
      .toEqual({ kind: 'page', href: '/u/u/projects/case-study' })
    expect(resolveProjectCardDestination({ content: { linkType: 'page', linkedPageSlug: 'case-study' } }, { username: 'u', pages }))
      .toEqual({ kind: 'page', href: '/u/u/projects/case-study' })
  })

  it('resolves legacy page ids and /projects/slug values to the canonical slug', () => {
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'page-id-1' }, { username: 'u', pages }))
      .toEqual({ kind: 'page', href: '/u/u/projects/case-study' })
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: '/projects/case-study' }, { username: 'u', pages }))
      .toEqual({ kind: 'page', href: '/u/u/projects/case-study' })
  })

  it('accepts a persisted page whose real slug begins with new-', () => {
    const persistedPages = [
      { id: 'page-new', slug: 'new-project-page', isPublished: true },
    ]
    expect(resolveProjectCardDestination(
      { linkType: 'page', linkedPageSlug: 'new-project-page' },
      { username: 'u', pages: persistedPages },
    )).toEqual({ kind: 'page', href: '/u/u/projects/new-project-page' })
  })

  it('still rejects temporary ids and nonexistent pages', () => {
    const persistedPages = [
      { id: 'page-new', slug: 'new-project-page', isPublished: true },
    ]
    expect(resolveProjectCardDestination(
      { linkType: 'page', linkedPageSlug: 'new-123' },
      { username: 'u', pages: persistedPages },
    )).toBeNull()
    expect(resolveProjectCardDestination(
      { linkType: 'page', linkedPageSlug: 'missing-page' },
      { username: 'u', pages: persistedPages },
    )).toBeNull()
  })

  it('keeps external links independent of internal-page selection', () => {
    expect(resolveProjectCardDestination({ linkType: 'external', externalLink: 'https://example.com/x' }, { username: 'u', pages }))
      .toEqual({ kind: 'external', href: 'https://example.com/x' })
  })

  it('hides missing, deleted, unpublished, temporary, and Free-only page destinations', () => {
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'missing' }, { username: 'u', pages })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'deleted-page' }, { username: 'u', pages })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'hidden-page' }, { username: 'u', pages })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'new-123' }, { username: 'u' })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'page', linkedPageSlug: 'case-study' }, { username: 'u', pages, isFree: true })).toBeNull()
  })

  it('returns no destination for missing or invalid inputs', () => {
    expect(resolveProjectCardDestination(null, { username: 'u' })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'none' }, { username: 'u' })).toBeNull()
    expect(resolveProjectCardDestination({ linkType: 'external', externalLink: 'javascript:alert(1)' }, { username: 'u' })).toBeNull()
  })
})
