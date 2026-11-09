import { notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { ProjectPageView, type ProjectPageProfile } from './ProjectPageView'
import { TrackBeacon } from '@/components/portfolio/TrackBeacon'
import { isPortfolioVisible } from '@/lib/visibility'
import { getSubscriptionState } from '@/lib/subscriptions'
import { canViewLockedSections } from '@/lib/free-sections'
import { getAppUrl } from '@/lib/urls'

// Shared within a single request (metadata + page, one round trip).
// Unpublished projects — or projects of unpublished/hidden portfolios —
// resolve to null → uniform 404 (plan Phase 6 §13).
const getPublicProject = cache(async (username: string, slug: string) => {
  const projectPage = await prisma.projectPage.findFirst({
    where: { slug, isPublished: true, profile: { username } },
    include: {
      profile: {
        include: {
          pages: {
            where: { slug: 'home', isPublished: true },
            include: { sections: { orderBy: { sectionOrder: 'asc' } } },
            orderBy: { pageOrder: 'asc' },
          },
          // Item CTAs need the persisted page slugs so a real page named
          // `new-project-page` is not mistaken for a temporary client id.
          projectPages: { select: { slug: true, isPublished: true } },
        },
      },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!projectPage) return null
  const owner = projectPage.profile as unknown as { userId: string; status?: string | null; adminHidden?: boolean | null }
  const sub = await getSubscriptionState(owner.userId)
  if (!isPortfolioVisible(owner, sub.state)) return null
  // Project detail pages are Pro-only: free users never resolve them.
  if (!canViewLockedSections(sub.state)) return null
  // Unlinked pages (no project card points at this slug) are not public.
  // Links live on cards: page-level content.linkedPageSlug (linkType 'page')
  // or page_link items whose externalUrl is the slug. This row is already a
  // persisted page, so its slug is valid regardless of prefix (a real page can
  // legitimately be named `new-project-page`).
  const siblings = await prisma.projectPage.findMany({
    where: { profile: { username } },
    select: {
      content: true,
      items: { select: { type: true, externalUrl: true } },
    },
  })
  const referenced = siblings.some((pg) => {
    const content = (pg.content && typeof pg.content === 'object' && !Array.isArray(pg.content)
      ? pg.content
      : {}) as Record<string, unknown>
    if (content.linkType === 'page' && content.linkedPageSlug === slug) return true
    return (pg.items || []).some((item) => item.type === 'page_link' && item.externalUrl === slug)
  })
  if (!referenced) return null
  return projectPage
})

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }): Promise<Metadata> {
  const { username, slug } = await params
  const projectPage = await getPublicProject(username, slug)
  const base = getAppUrl()

  if (!projectPage) return { title: 'Not Found', robots: { index: false, follow: false } }

  const owner = projectPage.profile as unknown as { displayName?: string | null; username?: string | null }
  const ownerName = owner.displayName || owner.username || username
  const title = `${projectPage.title} | ${ownerName}`
  const description = projectPage.description || `Check out ${projectPage.title} by ${ownerName}`
  const url = `${base}/u/${username}/projects/${projectPage.slug}`
  const ogImageUrl = `${base}/og?title=${encodeURIComponent(projectPage.title)}&subtitle=${encodeURIComponent(ownerName)}`
  const cover = typeof projectPage.coverImage === 'string' && projectPage.coverImage.startsWith('http')
    ? projectPage.coverImage
    : ogImageUrl

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
      type: 'article',
      images: cover,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover,
    },
  }
}

export default async function ProjectPageDetail({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params

  const projectPage = await getPublicProject(username, slug)

  if (!projectPage) {
    notFound()
  }

  const profile = projectPage.profile as unknown as ProjectPageProfile
  const appearance = profile.appearance ?? {}
  const font = appearance.font ?? 'Inter'

  const breadcrumbLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Portfolio', item: `${getAppUrl()}/u/${username}` },
      { '@type': 'ListItem', position: 2, name: projectPage.title, item: `${getAppUrl()}/u/${username}/projects/${projectPage.slug}` },
    ],
  }).replace(/</g, '\\u003c')

  return (
    <div style={{ fontFamily: `"${font}", system-ui, sans-serif` }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd }} />
      <TrackBeacon username={username} eventType="project_view" projectSlug={slug} />
      <ProjectPageView profile={profile} projectPage={projectPage} />
    </div>
  )
}
