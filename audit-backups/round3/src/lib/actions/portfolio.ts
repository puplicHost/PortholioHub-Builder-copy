/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ensurePersonalWorkspace } from '@/lib/workspaces'
import { validateUsername } from '@/lib/portfolio'
import { validateSections, validateProjects, validateProfileExtras } from '@/lib/portfolio-schema'
import { sanitizeUrl } from '@/lib/urls'
import { Prisma } from '@prisma/client'

async function requireUserWithWorkspace() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Auto-create a personal workspace on first builder use so users never
  // land on a dead-end. There is no /workspace route in this project.
  await ensurePersonalWorkspace(user.id, user.displayName || user.email?.split('@')[0] || 'My')

  return user
}

export async function getOrCreateProfile() {
  const user = await requireUserWithWorkspace()

  let profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    include: {
      pages: {
        include: { sections: { orderBy: { sectionOrder: 'asc' } } },
        orderBy: { pageOrder: 'asc' },
      },
      projectPages: {
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
      }
    },
  })

  // Ensure default sections exist for existing profiles (single pass).
  // Mutations run against the DB in order; a local mirror keeps later blocks
  // consistent, and the profile is re-fetched at most ONCE at the end
  // (zero extra fetches when nothing needs migrating).
  if (profile?.pages?.[0]) {
    const pageId = profile.pages[0].id
    let sections: any[] = [...(profile.pages[0].sections || [])]
    let migrated = false

    // — Experience: deduplicate, or insert after About —
    const experienceSections = sections.filter((s: any) => s.sectionType === 'experience')

    if (experienceSections.length > 1) {
      // Remove duplicate experience sections
      const toDelete = experienceSections.slice(1)
      for (const dup of toDelete) {
        await prisma.pageSection.delete({ where: { id: dup.id } })
      }
      const deletedIds = new Set(toDelete.map((d: any) => d.id))
      sections = sections.filter((s: any) => !deletedIds.has(s.id))
      migrated = true
    } else if (experienceSections.length === 0 && sections.length > 0) {
      // Add the experience section
      const aboutSection = sections.find((s: any) => s.sectionType === 'about')
      const insertOrder = aboutSection ? aboutSection.sectionOrder + 1 : 3

      // Shift sections after the insertion point
      for (const sec of sections) {
        if (sec.sectionOrder >= insertOrder) {
          await prisma.pageSection.update({
            where: { id: sec.id },
            data: { sectionOrder: sec.sectionOrder + 1 },
          })
          sec.sectionOrder = sec.sectionOrder + 1
        }
      }

      const created = await prisma.pageSection.create({
        data: {
          pageId,
          sectionType: 'experience',
          sectionOrder: insertOrder,
          content: {
            heading: { en: 'Work Experience', ar: 'الخبرات العملية' },
            description: { en: 'A journey through my professional career', ar: 'رحلتي في مسيرتي المهنية' },
            items: [],
          } as Prisma.InputJsonValue,
          settings: { isVisible: true } as Prisma.InputJsonValue,
        },
      })
      sections.push(created)
      migrated = true
    }

    // — Footer: ensure one exists (contact is a first-class section type
    // since Sprint F3 and is never converted or deleted here) —
    const footerSec = sections.find((s: any) => s.sectionType === 'footer')

    if (!footerSec && sections.length > 0) {
      const maxOrder = sections.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0)
      const created = await prisma.pageSection.create({
        data: {
          pageId,
          sectionType: 'footer',
          sectionOrder: maxOrder + 1,
          content: {
            headline: { en: 'Work with me', ar: 'تواصل معي' },
            subheading: { en: "Let's build something great together.", ar: 'دعنا نبني شيئاً رائعاً معاً.' },
            links: (profile.contactLinks as any) || [],
          } as Prisma.InputJsonValue,
          settings: { isVisible: true } as Prisma.InputJsonValue,
        },
      })
      sections.push(created)
      migrated = true
    }

    // — Testimonials: insert before footer (or append) —
    const testimonialsSec = sections.find((s: any) => s.sectionType === 'testimonials')

    if (!testimonialsSec && sections.length > 0) {
      const footerSection = sections.find((s: any) => s.sectionType === 'footer')
      const insertOrder = footerSection
        ? footerSection.sectionOrder
        : sections.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0) + 1

      for (const sec of sections) {
        if (sec.sectionOrder >= insertOrder) {
          await prisma.pageSection.update({
            where: { id: sec.id },
            data: { sectionOrder: sec.sectionOrder + 1 },
          })
          sec.sectionOrder = sec.sectionOrder + 1
        }
      }

      const created = await prisma.pageSection.create({
        data: {
          pageId,
          sectionType: 'testimonials',
          sectionOrder: insertOrder,
          content: {
            title: { en: 'Testimonials', ar: 'آراء العملاء' },
            subtitle: { en: 'What clients say', ar: 'ماذا يقول العملاء' },
            icon: 'message',
            items: [],
          } as Prisma.InputJsonValue,
          settings: { isVisible: true } as Prisma.InputJsonValue,
        },
      })
      sections.push(created)
      migrated = true
    }

    // Single re-fetch so the returned profile reflects the migration
    // (skipped entirely when nothing changed).
    if (migrated) {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
        include: {
          pages: {
            include: { sections: { orderBy: { sectionOrder: 'asc' } } },
            orderBy: { pageOrder: 'asc' },
          },
          projectPages: {
            include: { items: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' }
          }
        },
      })
    }
  }

  // Transform items to include linkType/linkedPageSlug from DB fields
  if (profile?.projectPages) {
    for (const pp of profile.projectPages) {
      const content = (pp.content as any) || {}
      // Set page-level linkType from content
      ;(pp as any).linkType = content.linkType || 'none'
      ;(pp as any).linkedPageSlug = content.linkedPageSlug || null
      // Transform items
      if (pp.items) {
        for (const item of pp.items) {
          if (item.type === 'page_link') {
            ;(item as any).linkType = 'page'
            ;(item as any).linkedPageSlug = item.externalUrl
            ;(item as any).linkLabel = item.title
          } else {
            ;(item as any).linkType = 'none'
            ;(item as any).linkedPageSlug = null
          }
        }
      }
    }
  }

  if (!profile) {
    // Generate a default URL-safe username
    const baseUsername = (user.displayName || user.email?.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    
    let username = baseUsername
    let counter = 1
    while (await prisma.userProfile.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`
      counter++
    }

    const profileData: Prisma.UserProfileUncheckedCreateInput = {
        userId: user.id,
        username,
        displayName: user.displayName || '',
        appearance: {
          colorMode: 'light',
          theme: 'classic-dark',
          font: 'inter',
          primaryColor: '#0066cc'
        } as Prisma.InputJsonValue,
        localized: {
          displayName: { en: user.displayName || '', ar: '' },
          bio: { en: '', ar: '' },
          professionalTitle: { en: '', ar: '' }
        } as Prisma.InputJsonValue,
        contactLinks: [] as Prisma.InputJsonValue,
        pages: {
          create: {
            title: 'Home',
            slug: 'home',
            sections: {
              create: [
                { sectionType: 'hero', sectionOrder: 1, content: { title: {en: '', ar: ''}, subtitle: {en: '', ar: ''} } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'about', sectionOrder: 2, content: { text: {en: '', ar: ''} } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'experience', sectionOrder: 3, content: { heading: {en: 'Work Experience', ar: 'الخبرات العملية'}, description: {en: 'A journey through my professional career', ar: 'رحلتي في مسيرتي المهنية'}, items: [] } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'skills', sectionOrder: 4, content: { skills: [] } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'services', sectionOrder: 5, content: { items: [] } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'projects', sectionOrder: 6, content: { title: {en: 'Projects', ar: 'المشاريع'} } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'testimonials', sectionOrder: 7, content: { title: {en: 'Testimonials', ar: 'آراء العملاء'}, subtitle: {en: 'What clients say', ar: 'ماذا يقول العملاء'}, icon: 'message', items: [] } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
                { sectionType: 'footer', sectionOrder: 8, content: { headline: {en: 'Work with me', ar: 'تواصل معي'}, subheading: {en: "Let's build something great together.", ar: 'دعنا نبني شيئاً رائعاً معاً.'}, links: [] } as Prisma.InputJsonValue, settings: { isVisible: true } as Prisma.InputJsonValue },
              ]
            }
          }
        }
      }
    const profileInclude = {
      pages: {
        include: { sections: { orderBy: { sectionOrder: 'asc' as const } } },
        orderBy: { pageOrder: 'asc' as const },
      },
      projectPages: {
        include: { items: { orderBy: { sortOrder: 'asc' as const } } },
        orderBy: { sortOrder: 'asc' as const }
      }
    }
    try {
      profile = await prisma.userProfile.create({ data: profileData, include: profileInclude })
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err
      // Lost a creation race (two tabs opened at once) or a username race:
      // whoever won owns this user's row — otherwise retry once suffixed.
      const raced = await prisma.userProfile.findUnique({ where: { userId: user.id }, include: profileInclude })
      if (raced) {
        profile = raced
      } else {
        profile = await prisma.userProfile.create({
          data: { ...profileData, username: `${username}-${Math.floor(1000 + Math.random() * 9000)}` },
          include: profileInclude,
        })
      }
    }
  }

  return profile
}

export async function updatePortfolio(data: {
  id: string,
  username?: string,
  avatarUrl?: string,
  appearance?: any,
  localized?: any,
  contactLinks?: any,
  sections?: any[],
  projects?: any[],
  expectedVersion?: number,
}) {
  try {
    const user = await requireUserWithWorkspace()

    // Ownership anchor: never trust the client-supplied `data.id`. Every
    // relation write is scoped to THIS user's own profile row.
    const own = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!own) {
      return { success: false, error: 'Profile not found' }
    }

    // Sanitize JSON extras with silent per-field fallback (legacy rows safe).
    const extras = validateProfileExtras({
      appearance: data.appearance,
      localized: data.localized,
      contactLinks: data.contactLinks,
    })

    // Optimistic concurrency: reject stale writers with their conflict
    // surfaced (full 409 modal lands in Sprint F).
    if (data.expectedVersion !== undefined) {
      const current = await prisma.userProfile.findUnique({
        where: { userId: user.id },
        select: { version: true },
      })
      if (current && current.version !== data.expectedVersion) {
        return { success: false, conflict: true, currentVersion: current.version, error: 'Someone else saved changes. Reload to get the latest version.' }
      }
    }

    // Content validation (Sprint F1): strict per-type schemas with field
    // paths; rejects unknown keys, bad URLs, oversize text, overfull arrays.
    const sectionsCheck = validateSections(data.sections)
    if (!sectionsCheck.ok) {
      return { success: false, error: sectionsCheck.error || 'Invalid sections' }
    }
    const projectsCheck = validateProjects(data.projects)
    if (!projectsCheck.ok) {
      return { success: false, error: projectsCheck.error || 'Invalid projects' }
    }

    const username = data.username?.toLowerCase().trim() || undefined
    if (username) {
      const problem = validateUsername(username)
      if (problem) {
        return { success: false, error: problem }
      }
      const existing = await prisma.userProfile.findUnique({ where: { username } })
      if (existing && existing.userId !== user.id) {
        return { success: false, error: 'Username is already taken' }
      }
    }

    // Global safety caps on every save (plan Phase 5 §18): 30 sections,
    // 50 projects, 60 gallery items. Plan limits apply at publish.
    const sectionCount = data.sections?.length || 0
    const projectCount = Array.isArray(data.projects) ? data.projects.length : 0
    if (sectionCount > 30 || projectCount > 50) {
      return { success: false, error: 'Content exceeds safety caps (30 sections / 50 projects)' }
    }

    // Update profile (version bump keeps concurrent writers ordered)
    let updated: { version: number }
    try {
      updated = await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          username,
          avatarUrl: data.avatarUrl,
          appearance: extras.appearance as Prisma.InputJsonValue,
          localized: extras.localized as Prisma.InputJsonValue,
          contactLinks: extras.contactLinks as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
        select: { version: true },
      })
    } catch (err: any) {
      // Unique-race on username between precheck and write (NOT a version
      // conflict — no modal, just an error toast).
      if (err?.code === 'P2002') {
        return { success: false, error: 'Username is already taken' }
      }
      throw err
    }

    // Update sections if provided
    // (home page only for now). Client temp ids (`new-…`, same convention
    // as project pages) are CREATED; everything else is updated in place.
    // The id mapping is returned so the client swaps temp ids for real ones
    // (otherwise every save would duplicate the new sections).
    const savedSections: { id: string; tempId?: string }[] = []
    if (data.sections && data.sections.length > 0) {
      const homePage = await prisma.profilePage.findFirst({
        where: { profileId: own.id, slug: 'home' },
        select: { id: true },
      })
      for (const sec of data.sections) {
        if (!sec.id) continue
        const secSettings = (sec.settings as any) || {}
        if (sec.visible !== undefined) {
          secSettings.isVisible = sec.visible
        }
        if (typeof sec.id === 'string' && sec.id.startsWith('new-') && homePage) {
          const created = await prisma.pageSection.create({
            data: {
              pageId: homePage.id,
              sectionType: sec.sectionType || 'custom',
              sectionOrder: sec.sectionOrder ?? 0,
              content: sec.content ?? {},
              settings: secSettings,
            },
          })
          savedSections.push({ id: created.id, tempId: sec.id })
        } else if (!(typeof sec.id === 'string' && sec.id.startsWith('new-'))) {
          // Scoped to the caller's own page — a foreign section id is skipped.
          await prisma.pageSection.updateMany({
            where: { id: sec.id, page: { profileId: own.id } },
            data: {
              sectionOrder: sec.sectionOrder,
              content: sec.content,
              settings: secSettings,
            }
          })
        }
      }
    }

    // Update projects if provided
    const savedProjects: { id: string; tempId?: string; slug: string; title: string }[] = []

    if (data.projects) {
      const VALID_TYPES = [
        'workspace_strategy',
        'workspace_content',
        'workspace_media',
        'external_link',
        'external_text',
        'external_image',
      ]

      const existingProjects = await prisma.projectPage.findMany({ where: { profileId: own.id } })
      const ownProjectIds = new Set(existingProjects.map((p) => p.id))
      const keptProjectIds = new Set<string>()
      const usedSlugs = new Set<string>()

      for (const proj of data.projects) {
        if (proj.id) {
          const isTempId = typeof proj.id === 'string' && proj.id.startsWith('new-')
          const existingContent = (proj.content as any) || {}
          const baseSlug = (
            proj.title
              ? proj.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
              : (proj.slug || `project-${Date.now()}`)
          ).replace(/^-|-$/g, '') || 'project'

          let slug = proj.slug && !proj.slug.startsWith('project-new-') && !proj.slug.startsWith('new-')
            ? proj.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            : baseSlug

          let counter = 1
          while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${counter}`
            counter++
          }
          usedSlugs.add(slug)

          const projectData = {
            title: proj.title || 'Untitled',
            slug,
            description: proj.description || null,
            coverImage: sanitizeUrl(proj.coverImage) || null,
            tags: proj.tags || [],
            sortOrder: proj.sortOrder || 0,
            content: {
              ...existingContent,
              linkType: proj.linkType || 'none',
              linkedPageSlug: proj.linkedPageSlug || null,
            } as Prisma.InputJsonValue,
            displayMode: proj.displayMode || 'grid',
            showBackButton: proj.showBackButton !== false,
            backButtonLabel: proj.backButtonLabel || 'Back to Portfolio',
            externalLink: sanitizeUrl(proj.externalLink) || null,
            linkLabel: proj.linkLabel || null,
          }

          let realProjectId: string

          if (isTempId) {
            // For new projects: CREATE record first to get the REAL DB id
            const created = await prisma.projectPage.create({
              data: {
                profileId: own.id,
                ...projectData,
              },
            })
            realProjectId = created.id
            keptProjectIds.add(realProjectId)
            savedProjects.push({ id: realProjectId, tempId: proj.id, slug, title: projectData.title })
          } else if (ownProjectIds.has(proj.id)) {
            // Real id that belongs to THIS profile: update + replace items.
            const updated = await prisma.projectPage.update({
              where: { id: proj.id },
              data: projectData,
            })
            realProjectId = updated.id
            keptProjectIds.add(realProjectId)
            savedProjects.push({ id: realProjectId, slug, title: projectData.title })

            await prisma.projectItem.deleteMany({ where: { projectId: realProjectId } })
          } else {
            // Foreign or stale id — never touch another profile's project row.
            continue
          }

          // Filter out any items where ALL of (externalUrl, textContent, imageUrl, workspaceItemId) are undefined/empty
          if (proj.items && proj.items.length > 0) {
            const validItems = proj.items
              .map((item: any, idx: number) => {
                let itemType = item.type
                if (!itemType || !VALID_TYPES.includes(itemType)) {
                  itemType = 'external_link'
                }

                const isPage = item.linkType === 'page'
                const externalUrl = isPage
                  ? (typeof item.linkedPageSlug === 'string' && item.linkedPageSlug.trim() ? item.linkedPageSlug.trim() : null)
                  : (sanitizeUrl(item.externalUrl) || null)
                const textContent = item.textContent || null
                const imageUrl = sanitizeUrl(item.imageUrl) || null
                const workspaceItemId = item.workspaceItemId || null

                return {
                  projectId: realProjectId,
                  type: itemType,
                  workspaceItemId,
                  externalUrl,
                  textContent,
                  imageUrl,
                  title: item.title || item.linkLabel || null,
                  sortOrder: item.sortOrder !== undefined ? item.sortOrder : idx,
                }
              })
              .filter((item: any) => {
                const hasExt = item.externalUrl && String(item.externalUrl).trim() !== ''
                const hasText = item.textContent && String(item.textContent).trim() !== ''
                const hasImg = item.imageUrl && String(item.imageUrl).trim() !== ''
                const hasWs = item.workspaceItemId && String(item.workspaceItemId).trim() !== ''
                return hasExt || hasText || hasImg || hasWs
              })

            if (validItems.length > 0) {
              await prisma.projectItem.createMany({
                data: validItems,
              })
            }
          }
        }
      }

      // Handle deleted projects
      for (const ep of existingProjects) {
        if (!keptProjectIds.has(ep.id)) {
          await prisma.projectPage.delete({ where: { id: ep.id } })
        }
      }
    }

    revalidatePath('/profile/builder')
    if (data.username) {
      revalidatePath(`/u/${data.username}`)
    }
    
    return { success: true, savedProjects, savedSections, version: updated.version }
  } catch (error: any) {
    console.error('updatePortfolio error:', error)
    return { success: false, error: error.message || 'Failed to save portfolio' }
  }
}

