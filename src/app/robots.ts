import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/urls'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/u/'],
        disallow: ['/profile/', '/api/', '/admin'],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  }
}
