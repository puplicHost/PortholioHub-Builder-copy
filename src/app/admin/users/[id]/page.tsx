import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { UserActions } from '@/components/admin/UserActions'

export const metadata = {
  title: 'User detail | Admin',
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      isAdmin: true,
      emailVerified: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      portfolioProfile: {
        select: { id: true, username: true, status: true, adminHidden: true, updatedAt: true },
      },
      ownedWorkspaces: { select: { id: true, name: true } },
      _count: { select: { sessions: true } },
    },
  })
  if (!user) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/users" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        ← Users
      </Link>
      <h1 className="text-xl font-bold">{user.email}</h1>
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <p><span className="text-[var(--color-text-muted)]">Name:</span> {user.displayName || '—'}</p>
        <p><span className="text-[var(--color-text-muted)]">Phone:</span> {user.phone || '—'}</p>
        <p><span className="text-[var(--color-text-muted)]">Status:</span> {user.status}</p>
        <p><span className="text-[var(--color-text-muted)]">Admin:</span> {user.isAdmin ? 'yes' : 'no'}</p>
        <p><span className="text-[var(--color-text-muted)]">Sessions:</span> {user._count.sessions}</p>
        <p><span className="text-[var(--color-text-muted)]">Workspaces:</span> {user.ownedWorkspaces.length}</p>
        <p>
          <span className="text-[var(--color-text-muted)]">Portfolio:</span>{' '}
          {user.portfolioProfile ? (
            <Link href={`/u/${user.portfolioProfile.username}`} className="text-[var(--color-primary)] hover:underline">
              /u/{user.portfolioProfile.username} ({user.portfolioProfile.status}
              {user.portfolioProfile.adminHidden ? ', hidden' : ''})
            </Link>
          ) : (
            '—'
          )}
        </p>
        <p><span className="text-[var(--color-text-muted)]">Joined:</span> {new Date(user.createdAt).toLocaleString()}</p>
      </Card>
      <UserActions userId={user.id} status={user.status} />
    </div>
  )
}