export interface PublishCheck {
  ok: boolean
  missing: string[]
}

// Publish preconditions (plan Phase 5 §23). Subscription check
// (`canPublish`) joins in Sprint C; until then this validates content only.
export async function checkPublishable(): Promise<PublishCheck> {
  const user = await requireUserWithWorkspace()
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    include: {
      pages: { include: { sections: true } },
    },
  })
  const missing: string[] = []
  if (!profile) {
    return { ok: false, missing: ['profile'] }
  }
  if (!profile.username) missing.push('username')
  const name =
    ((profile.localized as any)?.displayName?.en as string) ||
    ((profile.localized as any)?.displayName?.ar as string) ||
    profile.displayName ||
    ''
  if (!name.trim()) missing.push('name')
  const home = profile.pages.find((p) => p.slug === 'home')
  const sections = home?.sections || []
  const visible = sections.filter((s: any) => {
    const settings = (s.settings as any) || {}
    return settings.isVisible !== false && (s as any).visible !== false
  })
  if (visible.length === 0) missing.push('visible-section')
  return { ok: missing.length === 0, missing }
}

export async function publishProfile() {
  try {
    const user = await requireUserWithWorkspace()
    const check = await checkPublishable()
    if (!check.ok) {
      return { success: false, error: `Cannot publish yet: missing ${check.missing.join(', ')}` }
    }

    // Publishing is free for everyone — no subscription gate.

    // Plan limits + global safety caps at publish (Phase 5 §18/§21).
    const { getEffectiveLimits } = await import('@/lib/subscriptions')
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        pages: { select: { sections: { select: { id: true } } } },
        projectPages: { select: { id: true, gallery: true } },
      },
    })
    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }
    const sectionCount = profile.pages.reduce((n, p) => n + p.sections.length, 0)
    const projectCount = profile.projectPages.length
    const galleryCount = profile.projectPages.reduce((n, p) => n + (p.gallery?.length || 0), 0)
    if (sectionCount > 30 || projectCount > 50 || galleryCount > 60) {
      return { success: false, error: 'Content exceeds safety caps (30 sections / 50 projects / 60 gallery items)' }
    }
    const limits = await getEffectiveLimits(user.id)
    if (projectCount > limits.maxProjects) {
      return { success: false, error: `Plan allows ${limits.maxProjects} projects` }
    }
    if (sectionCount > limits.maxSections) {
      return { success: false, error: `Plan allows ${limits.maxSections} sections` }
    }
    if (galleryCount > limits.maxGalleryItems) {
      return { success: false, error: `Plan allows ${limits.maxGalleryItems} gallery items` }
    }

    const updated = await prisma.userProfile.update({
      where: { userId: user.id },
      data: { status: 'PUBLISHED', version: { increment: 1 } },
      select: { version: true, username: true },
    })
    revalidatePath('/profile/builder')
    revalidatePath(`/u/${updated.username}`)
    return { success: true, version: updated.version }
  } catch (error: any) {
    console.error('publishProfile error:', error)
    return { success: false, error: error.message || 'Failed to publish' }
  }
}

