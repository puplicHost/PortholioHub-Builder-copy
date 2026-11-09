import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    userProfile: { findUnique: vi.fn() },
    portfolioViewEvent: {
      groupBy: vi.fn(async () => []),
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
  },
  ensurePersonalWorkspace: vi.fn(async () => ({})),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'user-1' })) }))
vi.mock('@/lib/workspaces', () => ({ ensurePersonalWorkspace: mocks.ensurePersonalWorkspace }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))
vi.mock('@/lib/subscriptions', () => ({ getSubscriptionState: vi.fn(async () => ({ state: 'ACTIVE' })) }))

import { getPortfolioAnalytics } from '@/lib/actions/portfolio'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({
    id: 'profile-1',
    username: 'tester',
    projectPages: [],
  })
})

describe('analytics read path (Issue E)', () => {
  it('does not bootstrap a workspace for a read-only analytics request', async () => {
    const data = await getPortfolioAnalytics()
    expect(data.totalAllTime).toBe(0)
    expect(data.daily).toHaveLength(30)
    expect(mocks.ensurePersonalWorkspace).not.toHaveBeenCalled()
  })

  it('uses grouped/count queries instead of loading every event row', async () => {
    await getPortfolioAnalytics()
    expect(mocks.prisma.portfolioViewEvent.groupBy).toHaveBeenCalled()
    expect(mocks.prisma.portfolioViewEvent.count).toHaveBeenCalled()
    // findMany remains only for the daily timestamp series, not analytics totals.
    const findManyArgs = (mocks.prisma.portfolioViewEvent.findMany as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    expect(findManyArgs?.select).toEqual({ createdAt: true })
  })
})
