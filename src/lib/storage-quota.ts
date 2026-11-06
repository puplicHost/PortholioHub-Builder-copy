import { prisma } from '@/lib/prisma'
import { getEntitlements } from '@/lib/entitlements'
import { getEffectiveLimits } from '@/lib/subscriptions'

// Binary megabytes (MiB). 500 MiB = 524,288,000 bytes.
export const PAID_STORAGE_QUOTA_BYTES = 524_288_000
export const RESERVATION_TTL_MS = 60 * 60 * 1000 // 1 hour

export interface StorageUsage {
  limitBytes: number
  usedBytes: number
  reservedBytes: number
  remainingBytes: number
  percent: number
  uploadsAllowed: boolean
}

/** Resolve the server-side quota. Paid (ACTIVE/GRACE) = 500 MiB.
 *  Free accounts keep the existing product limit (plan/default maxStorageMB). */
export async function getStorageLimitBytes(userId: string): Promise<number> {
  const ent = await getEntitlements(userId)
  if (!ent.isFree) return PAID_STORAGE_QUOTA_BYTES
  const limits = await getEffectiveLimits(userId)
  return Math.max(0, Math.min(limits.maxStorageMB, 500)) * 1024 * 1024
}

function cutoff() {
  return new Date(Date.now() - RESERVATION_TTL_MS)
}

export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const limitBytes = await getStorageLimitBytes(userId)
  const [complete, pending] = await Promise.all([
    prisma.mediaFile.aggregate({
      where: { userId, storageProvider: 'r2', uploadStatus: 'complete' },
      _sum: { size: true },
    }),
    prisma.mediaFile.aggregate({
      where: { userId, storageProvider: 'r2', uploadStatus: 'pending', createdAt: { gte: cutoff() } },
      _sum: { size: true },
    }),
  ])
  const usedBytes = complete._sum.size || 0
  const reservedBytes = pending._sum.size || 0
  const remainingBytes = Math.max(0, limitBytes - usedBytes - reservedBytes)
  return {
    limitBytes,
    usedBytes,
    reservedBytes,
    remainingBytes,
    percent: limitBytes > 0 ? Math.min(100, Math.round(((usedBytes + reservedBytes) / limitBytes) * 100)) : 100,
    uploadsAllowed: limitBytes > usedBytes + reservedBytes,
  }
}

export interface ReservationInput {
  key: string
  filename: string
  mimeType: string
  visibility: 'public' | 'private'
  purpose: string
}

export type ReservationResult =
  | { ok: true; reservationId: string; limitBytes: number; usedBytes: number; reservedBytes: number }
  | { ok: false; reason: 'QUOTA_EXCEEDED' | 'SUBSCRIPTION_REQUIRED'; limitBytes: number; usedBytes: number; reservedBytes: number }

/** Atomically check + reserve. Locks the user row so concurrent requests on
 *  different Vercel instances serialize on the database, not on process memory. */
export async function reserveStorage(
  userId: string,
  requestedBytes: number,
  input: ReservationInput,
): Promise<ReservationResult> {
  if (!Number.isFinite(requestedBytes) || requestedBytes <= 0) {
    return { ok: false, reason: 'QUOTA_EXCEEDED', limitBytes: 0, usedBytes: 0, reservedBytes: 0 }
  }
  const limitBytes = await getStorageLimitBytes(userId)

  return prisma.$transaction(async (tx) => {
    // Serialize quota checks for this user across all instances.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`

    const [complete, pending] = await Promise.all([
      tx.mediaFile.aggregate({
        where: { userId, storageProvider: 'r2', uploadStatus: 'complete' },
        _sum: { size: true },
      }),
      tx.mediaFile.aggregate({
        where: { userId, storageProvider: 'r2', uploadStatus: 'pending', createdAt: { gte: cutoff() } },
        _sum: { size: true },
      }),
    ])
    const usedBytes = complete._sum.size || 0
    const reservedBytes = pending._sum.size || 0

    if (limitBytes <= 0) {
      return { ok: false as const, reason: 'SUBSCRIPTION_REQUIRED' as const, limitBytes, usedBytes, reservedBytes }
    }
    if (usedBytes + reservedBytes + requestedBytes > limitBytes) {
      return { ok: false as const, reason: 'QUOTA_EXCEEDED' as const, limitBytes, usedBytes, reservedBytes }
    }

    const record = await tx.mediaFile.create({
      data: {
        userId,
        fileType: input.mimeType.startsWith('video/') ? 'video' : 'document',
        mimeType: input.mimeType,
        filename: input.filename,
        publicUrl: '',
        storageProvider: 'r2',
        objectKey: input.key,
        bucket: process.env.R2_BUCKET_NAME || null,
        visibility: input.visibility,
        uploadStatus: 'pending',
        size: requestedBytes,
        purpose: input.purpose,
      },
      select: { id: true },
    })

    return { ok: true as const, reservationId: record.id, limitBytes, usedBytes, reservedBytes }
  })
}

