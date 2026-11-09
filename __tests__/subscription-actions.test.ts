import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const prisma = {
    userProfile: {
      findUnique: vi.fn<(args: unknown) => Promise<unknown>>(),
    },
    projectPage: {
      findFirst: vi.fn<(args: unknown) => Promise<unknown>>(),
      findUnique: vi.fn<(args: unknown) => Promise<unknown>>(),
      findMany: vi.fn<(args: unknown) => Promise<unknown[]>>(),
      count: vi.fn<(args: unknown) => Promise<number>>(),
      create: vi.fn<(args: unknown) => Promise<unknown>>(),
      update: vi.fn<(args: unknown) => Promise<unknown>>(),
      delete: vi.fn<(args: unknown) => Promise<unknown>>(),
    },
    projectItem: {
      deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
      createMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    },
  }
  return { prisma, entitlements: { getEntitlements: vi.fn() } }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'user-1', displayName: 'Test', email: 't@example.com' })) }))
vi.mock('@/lib/workspaces', () => ({ ensurePersonalWorkspace: vi.fn(async () => ({})) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))
vi.mock('@/lib/entitlements', () => ({
  getEntitlements: mocks.entitlements.getEntitlements,
  canCreateStandaloneProjectPage: (ent: { isFree: boolean }) => !ent.isFree,
  canManageStandaloneProjectPage: (ent: { isFree: boolean }, showInProjects: boolean | null | undefined) =>
    showInProjects === false ? !ent.isFree : true,
  canUseSection: () => true,
}))

import { createProjectPage, updateProjectPage, deleteProjectPage } from '@/lib/actions/portfolio'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' })
  mocks.prisma.projectPage.findFirst.mockResolvedValue(null)
  mocks.prisma.projectPage.findUnique.mockResolvedValue({
    id: 'page-1', slug: 'new-project-page', profile: { username: 'tester' }, items: [],
  })
  mocks.prisma.projectPage.findMany.mockResolvedValue([])
  mocks.prisma.projectPage.count.mockResolvedValue(0)
  mocks.prisma.projectPage.create.mockResolvedValue({
    id: 'page-1', slug: 'new-project-page', title: 'New Project Page', displayMode: 'grid',
    showInProjects: false, showBackButton: true, backButtonLabel: 'Back to Portfolio', items: [],
  })
  mocks.prisma.projectPage.update.mockResolvedValue({ id: 'page-1' })
  mocks.prisma.projectPage.delete.mockResolvedValue({ id: 'page-1' })
  mocks.prisma.projectItem.deleteMany.mockResolvedValue({ count: 0 })
  mocks.prisma.projectItem.createMany.mockResolvedValue({ count: 0 })
})

describe('createProjectPage authorization', () => {
  it('rejects Free users with SUBSCRIPTION_REQUIRED', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    const res = await createProjectPage('My Page')
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('SUBSCRIPTION_REQUIRED')
    expect(mocks.prisma.projectPage.create).not.toHaveBeenCalled()
  })

  it('allows paid users to create a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    const res = await createProjectPage('My Page')
    expect(res.success).toBe(true)
    expect(mocks.prisma.projectPage.create).toHaveBeenCalled()
  })

  it('rejects unauthenticated callers', async () => {
    const auth = await import('@/lib/auth')
    ;(auth.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await createProjectPage('My Page')
    expect(res.success).toBe(false)
    expect(mocks.prisma.projectPage.create).not.toHaveBeenCalled()
  })
})

describe('updateProjectPage authorization', () => {
  it('rejects Free users editing a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', showInProjects: false })
    const res = await updateProjectPage('page-1', { title: 'x' })
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('SUBSCRIPTION_REQUIRED')
    expect(mocks.prisma.projectPage.update).not.toHaveBeenCalled()
  })

  it('allows Free users editing a project card', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'card-1', showInProjects: true })
    const res = await updateProjectPage('card-1', { title: 'Card' })
    expect(res.success).toBe(true)
    expect(mocks.prisma.projectPage.update).toHaveBeenCalled()
  })

  it('allows paid users editing a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', showInProjects: false })
    const res = await updateProjectPage('page-1', { title: 'Paid edit' })
    expect(res.success).toBe(true)
  })

  it('rejects a foreign page (ownership)', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue(null)
    const res = await updateProjectPage('foreign', { title: 'x' })
    expect(res.success).toBe(false)
    expect(mocks.prisma.projectPage.update).not.toHaveBeenCalled()
  })
})

describe('deleteProjectPage authorization', () => {
  it('rejects Free users deleting a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', slug: 'p', profileId: 'profile-1', showInProjects: false })
    const res = await deleteProjectPage('page-1')
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('SUBSCRIPTION_REQUIRED')
    expect(mocks.prisma.projectPage.delete).not.toHaveBeenCalled()
  })

  it('allows Free users deleting a project card', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'card-1', slug: 'c', profileId: 'profile-1', showInProjects: true })
    const res = await deleteProjectPage('card-1')
    expect(res.success).toBe(true)
    expect(mocks.prisma.projectPage.delete).toHaveBeenCalled()
  })

  it('allows paid users deleting a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', slug: 'p', profileId: 'profile-1', showInProjects: false })
    const res = await deleteProjectPage('page-1')
    expect(res.success).toBe(true)
  })

  it('rejects a foreign page (ownership)', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue(null)
    const res = await deleteProjectPage('foreign')
    expect(res.success).toBe(false)
    expect(mocks.prisma.projectPage.delete).not.toHaveBeenCalled()
  })
})
describe('updateProjectPage Phase 1 hardening', () => {
  it('rejects forged ownership fields without updating', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', showInProjects: false })
    const res = await updateProjectPage('page-1', { title: 'x', profileId: 'victim-profile', id: 'other', version: 99 })
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('INVALID_PROJECT_PAGE_FIELD')
    expect(mocks.prisma.projectPage.update).not.toHaveBeenCalled()
  })

  it('allows an allow-listed field update', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', showInProjects: false })
    const res = await updateProjectPage('page-1', { title: 'Paid edit', slug: 'paid-edit' })
    expect(res.success).toBe(true)
    expect(mocks.prisma.projectPage.update).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      data: { title: 'Paid edit', slug: 'paid-edit' },
    })
  })

  it('rejects Free users converting a card into a standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'card-1', showInProjects: true })
    const res = await updateProjectPage('card-1', { title: 'Card', showInProjects: false })
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('SUBSCRIPTION_REQUIRED')
    expect(mocks.prisma.projectPage.update).not.toHaveBeenCalled()
  })

  it('rejects Free users editing an existing standalone page', async () => {
    mocks.entitlements.getEntitlements.mockResolvedValue({ state: 'NONE', isFree: true })
    mocks.prisma.projectPage.findFirst.mockResolvedValue({ id: 'page-1', showInProjects: false })
    const res = await updateProjectPage('page-1', { title: 'x' })
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('SUBSCRIPTION_REQUIRED')
    expect(mocks.prisma.projectPage.update).not.toHaveBeenCalled()
  })
})
