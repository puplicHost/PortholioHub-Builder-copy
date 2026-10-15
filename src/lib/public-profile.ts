/* eslint-disable @typescript-eslint/no-explicit-any */
// Public DTO: the exact fields the public template renders, nothing else.
// In particular `userId` (internal owner reference) plus moderation and
// versioning internals never reach the client (plan Phase 6 §14).

export interface PublicProfile {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  professionalTitle: string | null
  location: string | null
  skills: string[]
  experience: unknown
  education: unknown
  projects: unknown
  contactLinks: unknown
  appearance: unknown
  localized: unknown
  portfolioItems: unknown[]
  testimonials: unknown[]
  services: unknown[]
  pages: any[]
  projectPages: any[]
}

export function toPublicProfile(row: any): PublicProfile | null {
  if (!row) return null
  const publicFields = { ...row }
  delete publicFields.userId
  delete publicFields.status
  delete publicFields.adminHidden
  delete publicFields.adminHiddenReason
  delete publicFields.version
  return publicFields as PublicProfile
}
