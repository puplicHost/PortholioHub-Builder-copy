import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export const getPlatformName = cache(async () => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'platform.name' },
      select: { value: true },
    })
    const name = setting?.value
    if (typeof name === 'string' && name.trim()) return name.trim()
  } catch {
    // fall through to env/default
  }

  return process.env.NEXT_PUBLIC_APP_NAME || 'PortfolioHub'
})
