import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    projectPage: {
      findMany: vi.fn<(args: unknown) => Promise<{ id: string }[]>>(),
      create: vi.fn<(args: any) => Promise<{ id: string }>>(),
      update: vi.fn<(args: any) => Promise<{ id: string }>>(),
      deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
    projectItem: {
      deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
      createMany: vi.fn<(args: any) => Promise<{ count: number }>>(),
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

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({ id: 'profile-1', username: 'tester', version: 1 })
  mocks.tx.projectPage.findMany.mockResolvedValue([{ id: 'page-1' }])
  mocks.tx.projectPage.update.mockResolvedValue({ id: 'page-1' })
  mocks.tx.projectPage.create.mockResolvedValue({ id: 'created-1' })
  mocks.tx.projectPage.deleteMany.mockResolvedValue({ count: 0 })
  mocks.tx.projectItem.deleteMany.mockResolvedValue({ count: 0 })
  mocks.tx.projectItem.createMany.mockResolvedValue({ count: 0 })
  mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
})

describe('attachment persistence in project content', () => {
  it('preserves itemCards attachment metadata when saving a project page', async () => {
    const itemCards = [
      {
        cardVisual: 'file-icon',
        fileType: 'pdf',
        attachmentName: 'cv.pdf',
        attachmentType: 'application/pdf',
        attachmentSize: 1234,
        attachmentId: 'file-1',
      },
    ]
    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        {
          id: 'page-1',
          title: 'Project',
          slug: 'project',
          content: { itemCards },
          items: [
            {
              id: 'item-1',
              type: 'external_link',
              title: 'CV',
              externalUrl: '/api/files/r2/file-1',
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
    const updateCall = mocks.tx.projectPage.update.mock.calls[0][0] as any
    expect(updateCall.data.content.itemCards).toEqual(itemCards)
    // The persisted item keeps the stable external URL (resolved fresh on open).
    const rows = mocks.tx.projectItem.createMany.mock.calls[0][0].data
    expect(rows[0].externalUrl).toBe('/api/files/r2/file-1')
  })

  it('preserves external URL attachments without itemCards', async () => {
    const result = await updatePortfolio({
      id: 'profile-1',
      projects: [
        {
          id: 'page-1',
          title: 'Project',
          slug: 'project',
          content: {},
          items: [
            {
              id: 'item-2',
              type: 'external_link',
              title: 'Drive',
              externalUrl: 'https://drive.google.com/file/d/abc/view',
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
    const rows = mocks.tx.projectItem.createMany.mock.calls[0][0].data
    expect(rows[0].externalUrl).toBe('https://drive.google.com/file/d/abc/view')
  })
})