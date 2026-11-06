import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getStorageUsage } from '@/lib/storage-quota'

// GET /api/me/storage — authenticated quota usage for the current user only.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const usage = await getStorageUsage(user.id)
    return NextResponse.json({
      limitBytes: usage.limitBytes,
      usedBytes: usage.usedBytes,
      reservedBytes: usage.reservedBytes,
      remainingBytes: usage.remainingBytes,
      percent: usage.percent,
      uploadsAllowed: usage.uploadsAllowed,
    })
  } catch (err) {
    console.error('[me/storage]', err)
    return NextResponse.json({ error: 'Storage accounting unavailable' }, { status: 503 })
  }
}