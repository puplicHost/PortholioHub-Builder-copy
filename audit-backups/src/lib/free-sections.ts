// Locked sections for FREE-plan users. These section types are Pro-only:
// they must not appear in the public portfolio, the builder preview, or be
// clickable in the builder sidebar for free accounts.
export const FREE_LOCKED_SECTIONS = ['experience', 'skills', 'services', 'testimonials'] as const

export function isSectionLockedForFree(sectionType: string | null | undefined): boolean {
  if (!sectionType) return false
  return (FREE_LOCKED_SECTIONS as readonly string[]).includes(sectionType.toLowerCase())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

// Return a shallow profile copy with locked sections removed from every
// page's sections array. Never mutates the input; safe for preview/public.
export function stripLockedSectionsForFree<T>(profile: T): T {
  const p = profile as AnyRecord | null | undefined
  if (!p || !Array.isArray(p.pages)) return profile
  const pages = (p.pages as AnyRecord[]).map((pg) => {
    if (!pg || !Array.isArray(pg.sections)) return pg
    return {
      ...pg,
      sections: (pg.sections as AnyRecord[]).filter(
        (s) => !(s && typeof s.sectionType === 'string' && isSectionLockedForFree(s.sectionType)),
      ),
    }
  })
  return { ...(p as object), pages } as T
}

// Pro check shared by server components: only ACTIVE/GRACE see locked sections.
export function canViewLockedSections(subState: string | null | undefined): boolean {
  return subState === 'ACTIVE' || subState === 'GRACE'
}
