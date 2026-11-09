// Public visibility gating (plan Phase 6 §13).
// ALL conditions are required: status PUBLISHED, not admin-hidden, and an
// ACTIVE|GRACE subscription (plan Phase 3 §20). Callers must pass the
// computed subscription state — there is no permissive default.
import type { SubscriptionState } from '@/lib/subscriptions'

export interface VisibilityInput {
  status?: string | null
  adminHidden?: boolean | null
}

/**
 * The public home portfolio is publish-gated but not subscription-gated:
 * publishing is available on every plan, while project detail pages remain
 * Pro-only (see `isPortfolioVisible`). Keeping the two rules separate avoids a
 * published Free portfolio disappearing from `/u/{username}`.
 */
export function isPortfolioHomeVisible(input: VisibilityInput): boolean {
  if (input.status !== 'PUBLISHED') return false
  if (input.adminHidden) return false
  return true
}

export function isPortfolioVisible(input: VisibilityInput, subState: SubscriptionState): boolean {
  if (!isPortfolioHomeVisible(input)) return false
  if (subState !== 'ACTIVE' && subState !== 'GRACE') return false
  return true
}
