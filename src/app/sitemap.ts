import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getAppUrl } from '@/lib/urls'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl()

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'monthly', priority: 1 },
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
      select: { slug: true, updatedAt: true, profile: { select: { username: true } } },
    })

    for (const project of projects) {
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
