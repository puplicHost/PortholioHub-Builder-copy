import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { presignDownload, deleteObject } from '@/lib/r2'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const file = await prisma.mediaFile.findUnique({ where: { id } })
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (file.storageProvider !== 'r2' || !file.objectKey) return NextResponse.json({ error: 'Not an R2 file' }, { status: 400 })

    // Public portfolio files are readable by anyone; private files require the owner.
    if (file.visibility !== 'public') {
      const user = await getCurrentUser()
      if (!user || file.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (file.visibility === 'public' && process.env.R2_PUBLIC_BASE_URL) {
      return NextResponse.redirect(`${process.env.R2_PUBLIC_BASE_URL}/${file.objectKey}`)
    }

    const url = await presignDownload(file.objectKey, file.filename, 300)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[r2/download]', err)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const file = await prisma.mediaFile.findUnique({ where: { id } })
    if (!file || file.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (file.storageProvider !== 'r2' || !file.objectKey) return NextResponse.json({ error: 'Not an R2 file' }, { status: 400 })

    try { await deleteObject(file.objectKey) } catch (e) { console.error('R2 delete failed', e) }
    await prisma.mediaFile.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[r2/delete]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}