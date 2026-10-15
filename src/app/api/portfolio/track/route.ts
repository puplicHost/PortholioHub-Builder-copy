import { prisma } from '@/lib/prisma'
import { validateSession } from '@/lib/auth'
import { recordVisit } from '@/lib/visits'

const VALID_EVENTS = new Set(['page_view', 'project_view', 'whatsapp_click'])

// Tiny in-memory per-IP throttle (60 inserts/min). Track endpoint only;
// analytics reads go through an authenticated Server Action.
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 60
const hits = new Map<string, number[]>()

function ipAllowed(ip: string): boolean {
  const now = Date.now()
  const log = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (log.length >= MAX_PER_WINDOW) {
    hits.set(ip, log)
    return false
  }
  log.push(now)
  hits.set(ip, log)
  return true
}

function deriveCountry(headers: Headers, acceptLanguage: string | null): string {
  const direct =
    headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country')
  if (direct && /^[A-Za-z]{2}$/.test(direct.trim())) return direct.trim().toUpperCase()
  if (acceptLanguage) {
    const m = acceptLanguage.split(',')[0]?.trim().match(/^[A-Za-z]{2,3}[-_]([A-Za-z]{2})\b/)
    if (m) return m[1].toUpperCase()
  }
  return 'unknown'
}

function deriveLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null
  const m = acceptLanguage.split(',')[0]?.trim().match(/^([A-Za-z]{2,3})\b/)
  return m ? m[1].toLowerCase() : null
}

// POST /api/portfolio/track — fire-and-forget, always fast (single indexed
// lookup + single insert, no external calls). Never blocks page render.
export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!ipAllowed(ip)) {
      return Response.json({ ok: false }, { status: 202 })
    }

    const body = await req.json().catch(() => null)
    const username = typeof body?.username === 'string' ? body.username.slice(0, 64) : ''
    const eventType = typeof body?.eventType === 'string' ? body.eventType : ''
    const projectSlug =
      typeof body?.projectSlug === 'string' ? body.projectSlug.slice(0, 200) : null

    if (!username || !VALID_EVENTS.has(eventType)) {
      return Response.json({ ok: false }, { status: 202 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { username },
      select: { id: true, userId: true },
    })
    if (!profile) return Response.json({ ok: false }, { status: 202 })

    let projectPageId: string | null = null
    if (eventType === 'project_view' && projectSlug) {
      const page = await prisma.projectPage.findUnique({
        where: { profileId_slug: { profileId: profile.id, slug: projectSlug } },
        select: { id: true },
      })
      projectPageId = page?.id ?? null
    }

    // Owner visits never count (plan Phase 11): same-session owner check.
    let isOwner = false
    try {
      const { cookies } = await import('next/headers')
      const sessionToken = (await cookies()).get('session_token')?.value
      const viewer = await validateSession(sessionToken)
      isOwner = !!viewer && viewer.id === profile.userId
    } catch {
      isOwner = false
    }

    const acceptLanguage = req.headers.get('accept-language')
    const referer = req.headers.get('referer')?.slice(0, 500) ?? null
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

    // Cumulative aggregate (dedupe-gated). The raw row below keeps the
    // existing dashboard (countries tab) pixel-identical until it migrates
    // to DailyVisit; both writes are skipped for owners and duplicates.
    const { counted } = await recordVisit({
      portfolioId: profile.id,
      projectSlug: eventType === 'project_view' ? projectSlug : null,
      ip,
      userAgent,
      isOwner,
    })
    if (!counted) {
      return Response.json({ ok: true }, { status: 202 })
    }

    await prisma.portfolioViewEvent.create({
      data: {
        profileId: profile.id,
        eventType,
        projectPageId,
        country: deriveCountry(req.headers, acceptLanguage),
        language: deriveLanguage(acceptLanguage),
        referrer: referer,
      },
    })

    return Response.json({ ok: true }, { status: 202 })
  } catch (err) {
    console.error('[portfolio/track]', err)
    return Response.json({ ok: false }, { status: 202 })
  }
}
