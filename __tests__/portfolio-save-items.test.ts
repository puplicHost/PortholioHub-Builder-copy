import { beforeEach, describe, expect, it, vi } from 'vitest'

interface CreateManyArgs {
  data: Array<Record<string, unknown>>
}

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
      createMany: vi.fn<(args: CreateManyArgs) => Promise<{ count: number }>>(),
    },
    userProfile: {
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

function project(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    title: 'Row',
    slug: 'row',
    showInProjects: false,
    linkType: 'none',
    items: [],
    ...overrides,
  }
}

async function saveProjects(projects: Record<string, unknown>[], existingIds: string[]) {
  mocks.tx.projectPage.findMany.mockResolvedValue(existingIds.map((id) => ({ id })))
  return updatePortfolio({ id: 'profile-1', projects })
}

function savedRows() {
  return mocks.tx.projectItem.createMany.mock.calls[0]?.[0]?.data ?? []
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({
    id: 'profile-1',
    username: 'tester',
    version: 1,
  })
  mocks.tx.projectPage.update.mockImplementation(async ({ where }) => ({ id: where.id }))
  mocks.tx.projectPage.create.mockResolvedValue({ id: 'created-id' })
  mocks.tx.projectPage.deleteMany.mockResolvedValue({ count: 0 })
  mocks.tx.projectItem.deleteMany.mockResolvedValue({ count: 0 })
  mocks.tx.projectItem.createMany.mockResolvedValue({ count: 0 })
  mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
})

describe('updatePortfolio project items persistence', () => {
  it('persists a title-only item (no description/image/link)', async () => {
    const result = await saveProjects(
      [
        project({
          id: 'page-1',
          slug: 'page-one',
          items: [{ title: 'Only a title', type: 'external_link' }],
        }),
      ],
      ['page-1'],
    )

    expect(result.success).toBe(true)
    const rows = savedRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      projectId: 'page-1',
      title: 'Only a title',
      type: 'external_link',
    })
  })

  it('persists a fully populated item', async () => {
    await saveProjects(
      [
        project({
          id: 'page-1',
          slug: 'page-one',
          items: [
            {
              title: 'Full item',
              textContent: 'A description',
              imageUrl: 'https://img.test/a.png',
              externalUrl: 'https://example.test/project',
              type: 'external_link',
            },
          ],
        }),
      ],
      ['page-1'],
    )

    const rows = savedRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      projectId: 'page-1',
      title: 'Full item',
      textContent: 'A description',
      imageUrl: 'https://img.test/a.png',
      externalUrl: 'https://example.test/project',
    })
  })

  it('skips a completely empty item', async () => {
    await saveProjects(
      [
        project({
          id: 'page-1',
          slug: 'page-one',
          items: [{ type: 'external_link' }],
        }),
      ],
      ['page-1'],
    )

    expect(mocks.tx.projectItem.createMany).not.toHaveBeenCalled()
  })

  it('moves items from a linked card to its page row', async () => {
    await saveProjects(
      [
        project({
          id: 'card-1',
          title: 'Card',
          slug: 'card',
          showInProjects: true,
          linkType: 'page',
          linkedPageSlug: 'target-page',
          items: [{ title: 'Card item', textContent: 'Body', type: 'external_link' }],
        }),
        project({
          id: 'page-1',
          title: 'Target',
          slug: 'target-page',
          showInProjects: false,
          items: [],
        }),
      ],
      ['card-1', 'page-1'],
    )

    const rows = savedRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      projectId: 'page-1',
      title: 'Card item',
    })
    expect(rows[0].projectId).not.toBe('card-1')
  })
})
