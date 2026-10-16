import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PROTECTED_EMAIL = 'bousla421@gmail.com'

// Deletes every non-protected user + all their data in FK-safe order.
// Protected account (and anything pointing at it) is never touched.
async function main() {
  const prot = await prisma.user.findUnique({ where: { email: PROTECTED_EMAIL }, select: { id: true } })
  if (!prot) {
    console.error('❌ Protected user not found — aborting')
    process.exit(1)
  }
  console.log('🔒 Protected user ID:', prot.id)

  const victims = await prisma.user.findMany({
    where: { email: { not: PROTECTED_EMAIL } },
    select: { id: true },
  })
  const ids = victims.map((u) => u.id)
  console.log(`Found ${ids.length} non-protected users to delete`)
  if (ids.length === 0) {
    console.log('✅ Nothing to delete')
    return
  }

  // 1. Audit trail: null refs pointing AT deleted users (keep rows about protected).
  await prisma.adminAuditLog.updateMany({
    where: { targetUserId: { in: ids } },
    data: { targetUserId: null },
  })
  // 2. Delete audit actions authored BY deleted users (never the protected admin's rows).
  const delAuditByThem = await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: ids } } })
  console.log(`Deleted ${delAuditByThem.count} audit rows authored by test users`)
  // 3. Delete orphan system audit rows (null actor, null target) — never rows about protected.
  const delOrphanAudit = await prisma.adminAuditLog.deleteMany({
    where: { adminId: null, targetUserId: null },
  })
  console.log(`Deleted ${delOrphanAudit.count} orphan system audit rows`)

  // 4. Null referral links pointing at deleted users (keep referrer rows of others).
  await prisma.referral.updateMany({ where: { referredBy: { in: ids } }, data: { referredBy: null } })

  // 5. Per-user owned data in dependency order.
  for (const id of ids) {
    await prisma.adminUserNote.deleteMany({ where: { OR: [{ userId: id }, { adminId: id }] } })
    await prisma.workspaceMember.deleteMany({ where: { userId: id } })
    // Owned workspaces (all children cascade: content, media, tasks, etc.)
    const owned = await prisma.workspace.findMany({ where: { ownerId: id }, select: { id: true } })
    for (const ws of owned) {
      await prisma.workspace.delete({ where: { id: ws.id } }).catch((e) => {
        console.error(`  workspace ${ws.id} delete failed:`, (e as Error).message)
        throw e
      })
    }
    // Subscriptions (events cascade) + requests + payments (SetNull on subscription FK).
    await prisma.subscription.deleteMany({ where: { userId: id } })
    await prisma.subscriptionRequest.deleteMany({ where: { userId: id } })
    await prisma.payment.deleteMany({ where: { userId: id } })
    // Memberships in others' workspaces already removed above; notifications/sessions/tokens cascade.
    await prisma.user.delete({ where: { id } })
  }

  const remaining = await prisma.user.count()
  console.log(`✅ Deleted ${ids.length} test users and all related data`)
  console.log(`🔒 Protected: ${PROTECTED_EMAIL} (untouched)`)
  console.log(`Remaining users in DB: ${remaining}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
