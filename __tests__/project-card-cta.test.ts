/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'

// Editorial imports next/font, which is not available in the node test runtime.
// Mocking it keeps the component's real logic testable without a browser.
vi.mock('next/font/google', () => ({
  Playfair_Display: () => ({ variable: 'mock-playfair' }),
}))

import { EditorialMarketingTemplate } from '@/components/portfolio/templates/EditorialMarketingTemplate'
import { ProjectPageView } from '@/app/u/[username]/projects/[slug]/ProjectPageView'

function createProfile(card: any, targetSlug = 'case-study') {
  return {
    username: 'u1',
    displayName: 'User One',
    appearance: { primaryColor: '#38BDF8', accentColor: '#818CF8', bgColorLight: '#F0F9FF', cardBackground: '#FFFFFF', textColorLight: '#0F172A', mutedText: '#64748B', borderColor: '#BAE6FD' },
    pages: [
      {
        slug: 'home',
        sections: [
          { id: 'projects-1', sectionType: 'projects', sectionOrder: 1, content: { title: { en: 'Projects' } }, settings: { isVisible: true } },
        ],
      },
    ],
    projectPages: [
      { id: 'card-1', title: 'Card One', slug: 'card-one', showInProjects: true, ...card },
      { id: 'page-1', title: 'Case Study', slug: targetSlug, showInProjects: false, isPublished: true, content: {} },
    ],
  } as any
}

function renderClassic(profile: any) {
  return renderToStaticMarkup(
    React.createElement(ClassicTemplate, { profile, isFree: false, preview: false }),
  )
}

function renderEditorial(profile: any) {
  return renderToStaticMarkup(
    React.createElement(EditorialMarketingTemplate, { profile, isFree: false, preview: false }),
  )
}

describe('homepage project card CTA rendering', () => {
  it('Classic renders a visible internal Project Page CTA', () => {
    const profile = createProfile({
      linkType: 'page',
      linkedPageSlug: 'case-study',
    })
    const html = renderClassic(profile)
    expect(html).toContain('View Project')
    expect(html).toContain('/u/u1/projects/case-study')
  })

  it('Editorial renders a visible internal Project Page CTA', () => {
    const profile = createProfile({
      linkType: 'page',
      linkedPageSlug: 'case-study',
    })
    const html = renderEditorial(profile)
    expect(html).toContain('View Project')
    expect(html).toContain('/u/u1/projects/case-study')
  })

  it('Classic accepts a persisted page whose real slug begins with new-', () => {
    const profile = createProfile(
      { linkType: 'page', linkedPageSlug: 'new-project-page' },
      'new-project-page',
    )
    const html = renderClassic(profile)
    expect(html).toContain('View Project')
    expect(html).toContain('/u/u1/projects/new-project-page')
  })

  it('Editorial accepts a persisted page whose real slug begins with new-', () => {
    const profile = createProfile(
      { linkType: 'page', linkedPageSlug: 'new-project-page' },
      'new-project-page',
    )
    const html = renderEditorial(profile)
    expect(html).toContain('View Project')
    expect(html).toContain('/u/u1/projects/new-project-page')
  })

  it('Classic keeps external links as before', () => {
    const profile = createProfile({
      linkType: 'external',
      externalLink: 'https://example.com/external',
      linkLabel: 'Open Site',
    })
    const html = renderClassic(profile)
    expect(html).toContain('Open Site')
    expect(html).toContain('https://example.com/external')
  })

  it('Editorial keeps external links as before', () => {
    const profile = createProfile({
      linkType: 'external',
      externalLink: 'https://example.com/external',
      linkLabel: 'Open Site',
    })
    const html = renderEditorial(profile)
    expect(html).toContain('Open Site')
    expect(html).toContain('https://example.com/external')
  })

  it('Explicit "none" hides the CTA even with a stale slug (Classic)', () => {
    const profile = createProfile({
      linkType: 'none',
      linkedPageSlug: 'case-study',
    })
    expect(renderClassic(profile)).not.toContain('View Project')
  })

  it('Explicit "none" hides the CTA even with a stale slug (Editorial)', () => {
    const profile = createProfile({
      linkType: 'none',
      linkedPageSlug: 'case-study',
    })
    expect(renderEditorial(profile)).not.toContain('View Project')
  })

  it('Deleted internal target hides the CTA in both templates', () => {
    const profile = createProfile({
      linkType: 'page',
      linkedPageSlug: 'deleted-page',
    })
    expect(renderClassic(profile)).not.toContain('View Project')
    expect(renderEditorial(profile)).not.toContain('View Project')
  })
})

function createDetailProfile(template: 'classic' | 'editorial-marketing') {
  return {
    username: 'u1',
    displayName: 'User One',
    appearance: {
      template,
      primaryColor: '#38BDF8',
      accentColor: '#818CF8',
      bgColorLight: '#F0F9FF',
      cardBackground: '#FFFFFF',
      textColorLight: '#0F172A',
      mutedText: '#64748B',
      borderColor: '#BAE6FD',
    },
    pages: [],
    projectPages: [{ slug: 'new-project-page', isPublished: true }],
    contactLinks: [],
  } as any
}

function createDetailPage(targetSlug: string) {
  return {
    id: 'page-current',
    title: 'Current Page',
    slug: 'current-page',
    showInProjects: false,
    isPublished: true,
    displayMode: 'grid',
    tags: [],
    backButtonLabel: 'Back to Portfolio',
    items: [{ id: 'item-1', type: 'page_link', externalUrl: targetSlug, title: 'Linked Page' }],
    content: { itemCards: [{ linkLabel: 'View Project' }] },
  } as any
}

describe('project detail item CTA rendering', () => {
  it.each(['classic', 'editorial-marketing'] as const)(
    '%s accepts a persisted page whose real slug begins with new-',
    (template) => {
      const html = renderToStaticMarkup(
        React.createElement(ProjectPageView, {
          profile: createDetailProfile(template),
          projectPage: createDetailPage('new-project-page'),
        }),
      )
      expect(html).toContain('View Project')
      expect(html).toContain('/u/u1/projects/new-project-page')
    },
  )

  it.each(['classic', 'editorial-marketing'] as const)(
    '%s still hides a page link to a nonexistent temporary id',
    (template) => {
      const html = renderToStaticMarkup(
        React.createElement(ProjectPageView, {
          profile: createDetailProfile(template),
          projectPage: createDetailPage('new-temporary-id'),
        }),
      )
      expect(html).not.toContain('/u/u1/projects/new-temporary-id')
    },
  )
})
