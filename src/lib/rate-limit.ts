import { prisma } from '@/lib/prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAfterMs: number
}

// Fixed-window rate limiter backed by the `rate_limit_buckets` table
// (atomic increment inside a transaction; works across instances).
// Key examples: `login:email:<normalized>`, `login:ip:<ip>`, `register:ip:<ip>`.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  const bucket = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } })
    if (!existing || existing.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      })
    }
    return tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
  })

  const allowed = bucket.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    resetAfterMs: Math.max(0, bucket.resetAt.getTime() - now.getTime()),
  }
}

export function getClientIp(req: Request): string {
  // X-Forwarded-For is trusted only behind the platform proxy (Vercel fra1).
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded.slice(0, 64)
  return 'unknown'
}
