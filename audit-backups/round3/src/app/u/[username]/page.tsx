import { notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'
import { TrackBeacon } from '@/components/portfolio/TrackBeacon'
import { getSubscriptionState } from '@/lib/subscriptions'
import { stripLockedSectionsForFree } from '@/lib/free-sections'
import { toPublicProfile } from '@/lib/public-profile'
import { getAppUrl } from '@/lib/urls'
import { Metadata } from 'next'

// Shared within a single request: generateMetadata and the page below
// read the same row with ONE round trip instead of two. Unknown usernames,
// never-published or admin-hidden portfolios resolve to null → uniform 404.
// Subscription state NEVER gates public rendering: any published portfolio
// renders for free and paid users alike.
const getPublicProfile = cache(async (username: string) => {
  const row = await prisma.userProfile.findUnique({
    where: { username },
    include: {
      pages: {
        where: { slug: 'home', isPublished: true },
        include: { sections: { orderBy: { sectionOrder: 'asc' } } },
        orderBy: { pageOrder: 'asc' },
      },
      projectPages: {
        where: { isPublished: true },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
      }
    },
  })
  if (!row) return null
  const sub = await getSubscriptionState(row.userId)
  // Only valid 404 reasons: unknown username, never published, or hidden by admin.
  if (row.status !== 'PUBLISHED' || row.adminHidden) return null
  const profile = toPublicProfile(row)
  if (!profile || !profile.pages || profile.pages.length === 0) return null
  // FREE users never see internal links: external URLs only.
  const isFree = sub.state !== 'ACTIVE' && sub.state !== 'GRACE'
  // FREE users: locked sections (experience/skills/services/testimonials)
  // are removed from the data entirely — never rendered publicly.
  if (isFree) {
    return { profile: stripLockedSectionsForFree(profile), isFree: true }
  }
  return { profile, isFree: false }
})

function contentLocale(profile: { appearance?: unknown }): 'ar' | 'en' {
  const appearance = (profile.appearance ?? {}) as Record<string, unknown>
  // The builder writes the language under `n` (see ThemeSettings / ClassicTemplate).
  // `defaultLanguage` is kept as a legacy fallback for older saved profiles.
  const value = appearance['n'] ?? appearance['defaultLanguage']
  return value === 'ar' ? 'ar' : 'en'
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const data = await getPublicProfile(username)
  const profile = data?.profile
  const base = getAppUrl()

  if (!profile) return { title: 'Not Found', robots: { index: false, follow: false } }

  const title = `${profile.displayName || profile.username} | PortfolioHub`
  const description = profile.bio || `Check out the professional portfolio of ${profile.displayName || profile.username}`
  const url = `${base}/u/${profile.username}`
  const ogImageUrl = `${base}/og?title=${encodeURIComponent(profile.displayName || profile.username)}&subtitle=${encodeURIComponent(profile.professionalTitle ?? 'Portfolio')}`
  const avatar = typeof profile.avatarUrl === 'string' && profile.avatarUrl.startsWith('http')
    ? profile.avatarUrl
    : ogImageUrl
  const locale = contentLocale(profile) === 'ar' ? 'ar_EG' : 'en_US'

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: 'PortfolioHub',
      type: 'profile',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: avatar,
    },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const data = await getPublicProfile(username)

  if (!data) {
    notFound()
  }
  const { profile, isFree } = data
  const personLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName || profile.username,
    url: `${getAppUrl()}/u/${profile.username}`,
    ...(profile.professionalTitle ? { jobTitle: profile.professionalTitle } : {}),
  }).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personLd }} />
      <TrackBeacon username={profile.username} eventType="page_view" />
      <ClassicTemplate profile={profile} isFree={isFree} />
    </>
  )
}
