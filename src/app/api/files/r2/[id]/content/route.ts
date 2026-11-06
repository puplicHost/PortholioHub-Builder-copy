import { NextResponse } from 'next/server'
import { Readable } from 'stream'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getObject, headObject } from '@/lib/r2'

function safeFilename(name: string): string {
  return (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160)
}

async function authorize(id: string, requireOwner: boolean) {
  const file = await prisma.mediaFile.findUnique({ where: { id } })
  if (!file || file.storageProvider !== 'r2' || !file.objectKey) return null
  if (file.visibility !== 'public' || requireOwner) {
    const user = await getCurrentUser()
    if (!user || file.userId !== user.id) return null
  }
  return file
}

export async function HEAD(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = await authorize(id, false)
  if (!file) return new Response(null, { status: 404 })

  let obj
  try {
    obj = await headObject(file.objectKey!)
  } catch {
    return new Response(null, { status: 404 })
  }
  const headers = new Headers()
  headers.set('Content-Type', file.mimeType)
  headers.set('Content-Length', String(obj.ContentLength || file.size || 0))
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Disposition', `inline; filename="${safeFilename(file.filename)}"`)
  headers.set('Cache-Control', 'private, max-age=60')
  return new Response(null, { status: 200, headers })
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const file = await authorize(id, false)
    if (!file) return new Response('Not found', { status: 404 })

    const range = req.headers.get('range') || undefined
    let obj
    try {
      obj = await getObject(file.objectKey!, range)
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name
      if (name === 'InvalidRange' || name === 'RangeNotSatisfiable') {
        return new Response('Range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${file.size || 0}` },
        })
      }
      throw err
    }

    const headers = new Headers()
    headers.set('Content-Type', file.mimeType)
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Disposition', `inline; filename="${safeFilename(file.filename)}"`)
    headers.set('Cache-Control', 'private, max-age=60')
    if (obj.ContentLength !== undefined) headers.set('Content-Length', String(obj.ContentLength))
    if (obj.ContentRange) headers.set('Content-Range', obj.ContentRange)

    const status = range && obj.ContentRange ? 206 : 200
    const body = obj.Body ? (Readable.toWeb(obj.Body as Readable) as ReadableStream) : null
    return new Response(body, { status, headers })
  } catch (err) {
    console.error('[r2/content]', err)
    return new Response('Stream failed', { status: 500 })
  }
}