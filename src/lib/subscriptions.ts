import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Subscription state engine (plan Phase 3 §12). State is COMPUTED from
// dates at request time — correctness never depends on cron.
export type SubscriptionState = 'NONE' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'SUSPENDED'

export interface EffectiveSubscription {
  state: SubscriptionState
  subscriptionId: string | null
  planId: string | null
  endsAt: Date | null
  graceEndsAt: Date | null
  daysRemaining: number
}

export interface PlanLimits {
  maxProjects: number
  maxGalleryItems: number
  maxSections: number
  maxStorageMB: number
}

const FREE_LIMITS: PlanLimits = {
  maxProjects: 10,
  maxGalleryItems: 60,
  maxSections: 30,
  maxStorageMB: 100,
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// Latest non-canceled period by endsAt (legacy columns: expiresAt +
// gracePeriodEndsAt snapshot; canceledAt = administrative suspension).
export async function getSubscriptionState(userId: string, now = new Date()): Promise<EffectiveSubscription> {
  const sub = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { expiresAt: 'desc' },
  })
  if (!sub) {
    return { state: 'NONE', subscriptionId: null, planId: null, endsAt: null, graceEndsAt: null, daysRemaining: 0 }
  }
  if (sub.canceledAt) {
    return {
      state: 'SUSPENDED',
      subscriptionId: sub.id,
      planId: sub.planId,
      endsAt: toDate(sub.expiresAt),
      graceEndsAt: toDate(sub.gracePeriodEndsAt),
      daysRemaining: 0,
    }
  }
  const endsAt = toDate(sub.expiresAt)
  const graceEndsAt = toDate(sub.gracePeriodEndsAt)
  if (!endsAt) {
    return { state: 'NONE', subscriptionId: sub.id, planId: sub.planId, endsAt: null, graceEndsAt, daysRemaining: 0 }
  }
  const day = 24 * 60 * 60 * 1000
  if (now.getTime() < endsAt.getTime()) {
    return {
      state: 'ACTIVE',
      subscriptionId: sub.id,
      planId: sub.planId,
      endsAt,
      graceEndsAt,
      daysRemaining: Math.ceil((endsAt.getTime() - now.getTime()) / day),
    }
  }
  if (graceEndsAt && now.getTime() < graceEndsAt.getTime()) {
    return { state: 'GRACE', subscriptionId: sub.id, planId: sub.planId, endsAt, graceEndsAt, daysRemaining: 0 }
  }
  return { state: 'EXPIRED', subscriptionId: sub.id, planId: sub.planId, endsAt, graceEndsAt, daysRemaining: 0 }
}

export function canPublish(state: SubscriptionState): boolean {
  return state === 'ACTIVE' || state === 'GRACE'
}

export function isPortfolioVisibleBySubscription(state: SubscriptionState): boolean {
  return state === 'ACTIVE' || state === 'GRACE'
}

// Limits from the ACTIVE subscription's planSnapshot, else the plan's
// current limits, else free defaults (never derive from plan names).
export async function getEffectiveLimits(userId: string): Promise<PlanLimits> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, canceledAt: null },
    orderBy: { expiresAt: 'desc' },
    select: { planSnapshot: true, plan: { select: { limits: true } } },
  })
  const snapshot = (sub?.planSnapshot ?? null) as unknown as Partial<PlanLimits> | null
  const live = (sub?.plan?.limits ?? null) as unknown as Partial<PlanLimits> | null
  const source = snapshot || live || {}
  return {
    maxProjects: Number(source.maxProjects ?? FREE_LIMITS.maxProjects),
    maxGalleryItems: Number(source.maxGalleryItems ?? FREE_LIMITS.maxGalleryItems),
    maxSections: Number(source.maxSections ?? FREE_LIMITS.maxSections),
    maxStorageMB: Number(source.maxStorageMB ?? FREE_LIMITS.maxStorageMB),
  }
}

export function planLimitsInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}
