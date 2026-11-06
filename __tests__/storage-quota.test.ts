import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(async () => [{ id: 'user-1' }]),
    mediaFile: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  }
  const prisma = {
    mediaFile: {
      aggregate: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (c: typeof tx) => Promise<unknown>) => fn(tx)),
  }
  return { tx, prisma }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/entitlements', () => ({ getEntitlements: vi.fn(async () => ({ state: 'ACTIVE', isFree: false })) }))
vi.mock('@/lib/subscriptions', () => ({ getEffectiveLimits: vi.fn(async () => ({ maxProjects: 10, maxGalleryItems: 60, maxSections: 30, maxStorageMB: 100 })) }))

import {
  PAID_STORAGE_QUOTA_BYTES,
  getStorageUsage,
  reserveStorage,
  completeReservation,
  purgeExpiredReservations,
  reconcileUserStorage,
} from '@/lib/storage-quota'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('storage usage accounting', () => {
  it('sums complete + active reservations and excludes nothing else', async () => {
    mocks.prisma.mediaFile.aggregate
      .mockResolvedValueOnce({ _sum: { size: 100 * 1024 * 1024 } })
      .mockResolvedValueOnce({ _sum: { size: 50 * 1024 * 1024 } })
    const usage = await getStorageUsage('user-1')
    expect(usage.limitBytes).toBe(PAID_STORAGE_QUOTA_BYTES)
    expect(usage.usedBytes).toBe(100 * 1024 * 1024)
    expect(usage.reservedBytes).toBe(50 * 1024 * 1024)
    expect(usage.remainingBytes).toBe(PAID_STORAGE_QUOTA_BYTES - 150 * 1024 * 1024)
    expect(usage.uploadsAllowed).toBe(true)
  })
})

describe('atomic reservation', () => {
  it('reserves when within quota', async () => {
    mocks.tx.mediaFile.aggregate
      .mockResolvedValueOnce({ _sum: { size: 100 } })
      .mockResolvedValueOnce({ _sum: { size: 100 } })
    mocks.tx.mediaFile.create.mockResolvedValue({ id: 'res-1' })
    const res = await reserveStorage('user-1', 100, { key: 'users/user-1/a.pdf', filename: 'a.pdf', mimeType: 'application/pdf', visibility: 'private', purpose: 'document' })
    expect(res.ok).toBe(true)
    expect(mocks.tx.$queryRaw).toHaveBeenCalled()
    expect(mocks.tx.mediaFile.create).toHaveBeenCalled()
  })

  it('rejects when used + reserved + requested exceeds quota', async () => {
    mocks.tx.mediaFile.aggregate
      .mockResolvedValueOnce({ _sum: { size: PAID_STORAGE_QUOTA_BYTES - 10 } })
      .mockResolvedValueOnce({ _sum: { size: 0 } })
    const res = await reserveStorage('user-1', 100, { key: 'users/user-1/a.pdf', filename: 'a.pdf', mimeType: 'application/pdf', visibility: 'private', purpose: 'document' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('QUOTA_EXCEEDED')
    expect(mocks.tx.mediaFile.create).not.toHaveBeenCalled()
  })

  it('rejects ineligible (zero-limit) accounts', async () => {
    const subs = await import('@/lib/subscriptions')
    ;(subs.getEffectiveLimits as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ maxStorageMB: 0 })
    const ents = await import('@/lib/entitlements')
    ;(ents.getEntitlements as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ state: 'NONE', isFree: true })
    mocks.tx.mediaFile.aggregate.mockResolvedValue({ _sum: { size: 0 } })
    const res = await reserveStorage('user-1', 10, { key: 'users/user-1/a.pdf', filename: 'a.pdf', mimeType: 'application/pdf', visibility: 'private', purpose: 'document' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('SUBSCRIPTION_REQUIRED')
  })
})

describe('completion', () => {
  it('rejects actual size that no longer fits and releases the reservation', async () => {
    mocks.tx.mediaFile.findFirst.mockResolvedValue({ id: 'res-1' })
    mocks.tx.mediaFile.aggregate
      .mockResolvedValueOnce({ _sum: { size: PAID_STORAGE_QUOTA_BYTES - 5 } })
      .mockResolvedValueOnce({ _sum: { size: 0 } })
    mocks.tx.mediaFile.delete.mockResolvedValue({})
    const res = await completeReservation('user-1', 'users/user-1/a.pdf', 100)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('QUOTA_EXCEEDED')
    expect(mocks.tx.mediaFile.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } })
  })

  it('returns NOT_FOUND for duplicate/expired completion', async () => {
    mocks.tx.mediaFile.findFirst.mockResolvedValue(null)
    const res = await completeReservation('user-1', 'missing', 10)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toBe('NOT_FOUND')
  })
})

describe('cleanup and reconciliation', () => {
  it('purges expired reservations', async () => {
    mocks.prisma.mediaFile.deleteMany.mockResolvedValue({ count: 3 })
    await expect(purgeExpiredReservations()).resolves.toBe(3)
  })

  it('reports mismatches between DB and R2 sizes', async () => {
    mocks.prisma.mediaFile.findMany.mockResolvedValue([{ objectKey: 'k1', size: 10 }])
    const r = await reconcileUserStorage('user-1', { k1: 10, k2: 5 })
    expect(r.dbBytes).toBe(10)
    expect(r.r2Bytes).toBe(15)
    expect(r.missingInDb).toEqual(['k2'])
  })
})