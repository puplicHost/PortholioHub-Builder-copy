import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PROTECTED_EMAIL = 'bousla421@gmail.com'

// Canonical catalog: Monthly 150 EGP / 30d, Annual 1000 EGP / 365d.
// FK-safe: updates canonical plans in place (never deletes a plan that the
// protected account's subscriptions/requests point at), reassigns only
// non-protected rows off legacy plans, then removes unreferenced legacy plans.
async function main() {
  // Prefer matching existing canonical plans by name/duration so live plan IDs stay stable.
  let monthlyPlan = await prisma.plan.findFirst({ where: { name: 'الشهري', durationDays: 30 } })
  if (!monthlyPlan) {
    monthlyPlan = await prisma.plan.create({
      data: {
        name: 'الشهري', priceEgp: 150, durationDays: 30, isActive: true, sortOrder: 1,
        workspaceLimit: 1, postsPerMonth: 0, storageMb: 0, trialDays: 0,
      },
    })
  }
  let annualPlan = await prisma.plan.findFirst({ where: { name: 'السنوي', durationDays: 365 } })
  if (!annualPlan) {
    annualPlan = await prisma.plan.create({
      data: {
        name: 'السنوي', priceEgp: 1000, durationDays: 365, isActive: true, sortOrder: 2,
        workspaceLimit: 1, postsPerMonth: 0, storageMb: 0, trialDays: 0,
      },
    })
  }

  await prisma.plan.update({
    where: { id: monthlyPlan.id },
    data: { name: 'الشهري', priceEgp: 150, durationDays: 30, isActive: true, sortOrder: 1 },
  })
  await prisma.plan.update({
    where: { id: annualPlan.id },
    data: { name: 'السنوي', priceEgp: 1000, durationDays: 365, isActive: true, sortOrder: 2 },
  })

  const canonicalIds = [monthlyPlan.id, annualPlan.id]

  // Protected account's plan references must never be touched.
  const prot = await prisma.user.findUnique({
    where: { email: PROTECTED_EMAIL },
    select: { id: true },
  })
  if (!prot) {
    console.error('❌ Protected user not found — aborting')
    process.exit(1)
  }
  const [protSubs, protReqs] = await Promise.all([
    prisma.subscription.findMany({ where: { userId: prot.id }, select: { id: true, planId: true } }),
    prisma.subscriptionRequest.findMany({ where: { userId: prot.id }, select: { id: true, planId: true } }),
  ])
  const protectedPlanIds = new Set<string>()
  const protectedSubIds = new Set(protSubs.map((s) => s.id))
  const protectedReqIds = new Set(protReqs.map((r) => r.id))
  protSubs.forEach((s) => protectedPlanIds.add(s.planId))
  protReqs.forEach((r) => protectedPlanIds.add(r.planId))
  console.log('🔒 Protected user ID:', prot.id)

  // Reassign only NON-protected rows off any other legacy plans.
  const legacy = await prisma.plan.findMany({
    where: { id: { notIn: canonicalIds } },
    select: { id: true, name: true, durationDays: true },
  })
  for (const old of legacy) {
    if (protectedPlanIds.has(old.id)) {
      console.log(`🔒 Keeping legacy plan "${old.name}" — referenced by protected account`)
      continue
    }
    const targetId = (old.durationDays ?? 30) <= 90 ? monthlyPlan.id : annualPlan.id
    const rs = await prisma.subscription.updateMany({
      where: { planId: old.id, id: { notIn: [...protectedSubIds] } },
      data: { planId: targetId },
    })
    const rr = await prisma.subscriptionRequest.updateMany({
      where: { planId: old.id, id: { notIn: [...protectedReqIds] } },
      data: { planId: targetId },
    })
    console.log(`Reassigned "${old.name}": ${rs.count} subs, ${rr.count} reqs`)
    const remaining = await prisma.plan.findUnique({
      where: { id: old.id },
      select: { _count: { select: { subscriptions: true, requests: true } } },
    })
    if (remaining && remaining._count.subscriptions === 0 && remaining._count.requests === 0) {
      await prisma.plan.delete({ where: { id: old.id } })
      console.log(`Deleted unreferenced legacy plan "${old.name}"`)
    } else {
      console.log(`Keeping "${old.name}" — still referenced, will be cleaned after test-user purge`)
    }
  }

  const final = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { name: true, priceEgp: true, durationDays: true, isActive: true },
  })
  console.log('FINAL:', JSON.stringify(final))
  console.log('✅ Plans: Monthly 150 EGP / Annual 1000 EGP')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
