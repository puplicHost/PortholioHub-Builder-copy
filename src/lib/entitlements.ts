import { getSubscriptionState } from '@/lib/subscriptions'
import { isSectionLockedForFree } from '@/lib/free-sections'

// Centralized, server-authoritative entitlements. Never accept a plan or
// subscription state from the browser; always resolve it from the DB.
export interface Entitlements {
  state: string
  isFree: boolean
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  // Do NOT swallow DB errors: callers must fail the operation instead of
  // silently treating a paid user as Free and dropping their edits.
  const sub = await getSubscriptionState(userId)
  const state = sub.state
  return {
    state,
    isFree: state !== 'ACTIVE' && state !== 'GRACE',
  }
}

export function canUseSection(ent: Entitlements, sectionType: string | null | undefined): boolean {
  if (!sectionType) return true
  return !ent.isFree || !isSectionLockedForFree(sectionType)
}

export function canCreateStandaloneProjectPage(ent: Entitlements): boolean {
  return !ent.isFree
}

export function canManageStandaloneProjectPage(ent: Entitlements, showInProjects: boolean | null | undefined): boolean {
  // Home-page project cards are allowed on Free; standalone pages are not.
  if (showInProjects === false) return !ent.isFree
  return true
}
