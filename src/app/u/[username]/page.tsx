import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'
import { TrackBeacon } from '@/components/portfolio/TrackBeacon'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const profile = await prisma.userProfile.findUnique({
    where: { username },
  })

  if (!profile) return { title: 'Not Found' }

  return {
    title: `${profile.displayName || profile.username} | PortfolioHub`,
    description: profile.bio || `Check out the professional portfolio of ${profile.displayName || profile.username}`,
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  
  const profile = await prisma.userProfile.findUnique({
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

  if (!profile || !profile.pages || profile.pages.length === 0) {
    notFound()
  }

  return (
    <>
      <TrackBeacon username={username} eventType="page_view" />
      <ClassicTemplate profile={profile} />
    </>
  )
}
