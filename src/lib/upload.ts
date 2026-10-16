/**
 * ⚠️  VERCEL INCOMPATIBLE — Local filesystem uploads
 * This module writes to public/uploads which is ephemeral on Vercel.
 * Files will be lost on every deployment or serverless function cold start.
 * Before going to production on Vercel, migrate to:
 *   - Cloudinary (CLOUDINARY_API_SECRET already in .env.example)
 *   - Supabase Storage (NEXT_PUBLIC_SUPABASE_URL already configured)
 *   - Vercel Blob (@vercel/blob)
 * Track: https://vercel.com/docs/storage
 */
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

// IMPORTANT: In production Docker, mount a volume:
// docker-compose.yml: volumes: - ./uploads:/app/public/uploads
// This ensures files persist across container restarts/rebuilds.
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
]

export type FileType = 'image' | 'pdf' | 'docx' | 'sheet'

export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 20 * 1024 * 1024, // 20MB
}

export function getFileType(mimeType: string): FileType | null {
  if (IMAGE_TYPES.includes(mimeType)) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') return 'docx'
  if (mimeType.includes('spreadsheetml')) return 'sheet'
  return null
}

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
): Promise<{ storedName: string; path: string; publicUrl: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  const ext = path.extname(originalName) || '.bin'
  const storedName = `${userId}-${randomUUID()}${ext}`
  const filePath = path.join(UPLOAD_DIR, storedName)

  await fs.writeFile(filePath, buffer)

  return {
    storedName,
    path: filePath,
    publicUrl: `/uploads/${storedName}`,
  }
}
