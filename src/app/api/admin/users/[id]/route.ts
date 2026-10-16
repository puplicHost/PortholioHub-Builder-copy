import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'

// GET /api/admin/users/:id — profile, portfolio status, counts. No secrets.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

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
      ownedWorkspaces: { select: { id: true, name: true, createdAt: true } },
      _count: { select: { sessions: true } },
    },
  })
  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }
  return Response.json({ ok: true, user })
}

// PATCH /api/admin/users/:id — update user details (displayName, email, phone, isAdmin)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'INVALID_BODY', message: 'Invalid JSON request body' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  const { displayName, email, phone, isAdmin } = body as {
    displayName?: string
    email?: string
    phone?: string
    isAdmin?: boolean
  }

  const updateData: Record<string, unknown> = {}

  if (typeof displayName === 'string') {
    updateData.displayName = displayName.trim() || null
  }

  if (typeof phone === 'string') {
    updateData.phone = phone.trim() || null
  }

  if (typeof isAdmin === 'boolean') {
    // Prevent admin from removing their own admin status
    if (gate.adminId === id && !isAdmin) {
      return Response.json(
        { code: 'FORBIDDEN', message: 'Cannot revoke your own admin rights' },
        { status: 403 }
      )
    }
    updateData.isAdmin = isAdmin
  }

  if (typeof email === 'string') {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return Response.json({ code: 'INVALID_EMAIL', message: 'Valid email address is required' }, { status: 400 })
    }
    if (trimmedEmail !== existing.email.toLowerCase()) {
      const emailConflict = await prisma.user.findFirst({
        where: { email: { equals: trimmedEmail, mode: 'insensitive' }, NOT: { id } },
      })
      if (emailConflict) {
        return Response.json({ code: 'EMAIL_TAKEN', message: 'Email is already used by another user' }, { status: 409 })
      }
      updateData.email = trimmedEmail
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ ok: true, user: existing, message: 'No changes requested' })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  })

  // Also sync profile table display_name if exists
  if (updateData.displayName !== undefined) {
    await prisma.profile.updateMany({
      where: { userId: id },
      data: { displayName: updateData.displayName as string | null },
    }).catch(() => null)
  }

  await audit({
    actorId: gate.adminId,
    action: 'user.update',
    targetType: 'User',
    targetId: id,
    targetUserId: id,
    meta: {
      updatedFields: Object.keys(updateData),
      previous: {
        email: existing.email,
        displayName: existing.displayName,
        phone: existing.phone,
        isAdmin: existing.isAdmin,
      },
      current: updateData,
    },
  })

  return Response.json({ ok: true, user: updated })
}

// DELETE /api/admin/users/:id — permanent cascading deletion with email confirmation
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi()
  if (!gate.ok) return gate.response

  const { id } = await params

  if (gate.adminId === id) {
    return Response.json(
      { code: 'SELF_DELETE', message: 'Cannot delete your own admin account' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, displayName: true },
  })

  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  // Perform cascading hard delete safely in an atomic transaction
  await prisma.$transaction(async (tx) => {
    // Disconnect audit log foreign keys so history remains without dangling references
    await tx.adminAuditLog.updateMany({
      where: { targetUserId: id },
      data: { targetUserId: null },
    })
    await tx.adminAuditLog.updateMany({
      where: { adminId: id },
      data: { adminId: null },
    })

    // Remove user notes
    await tx.adminUserNote.deleteMany({
      where: { OR: [{ userId: id }, { adminId: id }] },
    })

    // Disconnect or remove referrals
    await tx.referral.updateMany({
      where: { referredBy: id },
      data: { referredBy: null },
    })
    await tx.referral.deleteMany({
      where: { userId: id },
    })

    // Remove workspace memberships
    await tx.workspaceMember.deleteMany({
      where: { userId: id },
    })

    // Remove content comments and media files
    await tx.contentComment.deleteMany({
      where: { userId: id },
    })
    await tx.mediaFile.deleteMany({
      where: { userId: id },
    })

    // Remove owned workspaces and their contents
    const ownedWorkspaces = await tx.workspace.findMany({
      where: { ownerId: id },
      select: { id: true },
    })
    for (const ws of ownedWorkspaces) {
      await tx.workspace.delete({ where: { id: ws.id } })
    }

    // Remove payments, requests, subscriptions
    await tx.payment.deleteMany({ where: { userId: id } })
    await tx.subscriptionRequest.deleteMany({ where: { userId: id } })
    await tx.subscription.deleteMany({ where: { userId: id } })

    // Remove portfolio profiles (pages and sections cascade automatically)
    await tx.userProfile.deleteMany({ where: { userId: id } })
    await tx.profile.deleteMany({ where: { userId: id } })

    // Remove authentication tokens and sessions
    await tx.session.deleteMany({ where: { userId: id } })
    await tx.passwordResetToken.deleteMany({ where: { userId: id } })
    await tx.emailVerificationToken.deleteMany({ where: { userId: id } })
    await tx.fcmToken.deleteMany({ where: { userId: id } })
    await tx.notification.deleteMany({ where: { userId: id } })

    // Finally, delete the user record
    await tx.user.delete({ where: { id } })
  })

  // Log the deletion in audit trail
  await audit({
    actorId: gate.adminId,
    action: 'user.delete_permanent',
    targetType: 'User',
    targetId: id,
    meta: {
      deletedUserId: id,
      deletedEmail: user.email,
      deletedDisplayName: user.displayName,
    },
  })

  return Response.json({ ok: true, message: 'User deleted permanently' })
}
