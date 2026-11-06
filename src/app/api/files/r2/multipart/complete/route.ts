import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { completeMultipartUpload, headObject, getBucket, getPublicBaseUrl, isAllowedMime, maxSizeForFile, isVideoFile, deleteObject } from '@/lib/r2'
import { completeReservation } from '@/lib/storage-quota'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const key = typeof body?.key === 'string' ? body.key : ''
    const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''
    const parts = Array.isArray(body?.parts) ? body.parts : []
    const filename = typeof body?.filename === 'string' ? body.filename : ''
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : ''
    const visibility = body?.visibility === 'public' ? 'public' : 'private'
    const purpose = typeof body?.purpose === 'string' ? body.purpose : 'document'

    if (!key || !uploadId || parts.length === 0 || !filename || !mimeType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!isAllowedMime(mimeType)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    if (!key.startsWith(`users/${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await completeMultipartUpload(key, uploadId, parts.map((p: { ETag: string; PartNumber: number }) => ({ ETag: p.ETag, PartNumber: p.PartNumber })))

    let meta: { ContentLength?: number }
    try { meta = await headObject(key) } catch {
      return NextResponse.json({ error: 'Upload not found in storage' }, { status: 404 })
    }
    const size = Number(meta.ContentLength || 0)
    const maxSize = maxSizeForFile(mimeType, filename)
    const video = isVideoFile(mimeType, filename)
    if (size <= 0 || size > maxSize) {
      try { await deleteObject(key) } catch {}
      return NextResponse.json({ error: 'Invalid uploaded object size' }, { status: 400 })
    }

    const alreadyComplete = await prisma.mediaFile.findFirst({
      where: { objectKey: key, userId: user.id, uploadStatus: 'complete' },
    })
    if (alreadyComplete) return NextResponse.json({ file: alreadyComplete })

    const completed = await completeReservation(user.id, key, size)
    if (!completed.ok) {
      try { await deleteObject(key) } catch {}
      return NextResponse.json(
        { error: completed.reason === 'NOT_FOUND' ? 'Upload reservation not found or expired' : 'Storage quota exceeded', code: completed.reason },
        { status: completed.reason === 'NOT_FOUND' ? 409 : 413 },
      )
    }

    const record = await prisma.mediaFile.update({
      where: { objectKey: key },
      data: {
        filename, mimeType, fileType: video ? 'video' : 'document', purpose, visibility,
        bucket: getBucket(),
        publicUrl: visibility === 'public' && getPublicBaseUrl() ? `${getPublicBaseUrl()}/${key}` : '',
        size,
      },
    })
    return NextResponse.json({ file: record })
  } catch (err) {
    console.error('[r2/multipart/complete]', err)
    return NextResponse.json({ error: 'Complete failed' }, { status: 500 })
  }
}