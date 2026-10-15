import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getPlatformWhatsapp, buildWhatsappUrl, buildSubscriptionRequestMessage } from '@/lib/whatsapp'

// 6-char unambiguous base32 request codes (plan Phase 3 §19).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function requestCode(): string {
  const bytes = crypto.randomBytes(6)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

// POST /api/me/subscription-requests { planId, note? } — one PENDING per
// user (partial unique index backs the precheck). Returns the request plus
// a prefilled WhatsApp URL for manual payment.
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const planId = typeof body?.planId === 'string' ? body.planId : ''
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) {
    return Response.json({ code: 'VALIDATION_ERROR', message: 'Plan is not available' }, { status: 400 })
  }

  const pending = await prisma.subscriptionRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' },
    select: { id: true },
  })
  if (pending) {
    return Response.json({ code: 'CONFLICT', message: 'You already have a pending request' }, { status: 409 })
  }

  let request: { id: string; code: string } | null = null
  for (let attempt = 0; attempt < 3 && !request; attempt++) {
    try {
      request = await prisma.subscriptionRequest.create({
        data: { userId: user.id, planId: plan.id, code: requestCode(), note: note || null, status: 'PENDING' },
        select: { id: true, code: true },
      })
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'P2002') throw err
    }
  }
  if (!request) {
    return Response.json({ code: 'INTERNAL_ERROR', message: 'Could not create request, try again' }, { status: 500 })
  }

  const whatsappNumber = await getPlatformWhatsapp()
  const planName = typeof plan.name === 'string' ? plan.name : plan.id
  const whatsappUrl = buildWhatsappUrl(
    whatsappNumber,
    buildSubscriptionRequestMessage({
      displayName: user.displayName || user.email,
      phone: user.phone || '',
      planName,
      code: request.code,
    }),
  )

  return Response.json({ ok: true, request, whatsappUrl }, { status: 201 })
}

// DELETE /api/me/subscription-requests — cancel own pending request.
export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ code: 'UNAUTHORIZED', message: 'Not signed in' }, { status: 401 })
  }

  const result = await prisma.subscriptionRequest.updateMany({
    where: { userId: user.id, status: 'PENDING' },
    data: { status: 'CANCELED' },
  })
  if (result.count === 0) {
    return Response.json({ code: 'NOT_FOUND', message: 'No pending request' }, { status: 404 })
  }
  return Response.json({ ok: true })
}
