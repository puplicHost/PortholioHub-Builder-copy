import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Every portfolio-builder user needs at least one workspace (legacy gate).
// Creates a personal workspace on first use instead of throwing.
export async function ensurePersonalWorkspace(userId: string, ownerName: string) {
  const owned = await prisma.workspace.findFirst({ where: { ownerId: userId } })
  if (owned) return owned

  const adminMember = await prisma.workspaceMember.findFirst({
    where: { userId, role: 'admin', acceptedAt: { not: null } },
  })
  if (adminMember) return null

  const base = (ownerName || 'My').trim().slice(0, 80) || 'My'
  return prisma.workspace.create({
    data: {
      name: `${base}'s Workspace`,
      ownerId: userId,
      settings: {} as Prisma.InputJsonValue,
    },
  })
}
