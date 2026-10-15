import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Admin audit trail (plan Phase 3 §29 / Phase 7). Every admin mutation
// calls this inside (or alongside) its own transaction. Secrets must
// never land in meta — callers pass only ids and public reasons.
export async function audit(input: {
  actorId: string
  action: string
  targetType: string
  targetId?: string
  targetUserId?: string
  reason?: string
  meta?: Record<string, unknown>
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetUserId: input.targetUserId,
      reason: input.reason,
      metadata: (input.meta || {}) as Prisma.InputJsonValue,
    },
  })
}

const SECRET_KEY_PATTERN = /password|passwd|secret|token|api[_-]?key/i

// Strip secret-looking keys before showing audit meta in the UI/API.
export function sanitizeAuditMeta(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditMeta)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEY_PATTERN.test(k) ? '[redacted]' : sanitizeAuditMeta(v)
    }
    return out
  }
  return value
}
