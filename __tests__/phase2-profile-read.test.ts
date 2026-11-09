import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    pageSection: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    projectPage: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'user-1', displayName: 'Test', email: 't@example.com' })) }))
vi.mock('@/lib/workspaces', () => ({ ensurePersonalWorkspace: vi.fn(async () => ({})) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))
vi.mock('@/lib/subscriptions', () => ({ getSubscriptionState: vi.fn(async () => ({ state: 'ACTIVE' })) }))

import { getOrCreateProfile } from '@/lib/actions/portfolio'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOrCreateProfile read purity (F-48)', () => {
  it('returns an existing profile without mutating sections', async () => {
    mocks.prisma.userProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      username: 'tester',
      pages: [{
        id: 'page-1',
        slug: 'home',
        sections: [
          { id: 'about-1', sectionType: 'about', sectionOrder: 1, content: {}, settings: {} },
          { id: 'about-2', sectionType: 'about', sectionOrder: 2, content: {}, settings: {} },
        ],
      }],
      projectPages: [],
    })

    const profile = await getOrCreateProfile()

    expect(profile?.username).toBe('tester')
    expect(mocks.prisma.userProfile.findUnique).toHaveBeenCalledTimes(1)
    expect(mocks.prisma.userProfile.create).not.toHaveBeenCalled()
    expect(mocks.prisma.pageSection.delete).not.toHaveBeenCalled()
    expect(mocks.prisma.pageSection.create).not.toHaveBeenCalled()
    expect(mocks.prisma.pageSection.update).not.toHaveBeenCalled()
  })

  it('does not insert default sections during an existing-profile read', async () => {
    mocks.prisma.userProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      username: 'minimal',
      pages: [{ id: 'page-1', slug: 'home', sections: [] }],
      projectPages: [],
    })

    const profile = await getOrCreateProfile()

    expect(profile?.pages?.[0]?.sections).toEqual([])
    expect(mocks.prisma.pageSection.create).not.toHaveBeenCalled()
    expect(mocks.prisma.pageSection.delete).not.toHaveBeenCalled()
  })
})