export async function unpublishProfile() {
  try {
    const user = await requireUserWithWorkspace()
    const updated = await prisma.userProfile.update({
      where: { userId: user.id },
      data: { status: 'DRAFT', version: { increment: 1 } },
      select: { version: true, username: true },
    })
    revalidatePath('/profile/builder')
    revalidatePath(`/u/${updated.username}`)
    return { success: true, version: updated.version }
  } catch (error: any) {
    console.error('unpublishProfile error:', error)
    return { success: false, error: error.message || 'Failed to unpublish' }
  }
}

export async function createProjectPage(titleOrProfileId?: string, maybeTitle?: string) {
  try {
    const user = await requireUserWithWorkspace()
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })
    if (!profile) return { success: false, error: 'Profile not found' }

    let title = 'New Project Page'
    if (maybeTitle) {
      title = maybeTitle
    } else if (titleOrProfileId && titleOrProfileId !== profile.id && !titleOrProfileId.startsWith('cl') && !titleOrProfileId.includes('-')) {
      title = titleOrProfileId
    } else if (titleOrProfileId && titleOrProfileId !== profile.id) {
      title = titleOrProfileId
    }

    const baseTitle = title.trim() || 'New Project'
    let slug = baseTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    if (!slug) {
      slug = `project-${Math.random().toString(36).substring(2, 6)}`
    }

    const existing = await prisma.projectPage.findFirst({
      where: { profileId: profile.id, slug },
    })
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    const count = await prisma.projectPage.count({ where: { profileId: profile.id } })

    const projectPage = await prisma.projectPage.create({
      data: {
        profileId: profile.id,
        title: baseTitle,
        slug,
        sortOrder: count,
        displayMode: 'grid',
        showBackButton: true,
        backButtonLabel: 'Back to Portfolio',
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    revalidatePath('/profile/builder')
    return {
      success: true,
      page: {
        id: projectPage.id,
        slug: projectPage.slug,
        title: projectPage.title,
        displayMode: projectPage.displayMode,
        showBackButton: projectPage.showBackButton,
        backButtonLabel: projectPage.backButtonLabel,
      },
      projectPage,
      data: projectPage,
      id: projectPage.id,
      slug: projectPage.slug,
      title: projectPage.title,
    }
  } catch (error: any) {
    console.error('createProjectPage error:', error)
    return { success: false, error: error.message || 'Failed to create project page' }
  }
}

export async function updateProjectPage(id: string, data: any) {
  try {
    const user = await requireUserWithWorkspace()

    // Ownership check: only the caller's own project page is writable.
    const owned = await prisma.projectPage.findFirst({
      where: { id, profile: { userId: user.id } },
      select: { id: true },
    })
    if (!owned) {
      return { success: false, error: 'Project page not found' }
    }

    const { items, ...pageData } = data

    await prisma.projectPage.update({
      where: { id: owned.id },
      data: pageData,
    })

    // Handle items: delete all existing and re-insert
    if (items !== undefined) {
      await prisma.projectItem.deleteMany({ where: { projectId: owned.id } })
      if (items && items.length > 0) {
        await prisma.projectItem.createMany({
          data: items.map((item: any, index: number) => {
            const isPage = item.linkType === 'page'
            // URLs are sanitized on the server (http/https/mailto/tel or
            // internal path only); legacy bare domains normalized silently.
            const externalUrl = isPage
              ? (typeof item.linkedPageSlug === 'string' && item.linkedPageSlug.trim() ? item.linkedPageSlug.trim() : null)
              : (sanitizeUrl(item.externalUrl) || null)
            return {
              projectId: owned.id,
              type: item.linkType === 'page' ? 'page_link' : item.type,
              workspaceItemId: item.workspaceItemId || null,
              externalUrl,
              textContent: item.textContent || null,
              imageUrl: sanitizeUrl(item.imageUrl) || null,
              title: item.linkLabel || item.title || null,
              sortOrder: item.sortOrder ?? index,
            }
          })
        })
      }
    }

    revalidatePath('/profile/builder')
    const pp = await prisma.projectPage.findUnique({ where: { id: owned.id }, include: { profile: true } })
    if (pp) {
      revalidatePath(`/u/${pp.profile.username}/projects/${pp.slug}`)
    }

    // Return the updated page with items
    const updatedPage = await prisma.projectPage.findUnique({
      where: { id: owned.id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })

    return { success: true, projectPage: updatedPage }
  } catch (error: any) {
    console.error('updateProjectPage error:', error)
    return { success: false, error: error.message || 'Failed to update project page' }
  }
}

export async function deleteProjectPage(id: string) {
  try {
    const user = await requireUserWithWorkspace()
    // deleteMany + ownership filter: a foreign/unknown id matches 0 rows.
    const result = await prisma.projectPage.deleteMany({
      where: { id, profile: { userId: user.id } },
    })
    if (result.count === 0) {
      return { success: false, error: 'Project page not found' }
    }

    revalidatePath('/profile/builder')
    return { success: true }
  } catch (error: any) {
    console.error('deleteProjectPage error:', error)
    return { success: false, error: error.message || 'Failed to delete project page' }
  }
}

export async function getAdminWorkspaceContent() {
  const user = await requireUserWithWorkspace()

  // Get workspaces where user is owner or admin
  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true }
  })
  
  const memberWorkspaces = await prisma.workspaceMember.findMany({
    where: { userId: user.id, role: 'admin', acceptedAt: { not: null } },
    select: { workspaceId: true, workspace: { select: { name: true } } }
  })
  
  const workspaceIds = Array.from(new Set([
    ...ownedWorkspaces.map(w => w.id),
    ...memberWorkspaces.map(m => m.workspaceId)
  ]))
  
  const workspaceNames = new Map<string, string>()
  ownedWorkspaces.forEach(w => workspaceNames.set(w.id, w.name))
  memberWorkspaces.forEach(m => workspaceNames.set(m.workspaceId, m.workspace.name))

  // Fetch content from these workspaces
  const [strategies, contentPlans, posts, media] = await Promise.all([
    prisma.strategy.findMany({
      where: { workspaceId: { in: workspaceIds }, archivedAt: null },
      select: { id: true, title: true, workspaceId: true, updatedAt: true }
    }),
    prisma.planningDocument.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      select: { id: true, name: true, workspaceId: true, updatedAt: true }
    }),
    prisma.content.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      select: { id: true, title: true, workspaceId: true, platform: true, updatedAt: true }
    }),
    prisma.media.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      select: { id: true, filename: true, url: true, workspaceId: true, mimeType: true, createdAt: true }
    })
  ])

  return {
    workspaces: Array.from(workspaceNames.entries()).map(([id, name]) => ({ id, name })),
    strategies,
    contentPlans,
    posts,
    media
  }
}

