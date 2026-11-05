import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    projectPage: {
      findMany: vi.fn<(args: unknown) => Promise<{ id: string }[]>>(),
      create: vi.fn<(args: unknown) => Promise<{ id: string }>>(),
      update: vi.fn<(args: { where: { id: string } }) => Promise<{ id: string }>>(),
      deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
    projectItem: {
      deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
      createMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
    userProfile: {
      findUnique: vi.fn<(args: unknown) => Promise<{ id: string; username: string; version: number } | null>>(),
      update: vi.fn<(args: unknown) => Promise<{ version: number }>>(),
      updateMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
    profilePage: {
      findFirst: vi.fn<(args: unknown) => Promise<{ id: string } | null>>(),
    },
    pageSection: {
      findMany: vi.fn<(args: unknown) => Promise<Array<Record<string, unknown>>>>(),
      create: vi.fn<(args: unknown) => Promise<{ id: string }>>(),
      updateMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
  }

  const prisma = {
    userProfile: {
      findUnique: vi.fn<(args: unknown) => Promise<{ id: string; username: string; version: number } | null>>(),
    },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  }

  return { tx, prisma }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'user-1' })) }))
vi.mock('@/lib/workspaces', () => ({ ensurePersonalWorkspace: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))

import { updatePortfolio } from '@/lib/actions/portfolio'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({
    id: 'profile-1',
    username: 'tester',
    version: 1,
  })
  mocks.tx.profilePage.findFirst.mockResolvedValue({ id: 'home-page' })
  mocks.tx.pageSection.findMany.mockResolvedValue([
    {
      id: 'sec-exp',
      sectionOrder: 3,
      content: { items: [{ id: 'a', jobTitle: 'A' }, { id: 'b', jobTitle: 'B' }] },
      settings: { isVisible: true },
    },
  ])
  mocks.tx.pageSection.updateMany.mockResolvedValue({ count: 1 })
  mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
})

describe('experience reordering persistence', () => {
  it('persists reordered experience items in the new order', async () => {
    const result = await updatePortfolio({
      id: 'profile-1',
      sections: [
        {
          id: 'sec-exp',
          sectionType: 'experience',
          sectionOrder: 3,
          content: { items: [{ id: 'b', jobTitle: 'B' }, { id: 'a', jobTitle: 'A' }] },
          settings: { isVisible: true },
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(mocks.tx.pageSection.updateMany).toHaveBeenCalled()
    const call = mocks.tx.pageSection.updateMany.mock.calls[0][0] as { data: { content: { items: { id: string }[] } } }
    expect(call.data.content.items.map((x: { id: string }) => x.id)).toEqual(['b', 'a'])
  })

  it('preserves all item properties and order on reorder', async () => {
    const itemA = { id: 'a', jobTitle: 'Engineer', companyName: 'Acme', startDate: '2020-01', isCurrent: true, description: 'Did things' }
    const itemB = { id: 'b', jobTitle: 'Designer', companyName: 'Beta', startDate: '2018-06', isCurrent: false, description: 'Designed' }
    mocks.tx.pageSection.findMany.mockResolvedValue([
      {
        id: 'sec-exp',
        sectionOrder: 3,
        content: { items: [itemA, itemB] },
        settings: { isVisible: true },
      },
    ])
    const result = await updatePortfolio({
      id: 'profile-1',
      sections: [
        {
          id: 'sec-exp',
          sectionType: 'experience',
          sectionOrder: 3,
          content: { items: [itemB, itemA] },
          settings: { isVisible: true },
        },
      ],
    })

    expect(result.success).toBe(true)
    const call = mocks.tx.pageSection.updateMany.mock.calls[0][0] as { data: { content: { items: any[] } } }
    expect(call.data.content.items.map((x: any) => x.id)).toEqual(['b', 'a'])
    expect(call.data.content.items[0]).toMatchObject(itemB)
    expect(call.data.content.items[1]).toMatchObject(itemA)
  })

  it('does not write when order and content are unchanged', async () => {
    const result = await updatePortfolio({
      id: 'profile-1',
      sections: [
        {
          id: 'sec-exp',
          sectionType: 'experience',
          sectionOrder: 3,
          content: { items: [{ id: 'a', jobTitle: 'A' }, { id: 'b', jobTitle: 'B' }] },
          settings: { isVisible: true },
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(mocks.tx.pageSection.updateMany).not.toHaveBeenCalled()
  })
})