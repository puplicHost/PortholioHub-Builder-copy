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
      where: { pages: { some: { slug: 'home', isPublished: true } } },
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
  } catch {
    // sitemap should still work without DB access
  }

  return entries
}
