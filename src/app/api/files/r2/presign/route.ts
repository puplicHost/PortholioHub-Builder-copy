import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAllowedMime, maxSizeForFile, buildObjectKey, presignUpload, isVideoFile } from '@/lib/r2'
import { reserveStorage, releaseReservation } from '@/lib/storage-quota'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const filename = typeof body?.filename === 'string' ? body.filename : ''
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : ''
    const size = typeof body?.size === 'number' ? body.size : 0
    const visibility = body?.visibility === 'public' ? 'public' : 'private'

    if (!filename || !mimeType) return NextResponse.json({ error: 'filename and mimeType required' }, { status: 400 })
    if (!isAllowedMime(mimeType)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    const maxSize = maxSizeForFile(mimeType, filename)
    if (size <= 0 || size > maxSize) return NextResponse.json({ error: isVideoFile(mimeType, filename) ? 'Maximum video size is 50 MB' : `File size must be between 1 and ${maxSize} bytes` }, { status: 400 })

    const key = buildObjectKey(user.id, filename)
    const reservation = await reserveStorage(user.id, size, {
      key, filename, mimeType, visibility, purpose: 'document',
    })
    if (!reservation.ok) {
      return NextResponse.json(
        {
          error: reservation.reason === 'SUBSCRIPTION_REQUIRED'
            ? 'Storage requires an eligible subscription'
            : 'Storage quota exceeded',
          code: reservation.reason,
          limitBytes: reservation.limitBytes,
          usedBytes: reservation.usedBytes,
          reservedBytes: reservation.reservedBytes,
        },
        { status: 413 },
      )
    }

    let uploadUrl: string
    try {
      uploadUrl = await presignUpload(key, mimeType, 300)
    } catch (err) {
      await releaseReservation(user.id, key)
      throw err
    }

    return NextResponse.json({ uploadUrl, key, visibility, isVideo: isVideoFile(mimeType, filename) })
  } catch (err) {
    console.error('[r2/presign]', err)
    return NextResponse.json({ error: 'Presign failed' }, { status: 500 })
  }
}