/** Convert a reservation into used storage after R2 size verification.
 *  If the actual size no longer fits, the reservation is released. */
export async function completeReservation(
  userId: string,
  key: string,
  actualBytes: number,
): Promise<{ ok: true; record: unknown } | { ok: false; reason: 'NOT_FOUND' | 'QUOTA_EXCEEDED' }> {
  const limitBytes = await getStorageLimitBytes(userId)
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`

    const pending = await tx.mediaFile.findFirst({
      where: { userId, objectKey: key, uploadStatus: 'pending' },
      select: { id: true },
    })
    if (!pending) return { ok: false as const, reason: 'NOT_FOUND' as const }

    const [complete, otherPending] = await Promise.all([
      tx.mediaFile.aggregate({
        where: { userId, storageProvider: 'r2', uploadStatus: 'complete' },
        _sum: { size: true },
      }),
      tx.mediaFile.aggregate({
        where: {
          userId, storageProvider: 'r2', uploadStatus: 'pending',
          createdAt: { gte: cutoff() }, id: { not: pending.id },
        },
        _sum: { size: true },
      }),
    ])
    const usedBytes = complete._sum.size || 0
    const reservedBytes = otherPending._sum.size || 0

    if (usedBytes + reservedBytes + actualBytes > limitBytes) {
      await tx.mediaFile.delete({ where: { id: pending.id } }).catch(() => {})
      return { ok: false as const, reason: 'QUOTA_EXCEEDED' as const }
    }

    const record = await tx.mediaFile.update({
      where: { id: pending.id },
      data: { uploadStatus: 'complete', size: actualBytes },
    })
    return { ok: true as const, record }
  })
}

/** Release a pending reservation (failed/aborted upload). Deleting a completed
 *  row is handled by the normal delete route; both reduce the aggregate. */
export async function releaseReservation(userId: string, key: string): Promise<void> {
  await prisma.mediaFile
    .deleteMany({ where: { userId, objectKey: key, uploadStatus: 'pending' } })
    .catch(() => {})
}

/** Cron helper: purge expired reservations so abandoned uploads free quota. */
export async function purgeExpiredReservations(): Promise<number> {
  const res = await prisma.mediaFile.deleteMany({
    where: { uploadStatus: 'pending', storageProvider: 'r2', createdAt: { lt: cutoff() } },
  })
  return res.count
}

/** Admin/reconciliation diagnostic: DB usage vs a supplied R2 object-size map. */
export async function reconcileUserStorage(userId: string, r2Sizes: Record<string, number>) {
  const rows = await prisma.mediaFile.findMany({
    where: { userId, storageProvider: 'r2', uploadStatus: 'complete' },
    select: { objectKey: true, size: true },
  })
  const dbBytes = rows.reduce((n, r) => n + r.size, 0)
  const r2Bytes = Object.values(r2Sizes).reduce((n, s) => n + s, 0)
  const missingInDb = Object.keys(r2Sizes).filter((k) => !rows.some((r) => r.objectKey === k))
  const missingInR2 = rows.filter((r) => r.objectKey && !(r.objectKey in r2Sizes)).map((r) => r.objectKey)
  return { dbBytes, r2Bytes, missingInDb, missingInR2 }
}
