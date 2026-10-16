import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Stable deterministic IDs for seed entities
const PLAN_IDS = {
  monthly: '11111111-1111-4111-8111-111111111111',
  quarterly: '22222222-2222-4222-8222-222222222222',
  annual: '33333333-3333-4333-8333-333333333333',
}

const USER_IDS = {
  u1: 'a1000000-0000-4000-8000-000000000001',
  u2: 'a1000000-0000-4000-8000-000000000002',
  u3: 'a1000000-0000-4000-8000-000000000003',
  u4: 'a1000000-0000-4000-8000-000000000004',
  u5: 'a1000000-0000-4000-8000-000000000005',
  u6: 'a1000000-0000-4000-8000-000000000006',
  u7: 'a1000000-0000-4000-8000-000000000007',
  u8: 'a1000000-0000-4000-8000-000000000008',
  u9: 'a1000000-0000-4000-8000-000000000009',
  u10: 'a1000000-0000-4000-8000-000000000010',
  u11: 'a1000000-0000-4000-8000-000000000011',
  u12: 'a1000000-0000-4000-8000-000000000012',
  u13: 'a1000000-0000-4000-8000-000000000013',
  u14: 'a1000000-0000-4000-8000-000000000014',
  u15: 'a1000000-0000-4000-8000-000000000015',
}

const SUB_IDS = {
  u1_annual: 'b1000000-0000-4000-8000-000000000001',
  u2_monthly: 'b1000000-0000-4000-8000-000000000002',
  u3_quarterly: 'b1000000-0000-4000-8000-000000000003',
  u8_expired: 'b1000000-0000-4000-8000-000000000008',
  u9_expired: 'b1000000-0000-4000-8000-000000000009',
  u14_past1: 'b1000000-0000-4000-8000-000000000014',
  u14_past2: 'b1000000-0000-4000-8000-000000000015',
  u14_active: 'b1000000-0000-4000-8000-000000000016',
}

const PAYMENT_IDS = {
  p1: 'c1000000-0000-4000-8000-000000000001',
  p2: 'c1000000-0000-4000-8000-000000000002',
  p3: 'c1000000-0000-4000-8000-000000000003',
  p4: 'c1000000-0000-4000-8000-000000000004',
  p5: 'c1000000-0000-4000-8000-000000000005',
  p6: 'c1000000-0000-4000-8000-000000000006',
  p7: 'c1000000-0000-4000-8000-000000000007',
  p8: 'c1000000-0000-4000-8000-000000000008',
  p9: 'c1000000-0000-4000-8000-000000000009',
  p10: 'c1000000-0000-4000-8000-000000000010',
  p11: 'c1000000-0000-4000-8000-000000000011',
  p12: 'c1000000-0000-4000-8000-000000000012',
}

const PORTFOLIO_IDS = {
  u1: 'd1000000-0000-4000-8000-000000000001',
  u2: 'd1000000-0000-4000-8000-000000000002',
  u3: 'd1000000-0000-4000-8000-000000000003',
  u4: 'd1000000-0000-4000-8000-000000000004',
  u5: 'd1000000-0000-4000-8000-000000000005',
  u6: 'd1000000-0000-4000-8000-000000000006',
  u8: 'd1000000-0000-4000-8000-000000000008',
  u14: 'd1000000-0000-4000-8000-000000000014',
}

const ANNOUNCEMENT_IDS = {
  a1: 'e1000000-0000-4000-8000-000000000001',
  a2: 'e1000000-0000-4000-8000-000000000002',
}

const AUDIT_IDS = {
  entry1: 'f1000000-0000-4000-8000-000000000001',
  entry2: 'f1000000-0000-4000-8000-000000000002',
  entry3: 'f1000000-0000-4000-8000-000000000003',
  entry4: 'f1000000-0000-4000-8000-000000000004',
  entry5: 'f1000000-0000-4000-8000-000000000005',
  entry6: 'f1000000-0000-4000-8000-000000000006',
  entry7: 'f1000000-0000-4000-8000-000000000007',
  entry8: 'f1000000-0000-4000-8000-000000000008',
  entry9: 'f1000000-0000-4000-8000-000000000009',
  entry10: 'f1000000-0000-4000-8000-000000000010',
  entry11: 'f1000000-0000-4000-8000-000000000011',
  entry12: 'f1000000-0000-4000-8000-000000000012',
  entry13: 'f1000000-0000-4000-8000-000000000013',
  entry14: 'f1000000-0000-4000-8000-000000000014',
  entry15: 'f1000000-0000-4000-8000-000000000015',
  entry16: 'f1000000-0000-4000-8000-000000000016',
  entry17: 'f1000000-0000-4000-8000-000000000017',
  entry18: 'f1000000-0000-4000-8000-000000000018',
  entry19: 'f1000000-0000-4000-8000-000000000019',
  entry20: 'f1000000-0000-4000-8000-000000000020',
}

