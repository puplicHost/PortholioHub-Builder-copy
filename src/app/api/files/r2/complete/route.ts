import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headObject, getBucket, getPublicBaseUrl, isAllowedMime, maxSizeForFile, isVideoFile, deleteObject } from '@/lib/r2'
import { completeReservation } from '@/lib/storage-quota'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const key = typeof body?.key === 'string' ? body.key : ''
    const filename = typeof body?.filename === 'string' ? body.filename : ''
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : ''
    const visibility = body?.visibility === 'public' ? 'public' : 'private'
    const purpose = typeof body?.purpose === 'string' ? body.purpose : 'document'

    if (!key || !filename || !mimeType) return NextResponse.json({ error: 'key, filename, mimeType required' }, { status: 400 })
    if (!isAllowedMime(mimeType)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    if (!key.startsWith(`users/${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify object exists in R2
    let meta: { ContentLength?: number }
    try {
      meta = await headObject(key)
    } catch {
      return NextResponse.json({ error: 'Upload not found in storage' }, { status: 404 })
    }

    const size = Number(meta.ContentLength || 0)
    const maxSize = maxSizeForFile(mimeType, filename)
    const video = isVideoFile(mimeType, filename)
    if (size <= 0 || size > maxSize) {
      // Clean up orphaned object
      try { await deleteObject(key) } catch {}
      return NextResponse.json({ error: 'Invalid uploaded object size' }, { status: 400 })
    }

    // Idempotency: if already finalized, return the existing record.
    const alreadyComplete = await prisma.mediaFile.findFirst({
      where: { objectKey: key, userId: user.id, uploadStatus: 'complete' },
    })
    if (alreadyComplete) return NextResponse.json({ file: alreadyComplete })

    const completed = await completeReservation(user.id, key, size)
    if (!completed.ok) {
      if (completed.reason === 'NOT_FOUND') {
        // No matching pending reservation (expired/legacy): reject without
        // creating untracked storage.
        try { await deleteObject(key) } catch {}
        return NextResponse.json({ error: 'Upload reservation not found or expired', code: 'RESERVATION_NOT_FOUND' }, { status: 409 })
      }
      try { await deleteObject(key) } catch {}
      return NextResponse.json({ error: 'Storage quota exceeded', code: 'QUOTA_EXCEEDED' }, { status: 413 })
    }

    // Normalize final metadata on the completed row.
    const record = await prisma.mediaFile.update({
      where: { objectKey: key },
      data: {
        filename,
        mimeType,
        fileType: video ? 'video' : 'document',
        purpose,
        visibility,
        bucket: getBucket(),
        publicUrl: visibility === 'public' && getPublicBaseUrl() ? `${getPublicBaseUrl()}/${key}` : '',
        size,
      },
    })

    // For private files, publicUrl stays empty; clients use download endpoint by id.
    return NextResponse.json({ file: record })
  } catch (err) {
    console.error('[r2/complete]', err)
    return NextResponse.json({ error: 'Complete failed' }, { status: 500 })
  }
}