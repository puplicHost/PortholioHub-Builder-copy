// Public visibility gating (plan Phase 6 §13).
// ALL conditions are required: status PUBLISHED, not admin-hidden, and an
// ACTIVE|GRACE subscription (plan Phase 3 §20). Callers must pass the
// computed subscription state — there is no permissive default.
import type { SubscriptionState } from '@/lib/subscriptions'

export interface VisibilityInput {
  status?: string | null
  adminHidden?: boolean | null
}

export function isPortfolioVisible(input: VisibilityInput, subState: SubscriptionState): boolean {
  if (input.status !== 'PUBLISHED') return false
  if (input.adminHidden) return false
  if (subState !== 'ACTIVE' && subState !== 'GRACE') return false
  return true
}
