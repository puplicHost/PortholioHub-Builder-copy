import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { ProjectPageView } from './ProjectPageView'
import { TrackBeacon } from '@/components/portfolio/TrackBeacon'

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }): Promise<Metadata> {
  const { username, slug } = await params
  const projectPage = await prisma.projectPage.findFirst({
    where: { slug, profile: { username } },
    include: { profile: true },
  })

  if (!projectPage) return { title: 'Not Found' }

  return {
    title: `${projectPage.title} | ${(projectPage as any).profile.displayName || (projectPage as any).profile.username}`,
    description: projectPage.description || `Check out ${projectPage.title} by ${(projectPage as any).profile.displayName || (projectPage as any).profile.username}`,
  }
}

export default async function ProjectPageDetail({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params

  const projectPage = await prisma.projectPage.findFirst({
    where: { slug, profile: { username } },
    include: {
      profile: {
        include: {
          pages: {
            where: { slug: 'home', isPublished: true },
            include: { sections: { orderBy: { sectionOrder: 'asc' } } },
            orderBy: { pageOrder: 'asc' },
          },
        },
      },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!projectPage) {
    notFound()
  }

  const profile = (projectPage as any).profile
  const appearance = (profile as any).appearance || {}
  const font = appearance.font || 'Inter'

  return (
    <div style={{ fontFamily: `"${font}", system-ui, sans-serif` }}>
      <TrackBeacon username={username} eventType="project_view" projectSlug={slug} />
      <ProjectPageView profile={profile} projectPage={projectPage} />
    </div>
  )
}
