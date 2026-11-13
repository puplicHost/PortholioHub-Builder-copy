import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    userProfile: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    pageSection: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  }
  const prisma = {
    userProfile: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  }
  return {
    tx,
    prisma,
    getCurrentUser: vi.fn(),
    getEntitlements: vi.fn(),
    getEffectiveLimits: vi.fn(),
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/entitlements', () => ({ getEntitlements: mocks.getEntitlements }))
vi.mock('@/lib/subscriptions', () => ({ getEffectiveLimits: mocks.getEffectiveLimits }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))

import { applyCvSuggestions } from '@/lib/actions/cv-import'

function makeProfile() {
  return {
    id: 'profile-1',
    userId: 'user-1',
    username: 'tester',
    localized: {
      displayName: { en: 'Old Name' },
      professionalTitle: { en: 'Old Title' },
      location: { en: 'Old Location' },
      bio: { en: 'Old Bio' },
    },
    pages: [{
      id: 'home-1',
      slug: 'home',
      sections: [
        {
          id: 'hero-1',
          sectionType: 'hero',
          sectionOrder: 1,
          content: { title: { en: 'Hello' }, subtitle: { en: 'Old Title' } },
          settings: { isVisible: true },
        },
        {
          id: 'about-1',
          sectionType: 'about',
          sectionOrder: 2,
          content: { biography: { en: 'Old Bio' } },
          settings: { isVisible: true },
        },
        {
          id: 'experience-1',
          sectionType: 'experience',
          sectionOrder: 3,
          content: {
            heading: { en: 'Work Experience' },
            items: [{ id: 'e1', jobTitle: 'Existing Role', companyName: 'Existing Co', startDate: '2020-01' }],
          },
          settings: { isVisible: true },
        },
        {
          id: 'skills-1',
          sectionType: 'skills',
          sectionOrder: 4,
          content: {
            heading: { en: 'Skills' },
            groups: [{ name: 'Skills', skills: [{ name: 'React', percentage: 80 }] }],
          },
          settings: { isVisible: true },
        },
        {
          id: 'education-1',
          sectionType: 'education',
          sectionOrder: 5,
          content: { title: { en: 'Education' }, items: [] },
          settings: { isVisible: true },
        },
      ],
    }],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
  mocks.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
  mocks.getEffectiveLimits.mockResolvedValue({
    maxProjects: 10,
    maxGalleryItems: 60,
    maxSections: 30,
    maxStorageMB: 500,
  })
  mocks.prisma.userProfile.findUnique.mockResolvedValue(makeProfile())
  mocks.tx.userProfile.findUnique
    .mockReset()
    .mockResolvedValueOnce({ version: 1, username: 'tester' })
    .mockResolvedValue({ version: 2, username: 'tester' })
  mocks.tx.userProfile.updateMany.mockResolvedValue({ count: 1 })
  mocks.tx.pageSection.updateMany.mockResolvedValue({ count: 1 })
  mocks.tx.pageSection.create.mockResolvedValue({ id: 'created-section' })
})

describe('applyCvSuggestions', () => {
  it('rejects unauthenticated and free users before touching the database', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null)
    await expect(applyCvSuggestions({ expectedVersion: 1, approved: {} })).resolves.toMatchObject({
      success: false,
      code: 'UNAUTHORIZED',
    })

    mocks.getEntitlements.mockResolvedValueOnce({ state: 'NONE', isFree: true })
    await expect(applyCvSuggestions({
      expectedVersion: 1,
      approved: { displayName: { lang: 'en', value: 'New Name' } },
    })).resolves.toMatchObject({
      success: false,
      code: 'SUBSCRIPTION_REQUIRED',
    })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('requires at least one approved field and rejects unknown fields', async () => {
    await expect(applyCvSuggestions({ expectedVersion: 1, approved: {} })).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
    })
    await expect(applyCvSuggestions({
      expectedVersion: 1,
      approved: { displayName: { lang: 'en', value: 'New Name' }, sectionId: 'foreign' },
    })).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
    })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('applies only the selected scalar and preserves unselected values', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        location: { lang: 'en', value: 'Berlin, Germany', overwrite: true },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { location: true, displayName: false } })
    const update = mocks.tx.userProfile.updateMany.mock.calls[0][0]
    expect(update.data.localized.location.en).toBe('Berlin, Germany')
    expect(update.data.localized.displayName.en).toBe('Old Name')
    expect(update.data.localized.professionalTitle.en).toBe('Old Title')
    expect(mocks.tx.pageSection.updateMany).not.toHaveBeenCalled()
  })

  it('requires explicit overwrite confirmation for a populated field', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: { displayName: { lang: 'en', value: 'New Name' } },
    })

    expect(result).toMatchObject({
      success: false,
      code: 'OVERWRITE_CONFIRMATION_REQUIRED',
      overwriteFields: ['displayName'],
    })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('applies a populated scalar only with overwrite: true', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: { displayName: { lang: 'en', value: 'New Name', overwrite: true } },
    })

    expect(result).toMatchObject({ success: true, applied: { displayName: true } })
    expect(mocks.tx.userProfile.updateMany.mock.calls[0][0].data.localized.displayName.en).toBe('New Name')
  })

  it('keeps the professional title and bio in sync with their visible sections', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        professionalTitle: { lang: 'en', value: 'Staff Engineer', overwrite: true },
        bio: { lang: 'en', value: 'Updated professional bio.', overwrite: true },
      },
    })

    expect(result).toMatchObject({ success: true })
    const calls = mocks.tx.pageSection.updateMany.mock.calls as Array<
      [{ data: { content: { subtitle?: { en?: string }; biography?: { en?: string } } } }]
    >
    const updates = calls.map((call) => call[0].data.content)
    const hero = updates.find((content) => content.subtitle)
    const about = updates.find((content) => content.biography)
    expect(hero?.subtitle?.en).toBe('Staff Engineer')
    expect(about?.biography?.en).toBe('Updated professional bio.')
  })

  it('appends and deduplicates experience without removing existing items', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        experience: {
          items: [
            { jobTitle: 'Existing Role', companyName: 'Existing Co', startDate: '2020-01' },
            { jobTitle: 'New Role', companyName: 'New Co', startDate: '2022-01' },
          ],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { experience: 1 } })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.items).toHaveLength(2)
    expect(content.items[0].jobTitle).toBe('Existing Role')
    expect(content.items[1].jobTitle).toBe('New Role')
  })

  it('appends and deduplicates skills while preserving existing skills', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [{ name: 'Skills', skills: ['React', 'Vue', 'TypeScript'] }],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { skills: 2 } })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.groups[0].skills.map((item: { name: string }) => item.name)).toEqual(['React', 'Vue', 'TypeScript'])
  })

  it('matches existing groups, appends into them, and appends new groups without reordering', async () => {
    const profile = makeProfile()
    const skillsSection = profile.pages[0].sections.find((section) => section.sectionType === 'skills')!
    const skillsContent = skillsSection.content as unknown as {
      groups: Array<{ name: string; icon?: string | null; skills: { name: string; percentage: number }[] }>
    }
    skillsContent.groups = [
      { name: 'Technical Skills', icon: 'code', skills: [{ name: 'React', percentage: 80 }] },
      { name: 'Tools', skills: [{ name: 'Git', percentage: 70 }] },
    ]
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [
            { name: 'technical skills', skills: ['Vue'] },
            { name: 'Tools', skills: ['Docker', 'Git'] },
            { name: 'Languages', skills: ['Arabic'] },
          ],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { skills: 3 } })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.groups.map((group: { name: string }) => group.name)).toEqual([
      'Technical Skills',
      'Tools',
      'Languages',
    ])
    expect(content.groups[0]).toMatchObject({
      icon: 'code',
      skills: [{ name: 'React', percentage: 80 }, { name: 'Vue' }],
    })
    expect(content.groups[1].skills.map((item: { name: string }) => item.name)).toEqual(['Git', 'Docker'])
    expect(content.groups[2].skills.map((item: { name: string }) => item.name)).toEqual(['Arabic'])
  })

  it('deduplicates approved skills across groups', async () => {
    const profile = makeProfile()
    const skillsSection = profile.pages[0].sections.find((section) => section.sectionType === 'skills')!
    skillsSection.content.groups = [{ name: 'Technical', skills: [{ name: 'React', percentage: 80 }] }]
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [
            { name: 'Technical', skills: ['React', 'Vue'] },
            { name: 'Tools', skills: ['React', 'Docker'] },
          ],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { skills: 2 } })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.groups[0].skills.map((item: { name: string }) => item.name)).toEqual(['React', 'Vue'])
    expect(content.groups[1].skills.map((item: { name: string }) => item.name)).toEqual(['Docker'])
  })

  it('matches an existing general group instead of creating a duplicate', async () => {
    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [{ name: 'Other Skills', skills: ['Vue'] }],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { skills: 1 } })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.groups).toHaveLength(1)
    expect(content.groups[0].name).toBe('Skills')
    expect(content.groups[0].skills.map((item: { name: string }) => item.name)).toEqual(['React', 'Vue'])
  })

  it('refuses a new group when the profile is at the group limit', async () => {
    const profile = makeProfile()
    const skillsSection = profile.pages[0].sections.find((section) => section.sectionType === 'skills')!
    skillsSection.content.groups = Array.from({ length: 10 }, (_, index) => ({
      name: `Group ${index + 1}`,
      skills: [{ name: `Skill ${index + 1}`, percentage: 80 }],
    }))
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [{ name: 'Languages', skills: ['Arabic'] }],
        },
      },
    })

    expect(result).toMatchObject({ success: false, code: 'SKILL_GROUP_LIMIT_REACHED' })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('caps total skills and reports skipped values', async () => {
    const profile = makeProfile()
    const skillsSection = profile.pages[0].sections.find((section) => section.sectionType === 'skills')!
    skillsSection.content.groups = [{
      name: 'Skills',
      skills: Array.from({ length: 49 }, (_, index) => ({ name: `Existing ${index + 1}`, percentage: 80 })),
    }]
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: {
        skillGroups: {
          groups: [{ name: 'Skills', skills: ['New One', 'New Two'] }],
        },
      },
    })

    expect(result).toMatchObject({ success: true, applied: { skills: 1 }, skippedSkills: 1 })
    const content = mocks.tx.pageSection.updateMany.mock.calls[0][0].data.content
    expect(content.groups[0].skills).toHaveLength(50)
  })

  it('returns a version conflict without partial writes', async () => {
    mocks.tx.userProfile.findUnique.mockReset()
    mocks.tx.userProfile.findUnique.mockResolvedValue({ version: 2, username: 'tester' })

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: { displayName: { lang: 'en', value: 'New Name', overwrite: true } },
    })

    expect(result).toMatchObject({ success: false, code: 'VERSION_CONFLICT', currentVersion: 2 })
    expect(mocks.tx.pageSection.updateMany).not.toHaveBeenCalled()
    expect(mocks.tx.userProfile.updateMany).not.toHaveBeenCalled()
  })

  it('creates a missing section only when its field is approved', async () => {
    const profile = makeProfile()
    profile.pages[0].sections = profile.pages[0].sections.filter((section) => section.sectionType !== 'education')
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: { education: { items: [{ title: 'BSc Computer Science', institution: 'Cairo University' }] } },
    })

    expect(result).toMatchObject({ success: true, applied: { education: 1 } })
    const created = mocks.tx.pageSection.create.mock.calls[0][0]
    expect(created.data.sectionType).toBe('education')
    expect(created.data.content.items[0].title).toBe('BSc Computer Science')
  })

  it('does not create a new section when the plan section cap would be exceeded', async () => {
    const profile = makeProfile()
    profile.pages[0].sections = profile.pages[0].sections.filter((section) => section.sectionType !== 'education')
    mocks.prisma.userProfile.findUnique.mockResolvedValue(profile)
    mocks.getEffectiveLimits.mockResolvedValue({
      maxProjects: 10,
      maxGalleryItems: 60,
      maxSections: 4,
      maxStorageMB: 500,
    })

    const result = await applyCvSuggestions({
      expectedVersion: 1,
      approved: { education: { items: [{ title: 'BSc Computer Science', institution: 'Cairo University' }] } },
    })

    expect(result).toMatchObject({ success: false, code: 'SECTION_LIMIT_REACHED' })
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })
})
