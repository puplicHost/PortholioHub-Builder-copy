import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { toPublicProfile } from '@/lib/public-profile'
import { BuilderPreviewClient } from '@/components/admin/BuilderPreviewClient'

export const metadata = {
  title: 'Portfolio Preview | Admin',
}

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserPortfolioPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      portfolioProfile: {
        include: {
          pages: {
            include: { sections: { orderBy: { sectionOrder: 'asc' } } },
            orderBy: { pageOrder: 'asc' },
          },
          projectPages: {
            include: { items: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!user) notFound()

  const rawProfile = user.portfolioProfile
  const profile = rawProfile
    ? {
        ...toPublicProfile(rawProfile),
        status: rawProfile.status,
        adminHidden: rawProfile.adminHidden,
        username: rawProfile.username,
      }
    : null

  return (
    <BuilderPreviewClient
      userId={user.id}
      userName={user.displayName || user.email}
      userEmail={user.email}
      profile={profile}
    />
  )
}
