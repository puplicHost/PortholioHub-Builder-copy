import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { presignPart } from '@/lib/r2'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const key = typeof body?.key === 'string' ? body.key : ''
    const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''
    const partNumber = typeof body?.partNumber === 'number' ? body.partNumber : 0

    if (!key || !uploadId || partNumber < 1) return NextResponse.json({ error: 'key, uploadId, partNumber required' }, { status: 400 })
    if (!key.startsWith(`users/${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = await presignPart(key, uploadId, partNumber, 300)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[r2/multipart/presign-part]', err)
    return NextResponse.json({ error: 'Presign part failed' }, { status: 500 })
  }
}