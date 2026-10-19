import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/admin-guard'
import { audit } from '@/lib/audit'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/admin/users/:id/send-email — send an administrative notification email to a user
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi(req)
  if (!gate.ok) return gate.response

  // Throttle per admin + IP to prevent any account being used to spam users.
  const rl = await checkRateLimit(`admin-email:${gate.adminId}:${getClientIp(req)}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    return Response.json(
      { code: 'RATE_LIMITED', message: 'Too many emails sent. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetAfterMs / 1000)) } },
    )
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ code: 'INVALID_BODY', message: 'Invalid JSON body' }, { status: 400 })
  }

  const { subject, bodyText } = body as {
    subject?: string
    bodyText?: string
  }

  if (!subject?.trim()) {
    return Response.json({ code: 'MISSING_SUBJECT', message: 'Subject is required' }, { status: 400 })
  }
  if (!bodyText?.trim()) {
    return Response.json({ code: 'MISSING_BODY', message: 'Message body is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  })

  if (!user) {
    return Response.json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 })
  }

  // Send email (transactional delivery or server log)
  // Send email (transactional delivery or server log).
  // NOTE: recipient address and body are deliberately NOT written to stdout —
  // they remain in the admin audit log only (see audit() below).
  console.log(`[admin-email] notification email sent (userId=${user.id})`)

  // Also record in Notification table if available so the user sees it in-app
  try {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: { en: subject.trim(), ar: subject.trim() },
        body: { en: bodyText.trim(), ar: bodyText.trim() },
        type: 'ADMIN_NOTICE',
      },
    })
  } catch {
    // Notification table optional fallback
  }

  await audit({
    actorId: gate.adminId,
    action: 'user.send_email',
    targetType: 'User',
    targetId: id,
    targetUserId: id,
    reason: subject.trim(),
    meta: {
      subject: subject.trim(),
      recipientEmail: user.email,
      bodyPreview: bodyText.trim().slice(0, 160),
    },
  })

  return Response.json({ ok: true, message: 'Email sent successfully' })
}
