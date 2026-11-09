import { beforeEach, describe, expect, it, vi } from 'vitest'

interface CreateManyArgs {
  data: Array<Record<string, unknown>>
}

const mocks = vi.hoisted(() => {
  const tx = {
    projectPage: {
      findMany: vi.fn<(args: unknown) => Promise<Array<{ id: string; slug?: string; showInProjects?: boolean }>>>(),
      create: vi.fn<(args: unknown) => Promise<{ id: string }>>(),
      update: vi.fn<(args: any) => Promise<{ id: string }>>(),
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
vi.mock('@/lib/subscriptions', () => ({ getSubscriptionState: vi.fn(async () => ({ state: 'ACTIVE' })) }))
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

describe('updatePortfolio project deletion reference cleanup', () => {
  it('clears page links to a project row deleted in the same save', async () => {
    mocks.tx.projectPage.findMany.mockResolvedValue([
      { id: 'keep-card', slug: 'keep-card', showInProjects: true },
      { id: 'gone-page', slug: 'gone-page', showInProjects: false },
    ])

    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        project({
          id: 'keep-card',
          title: 'Keep',
          slug: 'keep-card',
          showInProjects: true,
          linkType: 'page',
          linkedPageSlug: 'gone-page',
          content: { linkType: 'page', linkedPageSlug: 'gone-page' },
          items: [
            { title: 'Deleted page link', type: 'page_link', externalUrl: 'gone-page' },
            { title: 'External', type: 'external_link', externalUrl: 'https://example.test/x' },
          ],
        }),
      ],
    })

    expect(result.success).toBe(true)
    expect(mocks.tx.projectPage.deleteMany).toHaveBeenCalledWith({
      where: { profileId: 'profile-1', id: { in: ['gone-page'] } },
    })
    const updateCall = mocks.tx.projectPage.update.mock.calls[0][0] as unknown as {
      data: { content: Record<string, unknown> }
    }
    expect(updateCall.data.content).toMatchObject({ linkType: 'none', linkedPageSlug: null })
    const rows = savedRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ title: 'External', externalUrl: 'https://example.test/x' })
  })
})

describe('project card internal page normalization', () => {
  it('persists the canonical slug when the card references a page id', async () => {
    mocks.tx.projectPage.findMany.mockResolvedValue([
      { id: 'card-1', slug: 'card-one', showInProjects: true },
      { id: 'page-id-1', slug: 'case-study', showInProjects: false },
    ])

    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        project({ id: 'card-1', title: 'Card', slug: 'card-one', showInProjects: true, linkType: 'page', linkedPageSlug: 'page-id-1' }),
        project({ id: 'page-id-1', title: 'Case Study', slug: 'case-study', showInProjects: false }),
      ],
    })

    expect(result.success).toBe(true)
    const cardUpdate = mocks.tx.projectPage.update.mock.calls.find(
      (call) => (call[0] as { where: { id: string } }).where.id === 'card-1',
    )?.[0] as { data: { content: Record<string, unknown> } } | undefined
    expect(cardUpdate?.data.content.linkedPageSlug).toBe('case-study')
  })

  it('keeps a persisted slug beginning with new- when the title changes', async () => {
    mocks.tx.projectPage.findMany.mockResolvedValue([
      { id: 'page-new', slug: 'new-project-page', showInProjects: false },
    ])

    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        project({
          id: 'page-new',
          title: 'Renamed Page',
          slug: 'new-project-page',
          showInProjects: false,
        }),
      ],
    })

    expect(result.success).toBe(true)
    const updateCall = mocks.tx.projectPage.update.mock.calls[0]?.[0] as unknown as {
      data: { slug: string }
    }
    expect(updateCall.data.slug).toBe('new-project-page')
  })

  it('still derives a fresh slug for a temporary row', async () => {
    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        project({
          id: 'new-temp-page',
          title: 'Brand New Page',
          slug: '',
          showInProjects: false,
        }),
      ],
    })

    expect(result.success).toBe(true)
    const createCall = mocks.tx.projectPage.create.mock.calls[0]?.[0] as unknown as {
      data: { slug: string }
    }
    expect(createCall.data.slug).toBe('brand-new-page')
  })
})
