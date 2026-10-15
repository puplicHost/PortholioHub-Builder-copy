import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Cross-request cache: the platform name changes only via admin settings,
// so one DB hit per 300 s serves all requests instead of one hit per request.
const getStoredPlatformName = unstable_cache(
  async (): Promise<string | null> => {
    const setting = await prisma.systemSetting
      .findUnique({
        where: { key: 'platform.name' },
        select: { value: true },
      })
      .catch(() => null)
    const name = setting?.value
    if (typeof name === 'string' && name.trim()) return name.trim()
    return null
  },
  ['platform-name'],
  { revalidate: 300 },
)

export const getPlatformName = cache(async () => {
  try {
    const stored = await getStoredPlatformName()
    if (stored) return stored
  } catch {
    // fall through to env/default
  }

  return process.env.NEXT_PUBLIC_APP_NAME || 'PortfolioHub'
})
