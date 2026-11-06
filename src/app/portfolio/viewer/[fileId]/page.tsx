import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getServerLang } from '@/lib/i18n/server'
import { FileViewer } from './FileViewer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'File Viewer | PortfolioHub',
  robots: { index: false, follow: false },
}

export default async function ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ fileId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { fileId } = await params
  const { from } = await searchParams

  const file = await prisma.mediaFile.findUnique({ where: { id: fileId } })
  if (!file || file.storageProvider !== 'r2' || !file.objectKey) notFound()

  if (file.visibility !== 'public') {
    const user = await getCurrentUser()
    if (!user || file.userId !== user.id) notFound()
  }

  const lang = await getServerLang()
  const safeFrom = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null

  return (
    <FileViewer
      id={file.id}
      filename={file.filename}
      mimeType={file.mimeType}
      size={file.size}
      lang={lang}
      backHref={safeFrom}
      contentUrl={`/api/files/r2/${file.id}/content`}
      downloadUrl={`/api/files/r2/${file.id}`}
    />
  )
}