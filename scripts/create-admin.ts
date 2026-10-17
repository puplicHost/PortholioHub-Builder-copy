import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const EMAIL = (process.env.ADMIN_EMAIL || 'admin@portfoliohub.test').trim().toLowerCase()
const PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPortfolio2026!'
const DISPLAY_NAME = process.env.ADMIN_NAME || 'Admin'

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (existing) {
    console.log(`ℹ️ User already exists: ${EMAIL} (id=${existing.id}, isAdmin=${existing.isAdmin})`)
    if (!existing.isAdmin) {
      await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true, status: 'ACTIVE', emailVerified: true } })
      await prisma.profile.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id, isAdmin: true, displayName: existing.displayName || DISPLAY_NAME },
        update: { isAdmin: true },
      })
      console.log('✅ Promoted existing user to admin')
    }
    return
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      displayName: DISPLAY_NAME,
      isAdmin: true,
      emailVerified: true,
      status: 'ACTIVE',
      metadata: { createdBy: 'create-admin-script' },
    },
  })

  await prisma.profile.create({
    data: { userId: user.id, displayName: DISPLAY_NAME, isAdmin: true },
  })

  console.log('✅ Admin account created')
  console.log(`   email:    ${EMAIL}`)
  console.log(`   password: ${PASSWORD}`)
  console.log(`   id:       ${user.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
