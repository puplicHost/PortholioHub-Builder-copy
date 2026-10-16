import { prisma } from '@/lib/prisma'
import { AnnouncementManager } from '@/components/admin/AnnouncementManager'

export const metadata = {
  title: 'Announcements | Admin',
}

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          System Announcements
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Broadcast banners and alerts to Egyptian creators across the builder and user dashboards.
        </p>
      </div>

      <AnnouncementManager
        initialAnnouncements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          type: a.type,
          active: a.active,
          targetAudience: a.targetAudience,
          dismissible: a.dismissible,
          startsAt: a.startsAt.toISOString(),
          expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
