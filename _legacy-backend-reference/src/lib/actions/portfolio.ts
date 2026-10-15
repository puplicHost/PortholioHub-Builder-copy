/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

async function requirePortfolioAdmin() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user is owner of any workspace
  const ownedWorkspace = await prisma.workspace.findFirst({
    where: { ownerId: user.id },
  })

  // Or if user is an admin member in any workspace
  const adminMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, role: 'admin', acceptedAt: { not: null } },
  })

  if (!ownedWorkspace && !adminMember) {
    throw new Error('Forbidden: Only ADMIN users can access the portfolio builder.')
  }

  return user
}

export async function getOrCreateProfile() {
  const user = await requirePortfolioAdmin()

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

  // Ensure experience section exists for existing profiles (deduplicate too)
  if (profile?.pages?.[0]) {
    const sections = profile.pages[0].sections || []
    const experienceSections = sections.filter((s: any) => s.sectionType === 'experience')

    // Remove duplicate experience sections
    if (experienceSections.length > 1) {
      const toDelete = experienceSections.slice(1)
      for (const dup of toDelete) {
        await prisma.pageSection.delete({ where: { id: dup.id } })
      }
      // Re-fetch after cleanup
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

      await prisma.pageSection.create({
        data: {
          pageId: profile.pages[0].id,
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

      // Re-fetch to include the new section
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

    // Ensure footer section exists (migrating old contact section if present)
    if (profile?.pages?.[0]) {
      const currentSections = profile.pages[0].sections || []
      const contactSec = currentSections.find((s: any) => s.sectionType === 'contact')
      const footerSec = currentSections.find((s: any) => s.sectionType === 'footer')

      if (contactSec && !footerSec) {
        const existingContent = (contactSec.content as any) || {}
        await prisma.pageSection.update({
          where: { id: contactSec.id },
          data: {
            sectionType: 'footer',
            content: {
              headline: existingContent.heading || existingContent.title || { en: 'Work with me', ar: 'تواصل معي' },
              subheading: existingContent.description || { en: "Let's build something great together.", ar: 'دعنا نبني شيئاً رائعاً معاً.' },
              links: (profile.contactLinks as any) || [],
            } as Prisma.InputJsonValue,
          },
        })
      } else if (contactSec && footerSec) {
        await prisma.pageSection.delete({ where: { id: contactSec.id } })
      } else if (!footerSec && currentSections.length > 0) {
        const maxOrder = currentSections.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0)
        await prisma.pageSection.create({
          data: {
            pageId: profile.pages[0].id,
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
      }

      // Re-fetch profile to reflect section updates
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

    // Ensure testimonials section exists for existing profiles
    if (profile?.pages?.[0]) {
      const currentSections = profile.pages[0].sections || []
      const testimonialsSec = currentSections.find((s: any) => s.sectionType === 'testimonials')

      if (!testimonialsSec && currentSections.length > 0) {
        const footerSection = currentSections.find((s: any) => s.sectionType === 'footer')
        const insertOrder = footerSection
          ? footerSection.sectionOrder
          : currentSections.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0) + 1

        for (const sec of currentSections) {
          if (sec.sectionOrder >= insertOrder) {
            await prisma.pageSection.update({
              where: { id: sec.id },
              data: { sectionOrder: sec.sectionOrder + 1 },
            })
          }
        }

        await prisma.pageSection.create({
          data: {
            pageId: profile.pages[0].id,
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

    profile = await prisma.userProfile.create({
      data: {
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
      },
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
  projects?: any[]
}) {
  try {
    const user = await requirePortfolioAdmin()
    
    if (data.username) {
      const existing = await prisma.userProfile.findUnique({ where: { username: data.username } })
      if (existing && existing.userId !== user.id) {
        return { success: false, error: 'Username is already taken' }
      }
    }

    // Update profile
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        username: data.username,
        avatarUrl: data.avatarUrl,
        appearance: data.appearance,
        localized: data.localized,
        contactLinks: data.contactLinks,
      },
    })

    // Update sections if provided
    if (data.sections && data.sections.length > 0) {
      // Assuming we only update existing sections of the 'home' page for now
      for (const sec of data.sections) {
        if (sec.id) {
          const secSettings = (sec.settings as any) || {}
          if (sec.visible !== undefined) {
            secSettings.isVisible = sec.visible
          }
          await prisma.pageSection.update({
            where: { id: sec.id },
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

      const existingProjects = await prisma.projectPage.findMany({ where: { profileId: data.id } })
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
            coverImage: proj.coverImage || null,
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
            externalLink: proj.externalLink || null,
            linkLabel: proj.linkLabel || null,
          }

          let realProjectId: string

          if (isTempId) {
            // For new projects: CREATE record first to get the REAL DB id
            const created = await prisma.projectPage.create({
              data: {
                profileId: data.id,
                ...projectData,
              },
            })
            realProjectId = created.id
            keptProjectIds.add(realProjectId)
            savedProjects.push({ id: realProjectId, tempId: proj.id, slug, title: projectData.title })
          } else {
            // If project.id is a real UUID: do prisma.projectPage.update() + delete old items + create new ones
            const updated = await prisma.projectPage.update({
              where: { id: proj.id },
              data: projectData,
            })
            realProjectId = updated.id
            keptProjectIds.add(realProjectId)
            savedProjects.push({ id: realProjectId, slug, title: projectData.title })

            await prisma.projectItem.deleteMany({ where: { projectId: realProjectId } })
          }

          // Filter out any items where ALL of (externalUrl, textContent, imageUrl, workspaceItemId) are undefined/empty
          if (proj.items && proj.items.length > 0) {
            const validItems = proj.items
              .map((item: any, idx: number) => {
                let itemType = item.type
                if (!itemType || !VALID_TYPES.includes(itemType)) {
                  itemType = 'external_link'
                }

                const externalUrl = item.externalUrl || (item.linkType === 'page' ? item.linkedPageSlug : null) || null
                const textContent = item.textContent || null
                const imageUrl = item.imageUrl || null
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
    
    return { success: true, savedProjects }
  } catch (error: any) {
    console.error('updatePortfolio error:', error)
    return { success: false, error: error.message || 'Failed to save portfolio' }
  }
}

export async function createProjectPage(titleOrProfileId?: string, maybeTitle?: string) {
  try {
    const user = await requirePortfolioAdmin()
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
    const user = await requirePortfolioAdmin()

    const { items, ...pageData } = data

    await prisma.projectPage.update({
      where: { id },
      data: pageData,
    })

    // Handle items: delete all existing and re-insert
    if (items !== undefined) {
      await prisma.projectItem.deleteMany({ where: { projectId: id } })
      if (items && items.length > 0) {
        await prisma.projectItem.createMany({
          data: items.map((item: any, index: number) => ({
            projectId: id,
            type: item.linkType === 'page' ? 'page_link' : item.type,
            workspaceItemId: item.workspaceItemId || null,
            externalUrl: item.linkType === 'page' ? item.linkedPageSlug : item.externalUrl,
            textContent: item.textContent || null,
            imageUrl: item.imageUrl || null,
            title: item.linkLabel || item.title || null,
            sortOrder: item.sortOrder ?? index,
          }))
        })
      }
    }

    revalidatePath('/profile/builder')
    const pp = await prisma.projectPage.findUnique({ where: { id }, include: { profile: true } })
    if (pp) {
      revalidatePath(`/u/${(pp as any).profile.username}/projects/${pp.slug}`)
    }

    // Return the updated page with items
    const updatedPage = await prisma.projectPage.findUnique({
      where: { id },
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
    const user = await requirePortfolioAdmin()
    await prisma.projectPage.delete({ where: { id } })

    revalidatePath('/profile/builder')
    return { success: true }
  } catch (error: any) {
    console.error('deleteProjectPage error:', error)
    return { success: false, error: error.message || 'Failed to delete project page' }
  }
}

export async function getAdminWorkspaceContent() {
  const user = await requirePortfolioAdmin()

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
  const user = await requirePortfolioAdmin()

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

  const [totalAllTime, total7d, total30d, prev7d, prev30d, projectViews, projectViews30d, projectViewsPrev30d, whatsappClicks, whatsapp30d, whatsappPrev30d, events30] =
    await Promise.all([
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, createdAt: { gte: since7 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, createdAt: { gte: since30 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, createdAt: { gte: since14, lt: since7 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, createdAt: { gte: since60, lt: since30 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'project_view' } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'project_view', createdAt: { gte: since30 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'project_view', createdAt: { gte: since60, lt: since30 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'whatsapp_click' } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'whatsapp_click', createdAt: { gte: since30 } } }),
      prisma.portfolioViewEvent.count({ where: { profileId: profile.id, eventType: 'whatsapp_click', createdAt: { gte: since60, lt: since30 } } }),
      prisma.portfolioViewEvent.findMany({
        where: { profileId: profile.id, createdAt: { gte: since30 } },
        select: { eventType: true, projectPageId: true, country: true, createdAt: true },
      }),
    ])

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
