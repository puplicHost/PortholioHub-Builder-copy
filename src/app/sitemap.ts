import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/urls'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl()

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/en`, changeFrequency: 'monthly', priority: 0.9 },
  ]

  try {
    const profiles = await prisma.userProfile.findMany({
      where: {
        status: 'PUBLISHED',
        adminHidden: false,
        pages: { some: { slug: 'home', isPublished: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: { username: true, updatedAt: true },
    })

    for (const profile of profiles) {
      entries.push({
        url: `${baseUrl}/u/${profile.username}`,
        changeFrequency: 'daily',
        priority: 0.6,
        lastModified: profile.updatedAt,
      })
    }

    const projects = await prisma.projectPage.findMany({
      where: {
        isPublished: true,
        profile: { status: 'PUBLISHED', adminHidden: false },
      },
      orderBy: { updatedAt: 'desc' },
      take: 500,
      select: {
        slug: true,
        updatedAt: true,
        content: true,
        profile: { select: { username: true } },
        items: { select: { type: true, externalUrl: true } },
      },
    })

    // Only pages some project card links to (same rule as the public
    // project route: page-level linkType 'page' or a page_link item).
    // Sibling rows of other profiles are not loaded here, so linkedness is
    // decided per profile below.
    const byProfile = new Map<string, typeof projects>()
    for (const project of projects) {
      const list = byProfile.get(project.profile.username) || []
      list.push(project)
      byProfile.set(project.profile.username, list)
    }
    const isRealSlug = (s: unknown) =>
      typeof s === 'string' && s !== '' && !s.startsWith('new-') && !s.startsWith('project-new-')
    const isReferenced = (pages: typeof projects, slug: string) =>
      pages.some((pg) => {
        const content = (pg.content as any) || {}
        if (content.linkType === 'page' && content.linkedPageSlug === slug && isRealSlug(slug)) return true
        return (pg.items || []).some((item) => item.type === 'page_link' && item.externalUrl === slug)
      })

    for (const project of projects) {
      if (!isReferenced(byProfile.get(project.profile.username) || [], project.slug)) continue
      entries.push({
        url: `${baseUrl}/u/${project.profile.username}/projects/${project.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        lastModified: project.updatedAt,
      })
    }
  } catch {
    // sitemap should still work without DB access
  }

  return entries
}
