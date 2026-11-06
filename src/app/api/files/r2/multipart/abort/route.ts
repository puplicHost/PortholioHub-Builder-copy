import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { abortMultipartUpload } from '@/lib/r2'
import { releaseReservation } from '@/lib/storage-quota'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const key = typeof body?.key === 'string' ? body.key : ''
    const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''
    if (!key || !uploadId) return NextResponse.json({ error: 'key and uploadId required' }, { status: 400 })
    if (!key.startsWith(`users/${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await abortMultipartUpload(key, uploadId)
    await releaseReservation(user.id, key)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[r2/multipart/abort]', err)
    return NextResponse.json({ error: 'Abort failed' }, { status: 500 })
  }
}