export interface PortfolioAnalyticsDay {
  date: string
  views: number
}

export interface PortfolioAnalyticsProject {
  id: string
  title: string
  slug: string
  coverImage: string | null
  views: number
}

export interface PortfolioAnalyticsCountry {
  country: string
  views: number
}

export interface PortfolioAnalytics {
  username?: string
  totalAllTime: number
  total7d: number
  total30d: number
  prev7d: number
  prev30d: number
  projectViews: number
  projectViews30d: number
  projectViewsPrev30d: number
  whatsappClicks: number
  whatsapp30d: number
  whatsappPrev30d: number
  daily: PortfolioAnalyticsDay[]
  projects: PortfolioAnalyticsProject[]
  topCountries: PortfolioAnalyticsCountry[]
}

// Read-only portfolio analytics for the current user's own profile.
// All counts are anonymous aggregates from PortfolioViewEvent rows.
export async function getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  const user = await requireUserWithWorkspace()

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      username: true,
      projectPages: { select: { id: true, title: true, slug: true, coverImage: true } },
    },
  })
  if (!profile) {
    return {
      username: undefined,
      totalAllTime: 0, total7d: 0, total30d: 0,
      prev7d: 0, prev30d: 0,
      projectViews: 0, projectViews30d: 0, projectViewsPrev30d: 0,
      whatsappClicks: 0, whatsapp30d: 0, whatsappPrev30d: 0,
      daily: [], projects: [], topCountries: [],
    }
  }

  const now = new Date()
  const day = 24 * 60 * 60 * 1000
  const since7 = new Date(now.getTime() - 7 * day)
  const since14 = new Date(now.getTime() - 14 * day)
  const since30 = new Date(now.getTime() - 30 * day)
  const since60 = new Date(now.getTime() - 60 * day)

  type TypeCount = { eventType: string; _count: { _all: number } }
  const countAll = (rows: TypeCount[], type?: string) =>
    rows.filter((r) => !type || r.eventType === type).reduce((n, r) => n + r._count._all, 0)

  // Two grouped queries replace eleven COUNTs. The 30-day windows are
  // derived from the events30 rows below (same predicates, exact counts);
  // the [60d,30d) windows are 60d-grouped minus 30d-derived.
  const [byTypeAllTime, byType60d, events30] = await Promise.all([
    prisma.portfolioViewEvent.groupBy({
      by: ['eventType'],
      where: { profileId: profile.id },
      _count: { _all: true },
    }),
    prisma.portfolioViewEvent.groupBy({
      by: ['eventType'],
      where: { profileId: profile.id, createdAt: { gte: since60 } },
      _count: { _all: true },
    }),
    prisma.portfolioViewEvent.findMany({
      where: { profileId: profile.id, createdAt: { gte: since30 } },
      select: { eventType: true, projectPageId: true, country: true, createdAt: true },
    }),
  ])

  const totalAllTime = countAll(byTypeAllTime)
  const projectViews = countAll(byTypeAllTime, 'project_view')
  const whatsappClicks = countAll(byTypeAllTime, 'whatsapp_click')

  const total30d = events30.length
  const projectViews30d = events30.filter((e) => e.eventType === 'project_view').length
  const whatsapp30d = events30.filter((e) => e.eventType === 'whatsapp_click').length
  const total7d = events30.filter((e) => e.createdAt >= since7).length
  const prev7d = events30.filter((e) => e.createdAt >= since14 && e.createdAt < since7).length

  const prev30d = countAll(byType60d) - total30d
  const projectViewsPrev30d = countAll(byType60d, 'project_view') - projectViews30d
  const whatsappPrev30d = countAll(byType60d, 'whatsapp_click') - whatsapp30d

  // Daily series (last 30 days, page_view + project_view only)
  const buckets = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * day)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  const projectCounts = new Map<string, number>()
  const countryCounts = new Map<string, number>()
  for (const e of events30) {
    if (e.eventType === 'page_view' || e.eventType === 'project_view') {
      const key = e.createdAt.toISOString().slice(0, 10)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1)
    }
    if (e.eventType === 'project_view' && e.projectPageId) {
      projectCounts.set(e.projectPageId, (projectCounts.get(e.projectPageId) || 0) + 1)
    }
    const c = (e.country || 'unknown').toUpperCase()
    countryCounts.set(c, (countryCounts.get(c) || 0) + 1)
  }

  // Full project list (LEFT-JOIN equivalent): every project for this
  // profile merged with its view count, zeros included, most-viewed first.
  const projects: PortfolioAnalyticsProject[] = profile.projectPages
    .map((p) => ({
      id: p.id,
      title: p.title || 'Untitled project',
      slug: p.slug,
      coverImage: p.coverImage,
      views: projectCounts.get(p.id) || 0,
    }))
    .sort((a, b) => b.views - a.views)

  const topCountries: PortfolioAnalyticsCountry[] = [...countryCounts.entries()]
    .map(([country, views]) => ({ country, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)

  return {
    username: profile.username,
    totalAllTime,
    total7d,
    total30d,
    prev7d,
    prev30d,
    projectViews,
    projectViews30d,
    projectViewsPrev30d,
    whatsappClicks,
    whatsapp30d,
    whatsappPrev30d,
    daily: [...buckets.entries()].map(([date, views]) => ({ date, views })),
    projects,
    topCountries,
  }
}