async function main() {
  console.log('🌱 Starting PortfolioHub realistic Arabic test database seeding...')

  // Identify admin user for relations
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: 'asc' },
  })
  const adminId = adminUser?.id || null
  console.log(`ℹ️ Admin user identified: ${adminUser?.email || 'None'} (${adminId})`)

  const defaultPasswordHash = bcrypt.hashSync('PortfolioHub2026!', 10)
  const now = new Date()

  // --------------------------------------------------------------------------
  // 1. PLANS (3 plans)
  // --------------------------------------------------------------------------
  console.log('📦 Seeding subscription plans...')
  const plansData = [
    {
      id: PLAN_IDS.monthly,
      name: 'الخطة الشهرية',
      nameI18n: { ar: 'الخطة الشهرية', en: 'Monthly Plan' },
      priceEgp: 99,
      priceEgpAnnual: 990,
      durationDays: 30,
      limits: { maxPortfolios: 1, customDomain: false },
      workspaceLimit: 1,
      postsPerMonth: 30,
      storageMb: 500,
      isActive: true,
      trialDays: 7,
      sortOrder: 1,
      features: ['بناء بورتفوليو احترافي سريع', 'دومين فرعي مخصص (username.portfoliohub.me)', 'دعم فني سريع عبر الواتساب', 'تحليلات أساسية لزوار الموقع'],
    },
    {
      id: PLAN_IDS.quarterly,
      name: 'الخطة الربع سنوية',
      nameI18n: { ar: 'الخطة الربع سنوية', en: 'Quarterly Plan' },
      priceEgp: 249,
      priceEgpAnnual: 996,
      durationDays: 90,
      limits: { maxPortfolios: 3, customDomain: true },
      workspaceLimit: 3,
      postsPerMonth: 100,
      storageMb: 2000,
      isActive: true,
      trialDays: 14,
      sortOrder: 2,
      features: ['كل مميزات الخطة الشهرية', 'ربط دومين مخصص كامل', 'إزالة شعار المنصة', 'أولوية متقدمة في الدعم الفني'],
    },
    {
      id: PLAN_IDS.annual,
      name: 'الخطة السنوية',
      nameI18n: { ar: 'الخطة السنوية', en: 'Annual Plan' },
      priceEgp: 799,
      priceEgpAnnual: 799,
      durationDays: 365,
      limits: { maxPortfolios: 10, customDomain: true },
      workspaceLimit: 10,
      postsPerMonth: 500,
      storageMb: 10000,
      isActive: true,
      trialDays: 14,
      sortOrder: 3,
      features: ['كل مميزات الخطة الربع سنوية', 'خصم أكثر من 35% على الاشتراك', 'شهادة أمان SSL مجانية', 'مدير حساب مخصص', 'تصدير السيرة الذاتية بصيغة PDF'],
    },
  ]

  let plansCount = 0
  for (const p of plansData) {
    await prisma.plan.upsert({
      where: { id: p.id },
      create: p,
      update: p,
    })
    plansCount++
  }
  console.log(`✅ Plans seeded: ${plansCount}`)

  // --------------------------------------------------------------------------
  // 2. USERS (15 users)
  // --------------------------------------------------------------------------
  console.log('👥 Seeding users...')
  const usersData = [
    // 3 active paid users
    {
      id: USER_IDS.u1,
      displayName: 'أحمد حسن الديب',
      email: 'ahmed.hassan.dev@gmail.com',
      phone: '+201019842511',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 2 * 3600 * 1000), // 2h ago
      createdAt: new Date(now.getTime() - 45 * 86400 * 1000),
    },
    {
      id: USER_IDS.u2,
      displayName: 'سارة محمد الشريف',
      email: 'sara.m.design@gmail.com',
      phone: '+201123489102',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 24 * 3600 * 1000), // 1d ago
      createdAt: new Date(now.getTime() - 30 * 86400 * 1000),
    },
    {
      id: USER_IDS.u3,
      displayName: 'عمر خالد العوضي',
      email: 'omar.khaled.ui@hotmail.com',
      phone: '+201287654321',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 3 * 86400 * 1000), // 3d ago
      createdAt: new Date(now.getTime() - 60 * 86400 * 1000),
    },
    // 2 users with pending subscription requests
    {
      id: USER_IDS.u4,
      displayName: 'نور إبراهيم الدسوقي',
      email: 'nour.ibrahim.copy@gmail.com',
      phone: '+201065432198',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 5 * 3600 * 1000),
      createdAt: new Date(now.getTime() - 5 * 86400 * 1000),
    },
    {
      id: USER_IDS.u5,
      displayName: 'يوسف محمود النجار',
      email: 'youssef.elngar@gmail.com',
      phone: '+201198765432',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 12 * 3600 * 1000),
      createdAt: new Date(now.getTime() - 2 * 86400 * 1000),
    },
    // 2 suspended users
    {
      id: USER_IDS.u6,
      displayName: 'كريم عبد العزيز الرفاعي',
      email: 'karim.refaie.marketing@gmail.com',
      phone: '+201234567812',
      status: 'SUSPENDED',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 15 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 40 * 86400 * 1000),
    },
    {
      id: USER_IDS.u7,
      displayName: 'مي طارق العبد',
      email: 'mai.tarek.pr@hotmail.com',
      phone: '+201098712345',
      status: 'SUSPENDED',
      emailVerified: false,
      lastLoginAt: new Date(now.getTime() - 20 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 50 * 86400 * 1000),
    },
    // 2 expired subscriptions
    {
      id: USER_IDS.u8,
      displayName: 'محمود سالم الجوهري',
      email: 'mahmoud.salem.dev@gmail.com',
      phone: '+201155443322',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 4 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 75 * 86400 * 1000),
    },
    {
      id: USER_IDS.u9,
      displayName: 'رانيا عبد الله الشرقاوي',
      email: 'rania.sharkawy.art@gmail.com',
      phone: '+201222334455',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 6 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 110 * 86400 * 1000),
    },
    // 2 free tier users (no subscription)
    {
      id: USER_IDS.u10,
      displayName: 'مصطفى هشام صبري',
      email: 'mostafa.hesham.writer@gmail.com',
      phone: '+201033221144',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 2 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 10 * 86400 * 1000),
    },
    {
      id: USER_IDS.u11,
      displayName: 'دينا أشرف السعيد',
      email: 'dina.ashraf.photo@gmail.com',
      phone: '+201144556677',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 1 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 14 * 86400 * 1000),
    },
    // 2 users who never logged in after registration
    {
      id: USER_IDS.u12,
      displayName: 'حمزة طلال العسقلاني',
      email: 'hamza.talal.motion@gmail.com',
      phone: '+201277889900',
      status: 'ACTIVE',
      emailVerified: false,
      lastLoginAt: null,
      createdAt: new Date(now.getTime() - 2 * 86400 * 1000),
    },
    {
      id: USER_IDS.u13,
      displayName: 'هنا سامح الباز',
      email: 'hana.sameh.voice@hotmail.com',
      phone: '+201088991122',
      status: 'ACTIVE',
      emailVerified: false,
      lastLoginAt: null,
      createdAt: new Date(now.getTime() - 7 * 86400 * 1000),
    },
    // 1 user with multiple subscription history (renewed twice)
    {
      id: USER_IDS.u14,
      displayName: 'طارق زياد القاضي',
      email: 'tarek.ziad.consult@gmail.com',
      phone: '+201166778899',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 3 * 3600 * 1000),
      createdAt: new Date(now.getTime() - 90 * 86400 * 1000),
    },
    // 1 user with a failed/unconfirmed payment
    {
      id: USER_IDS.u15,
      displayName: 'خديجة إبراهيم المناوي',
      email: 'khadija.elmenawy@gmail.com',
      phone: '+201211223344',
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: new Date(now.getTime() - 1 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 3 * 86400 * 1000),
    },
  ]

  let usersCount = 0
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        id: u.id,
        email: u.email,
        phone: u.phone,
        displayName: u.displayName,
        passwordHash: defaultPasswordHash,
        isAdmin: false,
        emailVerified: u.emailVerified,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      },
      update: {
        phone: u.phone,
        displayName: u.displayName,
        status: u.status,
        emailVerified: u.emailVerified,
        lastLoginAt: u.lastLoginAt,
      },
    })

    // Also populate corresponding Profile
    await prisma.profile.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        displayName: u.displayName,
        phone: u.phone,
        isAdmin: false,
      },
      update: {
        displayName: u.displayName,
        phone: u.phone,
      },
    })

    usersCount++
  }
  console.log(`✅ Users seeded: ${usersCount}`)

  // --------------------------------------------------------------------------
  // 3. SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  console.log('💳 Seeding subscriptions...')
  const subscriptionsData = [
    // User 1: Active Annual subscription
    {
      id: SUB_IDS.u1_annual,
      userId: USER_IDS.u1,
      planId: PLAN_IDS.annual,
      status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      expiresAt: new Date(now.getTime() + 340 * 86400 * 1000), // ~340 days remaining
      canceledAt: null,
      paymentProvider: 'Card (CIB)',
      amountEgp: 799,
      createdBy: 'USER',
    },
    // User 2: Active Monthly subscription
    {
      id: SUB_IDS.u2_monthly,
      userId: USER_IDS.u2,
      planId: PLAN_IDS.monthly,
      status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 8 * 86400 * 1000),
      expiresAt: new Date(now.getTime() + 22 * 86400 * 1000), // 22 days remaining
      canceledAt: null,
      paymentProvider: 'InstaPay',
      amountEgp: 99,
      createdBy: 'ADMIN',
    },
    // User 3: Active Quarterly subscription
    {
      id: SUB_IDS.u3_quarterly,
      userId: USER_IDS.u3,
      planId: PLAN_IDS.quarterly,
      status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      expiresAt: new Date(now.getTime() + 65 * 86400 * 1000), // 65 days remaining
      canceledAt: null,
      paymentProvider: 'Vodafone Cash',
      amountEgp: 249,
      createdBy: 'ADMIN',
    },
    // User 8: Expired Monthly subscription
    {
      id: SUB_IDS.u8_expired,
      userId: USER_IDS.u8,
      planId: PLAN_IDS.monthly,
      status: 'EXPIRED',
      startedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      expiresAt: new Date(now.getTime() - 10 * 86400 * 1000), // Expired 10 days ago
      canceledAt: null,
      paymentProvider: 'Banque Misr Transfer',
      amountEgp: 99,
      createdBy: 'USER',
    },
    // User 9: Expired Quarterly subscription
    {
      id: SUB_IDS.u9_expired,
      userId: USER_IDS.u9,
      planId: PLAN_IDS.quarterly,
      status: 'EXPIRED',
      startedAt: new Date(now.getTime() - 95 * 86400 * 1000),
      expiresAt: new Date(now.getTime() - 5 * 86400 * 1000), // Expired 5 days ago
      canceledAt: null,
      paymentProvider: 'InstaPay',
      amountEgp: 249,
      createdBy: 'USER',
    },
    // User 14: Sub 1 (Oldest, expired)
    {
      id: SUB_IDS.u14_past1,
      userId: USER_IDS.u14,
      planId: PLAN_IDS.monthly,
      status: 'EXPIRED',
      startedAt: new Date(now.getTime() - 70 * 86400 * 1000),
      expiresAt: new Date(now.getTime() - 40 * 86400 * 1000),
      canceledAt: null,
      paymentProvider: 'InstaPay',
      amountEgp: 99,
      createdBy: 'USER',
    },
    // User 14: Sub 2 (Renewed once, expired)
    {
      id: SUB_IDS.u14_past2,
      userId: USER_IDS.u14,
      planId: PLAN_IDS.monthly,
      status: 'EXPIRED',
      startedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      expiresAt: new Date(now.getTime() - 10 * 86400 * 1000),
      canceledAt: null,
      paymentProvider: 'Fawry',
      amountEgp: 99,
      createdBy: 'USER',
    },
    // User 14: Sub 3 (Renewed twice, currently ACTIVE)
    {
      id: SUB_IDS.u14_active,
      userId: USER_IDS.u14,
      planId: PLAN_IDS.monthly,
      status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 10 * 86400 * 1000),
      expiresAt: new Date(now.getTime() + 20 * 86400 * 1000),
      canceledAt: null,
      paymentProvider: 'Vodafone Cash',
      amountEgp: 99,
      createdBy: 'USER',
    },
  ]

  for (const s of subscriptionsData) {
    await prisma.subscription.upsert({
      where: { id: s.id },
      create: s,
      update: s,
    })
  }
  console.log(`✅ Subscriptions seeded: ${subscriptionsData.length}`)

  // --------------------------------------------------------------------------
  // 4. SUBSCRIPTION REQUESTS (8 requests)
  // --------------------------------------------------------------------------
  console.log('📥 Seeding subscription requests...')
  const requestsData = [
    // 1 PENDING standard
    {
      code: 'REQ-202610-101',
      userId: USER_IDS.u4,
      planId: PLAN_IDS.monthly,
      status: 'PENDING',
      note: 'طلب اشتراك جديد في الخطة الشهرية عبر التحويل البنكي',
      createdAt: new Date(now.getTime() - 5 * 3600 * 1000),
    },
    // 1 PENDING with InstaPay note
    {
      code: 'REQ-202610-102',
      userId: USER_IDS.u5,
      planId: PLAN_IDS.annual,
      status: 'PENDING',
      note: 'تم التحويل عبر انستا باي - رقم المعاملة INSTA-992384',
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
    // 1 PENDING standard
    {
      code: 'REQ-202610-103',
      userId: USER_IDS.u15,
      planId: PLAN_IDS.monthly,
      status: 'PENDING',
      note: 'تحويل عبر فودافون كاش - في انتظار التأكيد ومطابقة الإيصال',
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
    // 1 PENDING standard (making 3 standard + 1 with InstaPay note = 4 pending requests)
    {
      code: 'REQ-202610-104',
      userId: USER_IDS.u10,
      planId: PLAN_IDS.quarterly,
      status: 'PENDING',
      note: 'طلب ترقية الحساب المجاني إلى الخطة الربع سنوية',
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
    },
    // 2 APPROVED requests
    {
      code: 'REQ-202609-081',
      userId: USER_IDS.u1,
      planId: PLAN_IDS.annual,
      status: 'APPROVED',
      note: 'تم سداد الرسوم 799 جنيه وتأكيد المعاملة بنجاح',
      handledBy: adminId,
      handledAt: new Date(now.getTime() - 25 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000 - 3600 * 1000),
    },
    {
      code: 'REQ-202610-090',
      userId: USER_IDS.u2,
      planId: PLAN_IDS.monthly,
      status: 'APPROVED',
      note: 'تم التأكد من إيصال التحويل عبر انستا باي وتفعيل الخطة',
      handledBy: adminId,
      handledAt: new Date(now.getTime() - 8 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 8 * 86400 * 1000 - 7200 * 1000),
    },
    // 2 REJECTED requests (with rejection reason)
    {
      code: 'REQ-202610-095',
      userId: USER_IDS.u11,
      planId: PLAN_IDS.monthly,
      status: 'REJECTED',
      note: 'رقم إيصال التحويل غير مطابق لكشف الحساب البنكي، يرجى إعادة الإرسال بصورة واضحة للإيصال',
      handledBy: adminId,
      handledAt: new Date(now.getTime() - 3 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 4 * 86400 * 1000),
    },
    {
      code: 'REQ-202610-096',
      userId: USER_IDS.u12,
      planId: PLAN_IDS.annual,
      status: 'REJECTED',
      note: 'تم إلغاء الطلب بناء على رغبة العميل لعدم توافر وسيلة الدفع حالياً',
      handledBy: adminId,
      handledAt: new Date(now.getTime() - 1 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 2 * 86400 * 1000),
    },
  ]

  let requestsCount = 0
  for (const r of requestsData) {
    await prisma.subscriptionRequest.upsert({
      where: { code: r.code },
      create: r,
      update: r,
    })
    requestsCount++
  }
  console.log(`✅ Subscription requests seeded: ${requestsCount}`)

  // --------------------------------------------------------------------------
  // 5. PAYMENTS (12 payment records)
  // --------------------------------------------------------------------------
  console.log('💰 Seeding payments...')
  const paymentsData = [
    // 1. Confirmed - Card (Annual: 799 EGP)
    {
      id: PAYMENT_IDS.p1,
      userId: USER_IDS.u1,
      subscriptionId: SUB_IDS.u1_annual,
      provider: 'Card (CIB)',
      orderId: 'PAY-CIB-202609-9012',
      amountEgp: 799,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000),
      metadata: { gateway: 'Paymob', maskedPan: '************4821', authCode: 'AUTH891204' },
    },
    // 2. Confirmed - InstaPay (Monthly: 99 EGP)
    {
      id: PAYMENT_IDS.p2,
      userId: USER_IDS.u2,
      subscriptionId: SUB_IDS.u2_monthly,
      provider: 'InstaPay',
      orderId: 'INSTA-20261008-3194',
      amountEgp: 99,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 8 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 8 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 8 * 86400 * 1000),
      metadata: { senderHandle: 'sara.elcherif@instapay', refNum: '3194882019' },
    },
    // 3. Confirmed - Vodafone Cash (Quarterly: 249 EGP)
    {
      id: PAYMENT_IDS.p3,
      userId: USER_IDS.u3,
      subscriptionId: SUB_IDS.u3_quarterly,
      provider: 'Vodafone Cash',
      orderId: 'VF-20260812-7810',
      amountEgp: 249,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 25 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000),
      metadata: { senderWallet: '01019842511', transferRef: 'VF7810349' },
    },
    // 4. Confirmed - InstaPay (User 14, Past sub 1: 99 EGP)
    {
      id: PAYMENT_IDS.p4,
      userId: USER_IDS.u14,
      subscriptionId: SUB_IDS.u14_past1,
      provider: 'InstaPay',
      orderId: 'INSTA-20260805-1102',
      amountEgp: 99,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 70 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 70 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 70 * 86400 * 1000),
      metadata: { senderHandle: 'tarek.kadi@instapay', refNum: '1102948172' },
    },
    // 5. Confirmed - Fawry (User 14, Past sub 2: 99 EGP)
    {
      id: PAYMENT_IDS.p5,
      userId: USER_IDS.u14,
      subscriptionId: SUB_IDS.u14_past2,
      provider: 'Fawry',
      orderId: 'FAWRY-20260904-4589',
      amountEgp: 99,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 40 * 86400 * 1000),
      metadata: { fawryRef: '99201948123', branch: 'Nasr City 2' },
    },
    // 6. Confirmed - Vodafone Cash (User 14, Current active sub: 99 EGP)
    {
      id: PAYMENT_IDS.p6,
      userId: USER_IDS.u14,
      subscriptionId: SUB_IDS.u14_active,
      provider: 'Vodafone Cash',
      orderId: 'VF-20261006-9934',
      amountEgp: 99,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 10 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 10 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 10 * 86400 * 1000),
      metadata: { senderWallet: '01066778899', transferRef: 'VF9934812' },
    },
    // 7. Confirmed - Bank Transfer (User 8: 99 EGP)
    {
      id: PAYMENT_IDS.p7,
      userId: USER_IDS.u8,
      subscriptionId: SUB_IDS.u8_expired,
      provider: 'Banque Misr Transfer',
      orderId: 'BM-20260905-6671',
      amountEgp: 99,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 40 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 40 * 86400 * 1000),
      metadata: { ibanEnding: 'EG4900020000000000123456789', note: 'اشتراك شهري' },
    },
    // 8. Pending (Unconfirmed) - InstaPay (Annual: 799 EGP)
    {
      id: PAYMENT_IDS.p8,
      userId: USER_IDS.u5,
      subscriptionId: null,
      provider: 'InstaPay',
      orderId: 'INSTA-20261015-4821',
      amountEgp: 799,
      currency: 'EGP',
      status: 'PENDING',
      confirmedBy: null,
      confirmedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000),
      metadata: { senderHandle: 'youssef.architect@instapay', transferNote: 'الخطة السنوية يوسف النجار' },
    },
    // 9. Pending (Unconfirmed) - Vodafone Cash (Monthly: 99 EGP)
    {
      id: PAYMENT_IDS.p9,
      userId: USER_IDS.u4,
      subscriptionId: null,
      provider: 'Vodafone Cash',
      orderId: 'VF-9934821',
      amountEgp: 99,
      currency: 'EGP',
      status: 'PENDING',
      confirmedBy: null,
      confirmedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 5 * 3600 * 1000),
      metadata: { senderWallet: '01065432198', note: 'بانتظار مطابقة رسالة فودافون كاش' },
    },
    // 10. Pending (Unconfirmed) - InstaPay (Quarterly: 249 EGP)
    {
      id: PAYMENT_IDS.p10,
      userId: USER_IDS.u10,
      subscriptionId: null,
      provider: 'InstaPay',
      orderId: 'INSTA-20261016-1049',
      amountEgp: 249,
      currency: 'EGP',
      status: 'PENDING',
      confirmedBy: null,
      confirmedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      metadata: { senderHandle: 'mostafa.hesham@instapay', transferNote: 'ترقية الخطة الربع سنوية' },
    },
    // 11. Failed Payment - Vodafone Cash (Monthly: 99 EGP)
    {
      id: PAYMENT_IDS.p11,
      userId: USER_IDS.u15,
      subscriptionId: null,
      provider: 'Vodafone Cash',
      orderId: 'VF-FAILED-8831',
      amountEgp: 99,
      currency: 'EGP',
      status: 'FAILED',
      confirmedBy: null,
      confirmedAt: null,
      completedAt: null,
      createdAt: new Date(now.getTime() - 1 * 86400 * 1000),
      metadata: { error: 'رصيد غير كاف في المحفظة، تم إلغاء المعاملة تلقائياً من مزود الخدمة' },
    },
    // 12. Confirmed - InstaPay (User 9, Expired Quarterly sub: 249 EGP)
    {
      id: PAYMENT_IDS.p12,
      userId: USER_IDS.u9,
      subscriptionId: SUB_IDS.u9_expired,
      provider: 'InstaPay',
      orderId: 'INSTA-20260710-5541',
      amountEgp: 249,
      currency: 'EGP',
      status: 'CONFIRMED',
      confirmedBy: adminId,
      confirmedAt: new Date(now.getTime() - 95 * 86400 * 1000),
      completedAt: new Date(now.getTime() - 95 * 86400 * 1000),
      createdAt: new Date(now.getTime() - 95 * 86400 * 1000),
      metadata: { senderHandle: 'rania.art@instapay', refNum: '554190821' },
    },
  ]

  let paymentsCount = 0
  for (const p of paymentsData) {
    await prisma.payment.upsert({
      where: { id: p.id },
      create: p,
      update: p,
    })
    paymentsCount++
  }
  console.log(`✅ Payments seeded: ${paymentsCount}`)

  // --------------------------------------------------------------------------
  // 6. PORTFOLIOS (8 portfolios)
  // --------------------------------------------------------------------------
  console.log('🎨 Seeding portfolios (UserProfile)...')
  const portfoliosData = [
    // 1. Published (ahmed-hassan)
    {
      id: PORTFOLIO_IDS.u1,
      userId: USER_IDS.u1,
      username: 'ahmed-hassan',
      displayName: 'أحمد حسن الديب',
      professionalTitle: 'مطور برمجيات أول ومستشار تقني (Full-Stack Engineer)',
      bio: 'مطور واجهات وتطبيقات سحابية بخبرة تزيد عن 6 سنوات في بناء منصات الويب السريعة باستخدام Next.js، TypeScript و PostgreSQL في السوق المصري والإقليمي.',
      location: 'القاهرة، مصر',
      skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'Redis'],
      status: 'PUBLISHED',
      adminHidden: false,
      adminHiddenReason: null,
      version: 2,
      createdAt: new Date(now.getTime() - 40 * 86400 * 1000),
    },
    // 2. Published (sara-design)
    {
      id: PORTFOLIO_IDS.u2,
      userId: USER_IDS.u2,
      username: 'sara-design',
      displayName: 'سارة محمد الشريف',
      professionalTitle: 'مصممة واجهات وتجربة مستخدم (Product & UI/UX Designer)',
      bio: 'أساعد الشركات الناشئة ورواد الأعمال على تحويل الأفكار المعقدة إلى منتجات رقمية جذابة وسهلة الاستخدام تركز على العميل.',
      location: 'الإسكندرية، مصر',
      skills: ['Figma', 'UI Design', 'Design Systems', 'User Research', 'Wireframing', 'Prototyping', 'Mobile App UX'],
      status: 'PUBLISHED',
      adminHidden: false,
      adminHiddenReason: null,
      version: 1,
      createdAt: new Date(now.getTime() - 28 * 86400 * 1000),
    },
    // 3. Published (omar-dev)
    {
      id: PORTFOLIO_IDS.u3,
      userId: USER_IDS.u3,
      username: 'omar-dev',
      displayName: 'عمر خالد العوضي',
      professionalTitle: 'مهندس واجهات أمامية متخصص في React & Vue (Frontend Specialist)',
      bio: 'متخصص في بناء لوحات التحكم المعقدة وتطبيقات الويب التفاعلية عالية الأداء مع دعم احترافي كامل للغة العربية والاتجاه من اليمين لليسار RTL.',
      location: 'الجيزة، مصر',
      skills: ['Vue.js', 'Nuxt', 'React', 'Next.js', 'Tailwind CSS', 'State Management', 'Web Accessibility (a11y)'],
      status: 'PUBLISHED',
      adminHidden: false,
      adminHiddenReason: null,
      version: 1,
      createdAt: new Date(now.getTime() - 55 * 86400 * 1000),
    },
    // 4. Draft (nour-copywriter)
    {
      id: PORTFOLIO_IDS.u4,
      userId: USER_IDS.u4,
      username: 'nour-copywriter',
      displayName: 'نور إبراهيم الدسوقي',
      professionalTitle: 'كاتبة محتوى إبداعي ومتخصصة تسويق رقمي',
      bio: 'كتابة نصوص إعلانية ترفع نسب التحويل، وصياغة مقالات متوافقة مع محركات البحث SEO للمتاجر الإلكترونية والشركات الناشئة.',
      location: 'المنصورة، مصر',
      skills: ['Copywriting', 'SEO Content', 'Email Marketing', 'Brand Storytelling', 'Social Media Copy'],
      status: 'DRAFT',
      adminHidden: false,
      adminHiddenReason: null,
      version: 1,
      createdAt: new Date(now.getTime() - 4 * 86400 * 1000),
    },
    // 5. Draft (youssef-architect)
    {
      id: PORTFOLIO_IDS.u5,
      userId: USER_IDS.u5,
      username: 'youssef-architect',
      displayName: 'يوسف محمود النجار',
      professionalTitle: 'مهندس معماري ومصمم ديكور داخلي 3D',
      bio: 'تصميم وتنفيذ مشاريع سكنية وتجارية راقية بأحدث المعايير الهندسية مع رندرات واقعية ثلاثية الأبعاد.',
      location: 'القاهرة، مصر',
      skills: ['3ds Max', 'AutoCAD', 'Revit', 'Interior Design', 'V-Ray Rendering', 'Landscape Architecture'],
      status: 'DRAFT',
      adminHidden: false,
      adminHiddenReason: null,
      version: 1,
      createdAt: new Date(now.getTime() - 2 * 86400 * 1000),
    },
    // 6. Hidden - Suspended user (karim-refaie)
    {
      id: PORTFOLIO_IDS.u6,
      userId: USER_IDS.u6,
      username: 'karim-refaie',
      displayName: 'كريم عبد العزيز الرفاعي',
      professionalTitle: 'خبير إعلانات ممولة وتسويق رقمي',
      bio: 'إدارة الحملات الإعلانية على منصات التواصل الاجتماعي وتحقيق أعلى عائد استثماري.',
      location: 'طنطا، مصر',
      skills: ['Media Buying', 'Facebook Ads', 'TikTok Ads', 'Google Ads', 'Conversion Tracking'],
      status: 'PUBLISHED',
      adminHidden: true,
      adminHiddenReason: 'مخالفة معايير المجتمع ونشر إعلانات سبام مضللة وروابط خارجية غير موثوقة',
      version: 1,
      createdAt: new Date(now.getTime() - 35 * 86400 * 1000),
    },
    // 7. Hidden - Expired subscription (mahmoud-salem)
    {
      id: PORTFOLIO_IDS.u8,
      userId: USER_IDS.u8,
      username: 'mahmoud-salem',
      displayName: 'محمود سالم الجوهري',
      professionalTitle: 'مطور تطبيقات هواتف ذكية (Flutter & Cross-Platform)',
      bio: 'بناء تطبيقات الجوال المعتمدة على السحابة وتكامل بوابات الدفع الإلكترونية في مصر والخليج.',
      location: 'أسيوط، مصر',
      skills: ['Flutter', 'Dart', 'Firebase', 'State Management', 'REST APIs', 'Mobile Payment Integration'],
      status: 'PUBLISHED',
      adminHidden: true,
      adminHiddenReason: 'انتهاء فترة الاشتراك وعدم التجديد بعد فترة السماح القانونية',
      version: 1,
      createdAt: new Date(now.getTime() - 70 * 86400 * 1000),
    },
    // 8. Draft (tarek-consult)
    {
      id: PORTFOLIO_IDS.u14,
      userId: USER_IDS.u14,
      username: 'tarek-consult',
      displayName: 'طارق زياد القاضي',
      professionalTitle: 'مستشار تطوير أعمال واستراتيجيات نمو للمستقلين والشركات',
      bio: 'مساعدة الفريلانسرز ورواد الأعمال في مصر على تسعير خدماتهم وبناء هوية مهنية جاذبة للعملاء الدوليين.',
      location: 'المعادي، القاهرة',
      skills: ['Business Strategy', 'Pricing Models', 'Market Research', 'Proposal Writing', 'Client Acquisition'],
      status: 'DRAFT',
      adminHidden: false,
      adminHiddenReason: null,
      version: 1,
      createdAt: new Date(now.getTime() - 80 * 86400 * 1000),
    },
  ]

  let portfoliosCount = 0
  for (const port of portfoliosData) {
    await prisma.userProfile.upsert({
      where: { username: port.username },
      create: port,
      update: port,
    })
    portfoliosCount++
  }
  console.log(`✅ Portfolios seeded: ${portfoliosCount}`)

  // --------------------------------------------------------------------------
  // 7. ANNOUNCEMENTS (2 entries)
  // --------------------------------------------------------------------------
  console.log('📢 Seeding announcements...')
  const announcementsData = [
    {
      id: ANNOUNCEMENT_IDS.a1,
      title: 'مرحباً بكم في PortfolioHub — تم إطلاق الخطة السنوية بخصم 20%',
      body: 'يسعدنا الإعلان عن إطلاق الخطة السنوية الجديدة بمميزات حصرية تشمل ربط الدومين المخصص، إزالة الشعار، ومدير حساب شخصي لمساعدتك في انطلاقتك.',
      type: 'INFO',
      active: true,
      targetAudience: 'ALL',
      dismissible: true,
      startsAt: new Date(now.getTime() - 14 * 86400 * 1000),
      expiresAt: null,
      createdBy: adminId,
      createdAt: new Date(now.getTime() - 14 * 86400 * 1000),
    },
    {
      id: ANNOUNCEMENT_IDS.a2,
      title: 'سيتم إجراء صيانة مجدولة يوم الجمعة',
      body: 'نحيطكم علماً بأنه سيتم إجراء ترقية للبنية التحتية وتحسين أداء الخوادم يوم الجمعة القادمة من الساعة 3 صباحاً وحتى 5 صباحاً بتوقيت القاهرة.',
      type: 'WARNING',
      active: false,
      targetAudience: 'ALL',
      dismissible: true,
      startsAt: new Date(now.getTime() - 7 * 86400 * 1000),
      expiresAt: new Date(now.getTime() - 6 * 86400 * 1000),
      createdBy: adminId,
      createdAt: new Date(now.getTime() - 7 * 86400 * 1000),
    },
  ]

  let announcementsCount = 0
  for (const a of announcementsData) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      create: a,
      update: a,
    })
    announcementsCount++
  }
  console.log(`✅ Announcements seeded: ${announcementsCount}`)

  // --------------------------------------------------------------------------
  // 8. AUDIT LOG ENTRIES (20 entries)
  // --------------------------------------------------------------------------
  console.log('📜 Seeding audit log entries...')
  const auditLogsData = [
    {
      id: AUDIT_IDS.entry1,
      adminId,
      action: 'user.suspend',
      targetType: 'user',
      targetId: USER_IDS.u6,
      targetUserId: USER_IDS.u6,
      reason: 'تكرار نشر روابط مضللة وبلاغات متعددة من الزوار',
      metadata: { ip: '197.38.12.89', actorRole: 'SUPER_ADMIN' },
      createdAt: new Date(now.getTime() - 15 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry2,
      adminId,
      action: 'portfolio.hide',
      targetType: 'portfolio',
      targetId: 'karim-refaie',
      targetUserId: USER_IDS.u6,
      reason: 'مخالفة معايير المجتمع ونشر إعلانات سبام مضللة وروابط خارجية غير موثوقة',
      metadata: { portfolioSlug: 'karim-refaie', ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 15 * 86400 * 1000 + 60 * 1000),
    },
    {
      id: AUDIT_IDS.entry3,
      adminId,
      action: 'user.suspend',
      targetType: 'user',
      targetId: USER_IDS.u7,
      targetUserId: USER_IDS.u7,
      reason: 'استخدام الحساب في أنشطة مشبوهة ومحاولات اختراق متكررة',
      metadata: { ip: '197.38.12.89', actorRole: 'SUPER_ADMIN' },
      createdAt: new Date(now.getTime() - 20 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry4,
      adminId,
      action: 'subscription.approved',
      targetType: 'subscription_request',
      targetId: 'REQ-202609-081',
      targetUserId: USER_IDS.u1,
      reason: 'الموافقة على طلب الاشتراك السنوي بعد تأكيد الدفع عبر البطاقة البنكية',
      metadata: { plan: 'الخطة السنوية', amountEgp: 799, ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry5,
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: PAYMENT_IDS.p1,
      targetUserId: USER_IDS.u1,
      reason: 'تأكيد استلام رسوم الاشتراك السنوي 799 جنيه عبر بطاقة CIB',
      metadata: { orderId: 'PAY-CIB-202609-9012', provider: 'Card (CIB)', ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000 + 120 * 1000),
    },
    {
      id: AUDIT_IDS.entry6,
      adminId,
      action: 'subscription.approved',
      targetType: 'subscription_request',
      targetId: 'REQ-202610-090',
      targetUserId: USER_IDS.u2,
      reason: 'الموافقة على طلب الاشتراك الشهري عبر انستا باي',
      metadata: { plan: 'الخطة الشهرية', amountEgp: 99, ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 8 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry7,
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: PAYMENT_IDS.p2,
      targetUserId: USER_IDS.u2,
      reason: 'مطابقة كود تحويل انستا باي INSTA-20261008-3194 مع كشف الحساب البنكي',
      metadata: { orderId: 'INSTA-20261008-3194', provider: 'InstaPay', ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 8 * 86400 * 1000 + 180 * 1000),
    },
    {
      id: AUDIT_IDS.entry8,
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: PAYMENT_IDS.p3,
      targetUserId: USER_IDS.u3,
      reason: 'تأكيد رسالة التحويل 249 جنيه من محفظة فودافون كاش الرسمية',
      metadata: { orderId: 'VF-20260812-7810', provider: 'Vodafone Cash', ip: '197.38.12.89' },
      createdAt: new Date(now.getTime() - 25 * 86400 * 1000 + 300 * 1000),
    },
    {
      id: AUDIT_IDS.entry9,
      adminId,
      action: 'user.reset_password',
      targetType: 'user',
      targetId: USER_IDS.u3,
      targetUserId: USER_IDS.u3,
      reason: 'طلب العميل إعادة تعيين كلمة المرور عبر تذكرة الدعم الفني',
      metadata: { requestedBy: 'user', supportTicketId: 'TICK-4912' },
      createdAt: new Date(now.getTime() - 18 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry10,
      adminId,
      action: 'user.revoke_sessions',
      targetType: 'user',
      targetId: USER_IDS.u3,
      targetUserId: USER_IDS.u3,
      reason: 'تسجيل الخروج من كافة الأجهزة لدواعي أمان الحساب بعد تغيير كلمة السر',
      metadata: { terminatedSessionsCount: 2 },
      createdAt: new Date(now.getTime() - 18 * 86400 * 1000 + 60 * 1000),
    },
    {
      id: AUDIT_IDS.entry11,
      adminId,
      action: 'subscription.rejected',
      targetType: 'subscription_request',
      targetId: 'REQ-202610-095',
      targetUserId: USER_IDS.u11,
      reason: 'رقم إيصال التحويل غير مطابق لكشف الحساب، يرجى إعادة الإرسال',
      metadata: { requestRef: 'REQ-202610-095', amountEgp: 99 },
      createdAt: new Date(now.getTime() - 3 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry12,
      adminId,
      action: 'subscription.rejected',
      targetType: 'subscription_request',
      targetId: 'REQ-202610-096',
      targetUserId: USER_IDS.u12,
      reason: 'إلغاء الطلب بناء على رغبة العميل لعدم توافر المحفظة حالياً',
      metadata: { requestRef: 'REQ-202610-096', amountEgp: 799 },
      createdAt: new Date(now.getTime() - 1 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry13,
      adminId,
      action: 'portfolio.hide',
      targetType: 'portfolio',
      targetId: 'mahmoud-salem',
      targetUserId: USER_IDS.u8,
      reason: 'انتهاء فترة الاشتراك وعدم التجديد بعد فترة السماح القانونية',
      metadata: { portfolioSlug: 'mahmoud-salem', subExpiredDaysAgo: 10 },
      createdAt: new Date(now.getTime() - 5 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry14,
      adminId,
      action: 'subscription.extend',
      targetType: 'subscription',
      targetId: SUB_IDS.u14_active,
      targetUserId: USER_IDS.u14,
      reason: 'تمديد مجاني لمدة 3 أيام تعويضاً عن فترة التحديثات الدورية للخوادم',
      metadata: { addedDays: 3, plan: 'الخطة الشهرية' },
      createdAt: new Date(now.getTime() - 12 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry15,
      adminId,
      action: 'subscription.override',
      targetType: 'subscription',
      targetId: SUB_IDS.u14_active,
      targetUserId: USER_IDS.u14,
      reason: 'تعديل موعد انتهاء الاشتراك ليتوافق مع دورة الفاتورة الشهرية للعميل',
      metadata: { priorStatus: 'ACTIVE', newStatus: 'ACTIVE' },
      createdAt: new Date(now.getTime() - 10 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry16,
      adminId,
      action: 'user.edit',
      targetType: 'user',
      targetId: USER_IDS.u1,
      targetUserId: USER_IDS.u1,
      reason: 'تحديث رقم الهاتف ومطابقة البيانات الشخصية بناء على طلب المستخدم',
      metadata: { updatedFields: ['phone', 'displayName'] },
      createdAt: new Date(now.getTime() - 22 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry17,
      adminId,
      action: 'announcement.create',
      targetType: 'announcement',
      targetId: ANNOUNCEMENT_IDS.a1,
      targetUserId: null,
      reason: 'إطلاق إعلان الخصم السنوي لجميع المستخدمين في المنصة',
      metadata: { title: 'مرحباً بكم في PortfolioHub — تم إطلاق الخطة السنوية بخصم 20%', type: 'INFO' },
      createdAt: new Date(now.getTime() - 14 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry18,
      adminId,
      action: 'announcement.create',
      targetType: 'announcement',
      targetId: ANNOUNCEMENT_IDS.a2,
      targetUserId: null,
      reason: 'جدولة إعلان الصيانة الفنية لقاعدة البيانات وتحسين الأداء',
      metadata: { title: 'سيتم إجراء صيانة مجدولة يوم الجمعة', type: 'WARNING' },
      createdAt: new Date(now.getTime() - 7 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry19,
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: PAYMENT_IDS.p4,
      targetUserId: USER_IDS.u14,
      reason: 'تأكيد استلام أول اشتراك شهري للعميل عبر انستا باي',
      metadata: { orderId: 'INSTA-20260805-1102', amountEgp: 99 },
      createdAt: new Date(now.getTime() - 70 * 86400 * 1000),
    },
    {
      id: AUDIT_IDS.entry20,
      adminId,
      action: 'payment.confirm',
      targetType: 'payment',
      targetId: PAYMENT_IDS.p6,
      targetUserId: USER_IDS.u14,
      reason: 'تأكيد تجديد الاشتراك الشهري الثالث عبر فودافون كاش',
      metadata: { orderId: 'VF-20261006-9934', amountEgp: 99 },
      createdAt: new Date(now.getTime() - 10 * 86400 * 1000),
    },
  ]

  let auditEntriesCount = 0
  for (const entry of auditLogsData) {
    await prisma.adminAuditLog.upsert({
      where: { id: entry.id },
      create: entry,
      update: entry,
    })
    auditEntriesCount++
  }
  console.log(`✅ Audit log entries seeded: ${auditEntriesCount}`)

  const totalAdded =
    usersCount +
    plansCount +
    requestsCount +
    paymentsCount +
    portfoliosCount +
    auditEntriesCount +
    announcementsCount

  console.log('\n======================================================')
  console.log('✅ SEED COMPLETE')
  console.log(`- Users: ${usersCount} inserted`)
  console.log(`- Plans: ${plansCount} inserted`)
  console.log(`- Requests: ${requestsCount} inserted`)
  console.log(`- Payments: ${paymentsCount} inserted`)
  console.log(`- Portfolios: ${portfoliosCount} inserted`)
  console.log(`- Audit entries: ${auditEntriesCount} inserted`)
  console.log(`- Announcements: ${announcementsCount} inserted`)
  console.log(`Total records added: ${totalAdded}`)
  console.log('======================================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
