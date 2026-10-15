import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export interface RecordVisitInput {
  portfolioId: string
  projectSlug?: string | null
  ip: string
  userAgent: string | null
  isOwner: boolean
}

// Cumulative visit recording (plan Phase 11 + 04 Round 2).
// - Owner visits never count.
// - One dedupe row per (portfolio, project, ip, ua, day): refreshes and
//   replays within a day collapse to a single increment. IP is hashed
//   into the key only — never stored raw.
// - DailyVisit accumulates via upsert; returns whether this visit counted.
// - Callers keep writing the raw PortfolioViewEvent row for the existing
//   dashboard (countries tab) until it migrates to DailyVisit.
export async function recordVisit(input: RecordVisitInput): Promise<{ counted: boolean }> {
  if (input.isOwner) return { counted: false }

  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)
  const projectSlug = input.projectSlug || null
  const key = crypto
    .createHash('sha256')
    .update([input.portfolioId, projectSlug || '', input.ip, input.userAgent || '', day.toISOString().slice(0, 10)].join('|'))
    .digest('hex')

  try {
    await prisma.visitDedup.create({ data: { key, day } })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    // Duplicate key → already counted today: skip.
    if (code === 'P2002') return { counted: false }
    // Table missing (pre-migration): fall back to counting every hit so
    // behavior matches the old endpoint until 0006 is applied.
    if (code === 'P2021') return { counted: true }
    throw err
  }

  // projectSlug is nullable so no UNIQUE can dedupe NULL rows (NULL never
  // equals NULL): find-then-bump instead of upsert. Sums stay correct even
  // if a race inserts twice (both rows increment together).
  const existing = await prisma.dailyVisit.findFirst({
    where: { portfolioId: input.portfolioId, projectSlug, day },
    select: { id: true },
  })
  if (existing) {
    await prisma.dailyVisit.update({
      where: { id: existing.id },
      data: { count: { increment: 1 } },
    })
  } else {
    try {
      await prisma.dailyVisit.create({
        data: { portfolioId: input.portfolioId, projectSlug, day, count: 1 },
      })
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'P2002') throw err
      await prisma.dailyVisit.updateMany({
        where: { portfolioId: input.portfolioId, projectSlug, day },
        data: { count: { increment: 1 } },
      })
    }
  }

  return { counted: true }
}

// visit-dedup-cleanup: drops dedupe rows older than 2 days (DailyVisit
// cumulative rows are never touched). Called by the cron route.
export async function cleanupVisitDedups(): Promise<{ deleted: number }> {
  const cutoff = new Date()
  cutoff.setUTCHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - 2)
  const result = await prisma.visitDedup.deleteMany({ where: { day: { lt: cutoff } } })
  return { deleted: result.count }
}
